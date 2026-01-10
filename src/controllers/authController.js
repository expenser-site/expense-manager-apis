import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import logger from '../config/logger.js';
import emailService from '../services/email/index.js';
import { addUserLinks, userLinks } from '../utils/hateoas.js';

// Validate JWT secret at module load
if (!process.env.JWT_SECRET) {
  logger.logError(new Error('JWT_SECRET is not defined'), null, {
    context: 'auth-controller-init'
  });
  throw new Error('FATAL: JWT_SECRET environment variable is required');
}

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Validate name
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required and cannot be empty' });
    }
    if (name.length > 100) {
      return res.status(400).json({ error: 'Name cannot exceed 100 characters' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use transaction to ensure atomic user creation with default categories
    const user = await prisma.$transaction(async tx => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name
        },
        select: {
          id: true,
          email: true,
          name: true,
          authProvider: true,
          createdAt: true
        }
      });

      // Create default categories for the new user within the same transaction
      await tx.category.createMany({
        data: [
          { name: 'No Category', color: '#9CA3AF', icon: '📋', userId: newUser.id },
          { name: 'Food & Dining', color: '#EF4444', icon: '🍔', userId: newUser.id },
          { name: 'Transportation', color: '#3B82F6', icon: '🚗', userId: newUser.id },
          { name: 'Shopping', color: '#8B5CF6', icon: '🛍️', userId: newUser.id },
          { name: 'Entertainment', color: '#EC4899', icon: '🎬', userId: newUser.id },
          { name: 'Bills & Utilities', color: '#F59E0B', icon: '💡', userId: newUser.id },
          { name: 'Healthcare', color: '#10B981', icon: '⚕️', userId: newUser.id },
          { name: 'Education', color: '#06B6D4', icon: '📚', userId: newUser.id },
          { name: 'Travel', color: '#6366F1', icon: '✈️', userId: newUser.id },
          { name: 'Personal Care', color: '#EC4899', icon: '💆', userId: newUser.id },
          { name: 'Groceries', color: '#84CC16', icon: '🛒', userId: newUser.id },
          { name: 'Other', color: '#64748B', icon: '📌', userId: newUser.id }
        ]
      });

      return newUser;
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // Send welcome email (don't wait for it)
    emailService
      .sendWelcomeEmail(user.email, {
        name: user.name,
        loginUrl: process.env.FRONTEND_URL || 'https://app.expenser.site/dashboard'
      })
      .catch(error => {
        logger.logError(error, null, {
          context: 'send-welcome-email',
          userId: user.id
        });
      });

    // Send getting started email after a delay (don't wait for it)
    setTimeout(() => {
      emailService
        .sendGettingStartedEmail(user.email, {
          name: user.name,
          dashboardUrl: process.env.FRONTEND_URL || 'https://app.expenser.site/dashboard'
        })
        .catch(error => {
          logger.logError(error, null, {
            context: 'send-getting-started-email',
            userId: user.id
          });
        });
    }, 5000); // 5 seconds delay

    res.status(201).json({
      message: 'User registered successfully',
      user: addUserLinks(user),
      token,
      _links: [userLinks.self(), userLinks.dashboard()]
    });
  } catch (error) {
    logger.logError(error, null, { context: 'user-registration' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user registered with OAuth
    if (user.authProvider !== 'local' || !user.password) {
      return res.status(401).json({
        error: `This account is registered with ${user.authProvider}. Please use ${user.authProvider} to log in.`
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      message: 'Login successful',
      user: addUserLinks({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        authProvider: user.authProvider
      }),
      token,
      _links: [userLinks.self(), userLinks.dashboard()]
    });
  } catch (error) {
    logger.logError(error, null, { context: 'user-login' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        authProvider: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(addUserLinks(user));
  } catch (error) {
    logger.logError(error, null, { context: 'get-user-profile' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, avatar } = req.body;

    // Prevent email changes
    if (email) {
      return res.status(400).json({
        error: 'Email cannot be changed. Please contact support if you need to update your email.'
      });
    }

    const updateData = {};

    // Allow name updates
    if (name !== undefined) {
      if (name && name.trim().length === 0) {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }
      if (name && name.length > 100) {
        return res.status(400).json({ error: 'Name cannot exceed 100 characters' });
      }
      updateData.name = name;
    }

    // Allow avatar updates
    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        authProvider: true,
        createdAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: addUserLinks(user)
    });
  } catch (error) {
    logger.logError(error, null, { context: 'update-user-profile' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Change password (requires current password)
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user registered with OAuth
    if (user.authProvider !== 'local' || !user.password) {
      return res.status(400).json({
        error: 'Cannot change password for OAuth accounts'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res
        .status(400)
        .json({ error: 'New password must be different from current password' });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword }
    });

    // Send password changed notification email (don't wait for it)
    emailService
      .sendPasswordChangedEmail(user.email, {
        name: user.name,
        changedAt: new Date(),
        loginUrl: process.env.FRONTEND_URL || 'https://app.expenser.site/login'
      })
      .catch(error => {
        logger.logError(error, null, {
          context: 'send-password-changed-email',
          userId: user.id
        });
      });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.logError(error, null, { context: 'change-password' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete account
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password for local accounts
    if (user.authProvider === 'local' && user.password) {
      if (!password) {
        return res.status(400).json({ error: 'Password is required to delete account' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Delete user (cascades to expenses and categories)
    await prisma.user.delete({
      where: { id: req.userId }
    });

    // Send account deletion confirmation email after successful deletion (don't wait for it)
    emailService
      .sendAccountDeletionEmail(user.email, {
        name: user.name,
        deletionDate: new Date(),
        cancelUrl: null, // No cancel option since already deleted
        daysUntilDeletion: 0
      })
      .catch(error => {
        logger.logError(error, null, {
          context: 'send-account-deletion-email',
          userId: user.id
        });
      });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.logError(error, null, { context: 'delete-account' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Forgot password - Send reset token
const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    logger.info('Forgot password request', {
      email,
      userFound: !!user,
      authProvider: user?.authProvider
    });

    // Always return success message (don't reveal if user exists)
    if (!user) {
      logger.info('User not found for forgot password', { email });
      return res.json({
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Only allow password reset for local accounts
    if (user.authProvider !== 'local' || !user.password) {
      logger.info('User not eligible for password reset', {
        email,
        authProvider: user.authProvider,
        hasPassword: !!user.password
      });
      return res.json({
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: resetExpires
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // Send password reset email (don't wait for it)
    emailService
      .sendForgotPasswordEmail(user.email, {
        name: user.name,
        resetUrl,
        resetToken,
        expiryMinutes: 60
      })
      .then(() => {
        logger.info('Forgot password email sent successfully', {
          userId: user.id,
          email: user.email
        });
      })
      .catch(error => {
        logger.logError(error, null, {
          context: 'send-forgot-password-email',
          userId: user.id,
          email: user.email,
          errorMessage: error.message,
          errorStack: error.stack
        });
      });

    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
      // Remove this in production (only for testing)
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    logger.logError(error, null, { context: 'forgot-password' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date() // Token not expired
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    // Send password reset confirmation email (don't wait for it)
    emailService
      .sendResetPasswordEmail(user.email, {
        name: user.name,
        loginUrl: process.env.FRONTEND_URL || 'https://app.expenser.site/login'
      })
      .catch(error => {
        logger.logError(error, null, {
          context: 'send-reset-password-email',
          userId: user.id
        });
      });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    logger.logError(error, null, { context: 'reset-password' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Google OAuth callback handler
const googleCallback = async (req, res) => {
  try {
    // User is already authenticated by passport
    const user = req.user;

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    // In production, redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}`;

    res.redirect(redirectUrl);
  } catch (error) {
    logger.logError(error, null, { context: 'google-oauth-callback' });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/error?message=Authentication failed`);
  }
};

// Google OAuth failure handler
const googleFailure = (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/auth/error?message=Google authentication failed`);
};

export {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  forgotPassword,
  resetPassword,
  googleCallback,
  googleFailure
};
