# Budget Alerts Feature - Implementation Summary

## ✅ Completed: Budget Alerts (80% & 100% Thresholds)

### Implementation Overview

The budget alert system automatically monitors spending and sends email
notifications when users reach 80% or 100% of their budget. The system includes
duplicate prevention, beautiful HTML email templates, and automatic checking
triggered by expense changes.

---

## 📁 Files Created/Modified

### **New Files Created**

1. **`src/services/budgetAlertService.js`** (300+ lines)
   - Main service handling alert logic
   - Methods: `checkAndSendAlerts()`, `sendAlertIfNeeded()`, `resetAlerts()`,
     `checkAllBudgets()`, `calculateBudgetSpending()`
   - Prevents duplicate alerts using database tracking
   - Supports both overall and category-specific budgets

2. **`src/services/email/templates/budgetAlert.js`** (120+ lines)
   - Beautiful HTML email template
   - Shows budget details, spending breakdown, category info
   - Different styling for warning (80%) vs danger (100%)
   - Responsive design with action button

3. **`docs/BUDGET_ALERTS.md`** (400+ lines)
   - Complete documentation
   - Architecture overview
   - Usage examples
   - Configuration guide
   - Troubleshooting section

4. **`scripts/migrate-budget-alerts.sh`**
   - Migration helper script
   - Runs Prisma migration
   - Provides success confirmation

### **Files Modified**

5. **`prisma/schema.prisma`**
   - Added `BudgetAlert` model with fields:
     - `id`, `budgetId`, `threshold`, `sentAt`, `spentAmount`, `spentPercent`
     - Unique constraint on `[budgetId, threshold]` to prevent duplicates
   - Updated `Budget` model to include `alerts` relationship
   - Indexes for performance

6. **`src/controllers/budgetController.js`**
   - Imported `budgetAlertService`
   - Added alert checking to `getBudgetStatus()` endpoint
   - Checks all budgets with spending ≥ 80% asynchronously

7. **`src/controllers/expenseController.js`**
   - Imported `budgetAlertService`
   - Added alert checking to `createExpense()` - checks affected budgets after
     creation
   - Added alert checking to `updateExpense()` - checks affected budgets after
     update
   - Added alert checking to `deleteExpense()` - checks if deletion affects
     budgets

8. **`src/services/email/templates/index.js`**
   - Added export for `budgetAlertTemplate`

---

## 🏗️ Database Schema Changes

### New Table: `budget_alerts`

```sql
CREATE TABLE budget_alerts (
  id           VARCHAR(36) PRIMARY KEY,
  budgetId     VARCHAR(36) NOT NULL,
  threshold    INTEGER NOT NULL,        -- 80 or 100
  sentAt       TIMESTAMP DEFAULT NOW(),
  spentAmount  DECIMAL(10,2) NOT NULL,
  spentPercent DECIMAL(5,2) NOT NULL,

  FOREIGN KEY (budgetId) REFERENCES budgets(id) ON DELETE CASCADE,
  UNIQUE (budgetId, threshold),
  INDEX idx_budgetId (budgetId)
);
```

---

## 🔄 How It Works

### Alert Trigger Flow

```
1. User creates/updates/deletes an expense
   ↓
2. System identifies affected budgets
   ↓
3. Calculates current spending for each budget
   ↓
4. Checks if spending ≥ 80% or ≥ 100%
   ↓
5. Checks if alert already sent (via budget_alerts table)
   ↓
6. Sends email notification (if new)
   ↓
7. Records alert in database
```

### Alert Checking Triggers

1. **POST /api/v1/expenses** - After creating expense
2. **PUT /api/v1/expenses/:id** - After updating expense
3. **DELETE /api/v1/expenses/:id** - After deleting expense
4. **GET /api/v1/budgets/status** - When viewing budget status
5. **Manual**: Call `budgetAlertService.checkAllBudgets()` (for cron jobs)

---

## 📧 Email Notifications

### 80% Warning Email

- **Subject**: `⚠️ Budget Alert: 80% Reached - [Budget Name] ([Period])`
- **Content**:
  - Warning message
  - Budget details table (amount, spent, percentage, remaining)
  - Category information
  - Helpful tip
  - "View Budget Details" action button

### 100% Exceeded Email

- **Subject**: `⚠️ Budget Exceeded - [Budget Name] ([Period])`
- **Content**:
  - Alert message (exceeded budget)
  - Budget details table (shows negative remaining)
  - Category information
  - Review spending tip
  - "View Budget Details" action button

### Email Features

- ✅ Beautiful HTML template with responsive design
- ✅ Plain text fallback
- ✅ Color-coded alerts (orange for 80%, red for 100%)
- ✅ Currency formatting
- ✅ Category names displayed
- ✅ Period information (month/year)

---

## 🚀 Usage Examples

### Creating a Budget with Alerts

```javascript
POST /api/v1/budgets
{
  "amount": 500,
  "currency": "USD",
  "period": "monthly",
  "month": 1,
  "year": 2026,
  "categoryIds": ["category-id-1", "category-id-2"],
  "alertAt80": true,   // Enable 80% alert
  "alertAt100": true   // Enable 100% alert
}
```

### Manual Alert Check (Cron Job)

```javascript
import budgetAlertService from './services/budgetAlertService.js';
import cron from 'node-cron';

// Check all budgets daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Checking budgets for alerts...');
  await budgetAlertService.checkAllBudgets();
});
```

### Programmatic Usage

```javascript
// Check specific budget
await budgetAlertService.checkAndSendAlerts(
  budgetId,
  450.5, // spentAmount
  90.1 // spentPercent
);

// Reset alerts (e.g., new month started)
await budgetAlertService.resetAlerts(budgetId);

// Calculate current spending
const { spentAmount, spentPercent } =
  await budgetAlertService.calculateBudgetSpending(budget);
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Email Provider (required)
EMAIL_PROVIDER=DEVELOPMENT  # or ZEPTOMAIL for production

# ZEPTOMAIL Configuration (if using ZEPTOMAIL)
EMAIL_API_KEY=your_api_key
EMAIL_FROM=no-reply@expenser.site
EMAIL_REPLY_TO=contact@expenser.site

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5174
```

---

## 📋 Migration Steps

### 1. Run Database Migration

```bash
cd expense-manager-apis

# Option 1: Use helper script
./scripts/migrate-budget-alerts.sh

# Option 2: Manual migration
npx prisma migrate dev --name add_budget_alerts
```

### 2. Verify Migration

```bash
# Check Prisma client
npx prisma generate

# Verify table creation
npx prisma studio
# Look for "budget_alerts" table
```

### 3. Test Alert System

```bash
# Start development server
npm run dev

# Create a budget via API
# Add expenses until 80% threshold
# Check email (console if DEVELOPMENT provider)
```

---

## ✨ Features Implemented

- ✅ 80% threshold alert
- ✅ 100% threshold alert
- ✅ Duplicate prevention (one alert per threshold)
- ✅ Beautiful HTML email templates
- ✅ Automatic trigger on expense create/update/delete
- ✅ Async processing (non-blocking)
- ✅ Category-aware budgets
- ✅ Overall budgets
- ✅ Monthly and yearly budgets
- ✅ Email with spending breakdown
- ✅ Currency formatting
- ✅ Alert history tracking
- ✅ Configurable per budget
- ✅ Manual check capability (for cron)
- ✅ Comprehensive error handling
- ✅ Logging

---

## 🧪 Testing

### Test Scenarios

1. **Basic Alert Flow**
   - Create budget with $100 limit
   - Add expenses totaling $80 → Should receive 80% alert
   - Add more expenses totaling $105 → Should receive 100% alert
   - Verify no duplicate alerts

2. **Category-Specific Budget**
   - Create budget for "Food" category
   - Add food expenses
   - Verify alerts only for food spending

3. **Monthly vs Yearly**
   - Create monthly budget for January
   - Add expenses in January → Alert
   - Add expenses in February → No alert (different period)

4. **Alert Persistence**
   - Trigger 80% alert
   - Delete an expense (drop to 75%)
   - Add expense again (back to 80%)
   - Verify no duplicate alert

### Test Commands

```bash
# Run all tests
npm test

# Run budget tests specifically
npm test -- budgets

# Check email service
npm run test:email
```

---

## 📊 Performance Considerations

1. **Async Processing**: Alerts run asynchronously via `setImmediate()` to avoid
   blocking API responses
2. **Batch Queries**: Efficiently queries affected budgets in batches
3. **Database Indexing**: Indexes on `budgetId` and `threshold` for fast lookups
4. **Unique Constraints**: Prevents duplicate alerts at database level
5. **Conditional Checks**: Only checks budgets with spending ≥ 80%

---

## 🐛 Troubleshooting

### Alerts Not Sending

**Problem**: Created expense but no alert received

**Solution**:

1. Check email provider: `EMAIL_PROVIDER=DEVELOPMENT` logs to console
2. Verify budget has alerts enabled: `alertAt80` and `alertAt100`
3. Check logs: `tail -f logs/combined.log | grep budget-alert`
4. Verify user email exists in database

### Duplicate Alerts

**Problem**: Received multiple alerts for same threshold

**Solution**: Should be prevented by unique constraint. If occurs:

```javascript
// Reset alerts manually
await budgetAlertService.resetAlerts(budgetId);
```

### Email Not Received (Production)

**Problem**: Alert logged but email not received

**Solution**:

1. Check ZEPTOMAIL configuration
2. Verify EMAIL_API_KEY is correct
3. Check spam folder
4. Verify user email is valid

---

## 📚 Related Documentation

- [Budget API Documentation](./docs/BUDGET_README.md)
- [Budget Alert System](./docs/BUDGET_ALERTS.md)
- [Email Service README](./src/services/email/README.md)
- [Prisma Schema](./prisma/schema.prisma)

---

## 🎯 Todo List Status

✅ **Backend (expense-manager-apis):**

- ✅ Create Budget model in Prisma schema
- ✅ Add budget CRUD endpoints
- ✅ Add GET /budgets/status endpoint
- ✅ Update dashboard controller
- ✅ **Add budget alerts when spending reaches 80%, 100%** ← **COMPLETED**

---

## 🚀 Next Steps

1. **Run Migration**: `./scripts/migrate-budget-alerts.sh`
2. **Test Locally**: Create budgets and add expenses
3. **Configure Email**: Set up ZEPTOMAIL for production
4. **Deploy**: Push to production and run migrations
5. **Monitor**: Check logs for alert activity

---

## 💡 Future Enhancements

- [ ] Custom threshold percentages (not just 80%, 100%)
- [ ] SMS/Push notifications
- [ ] Weekly/Monthly summary emails
- [ ] In-app notification system
- [ ] Alert frequency settings (immediate vs daily digest)
- [ ] Alert history dashboard in frontend
- [ ] Budget forecast alerts (projected to exceed)

---

**Implementation Date**: April 5, 2026 **Status**: ✅ Ready for Migration &
Testing
