# Security Features Quick Reference

**Last Updated:** February 4, 2026

---

## 🔐 Authentication & Authorization

### Admin Access Control

**Purpose:** Restrict system-wide operations to authorized administrators

**Configuration:**

```env
ADMIN_EMAILS=admin@example.com,superadmin@example.com
```

**Protected Routes:**

- `POST /api/v1/migration/default-categories` - Seed default categories for all
  users
- `POST /api/v1/migration/status` - View migration status
- `POST /api/v1/migration/fix-orphan-expenses` - Fix orphaned expense records

**Response Codes:**

- `200` - Admin operation successful
- `401` - Not authenticated (missing/invalid token)
- `403` - Not authorized (not an admin)
- `500` - Server error

**Testing:**

```bash
# Non-admin user (should fail with 403)
curl -X POST http://localhost:3000/api/v1/migration/default-categories \
  -H "Authorization: Bearer <user_token>"

# Admin user (should succeed)
curl -X POST http://localhost:3000/api/v1/migration/default-categories \
  -H "Authorization: Bearer <admin_token>"
```

---

## 🚦 Rate Limiting

### Auth Endpoints

**Limit:** 5 requests per 15 minutes  
**Applies To:** `/api/v1/auth/*`

**Headers:**

- `RateLimit-Limit: 5` - Maximum requests allowed
- `RateLimit-Remaining: 3` - Remaining requests
- `RateLimit-Reset: 1609459200` - Unix timestamp when limit resets

**Response (429 Too Many Requests):**

```json
{
  "error": "Too many authentication attempts, please try again in 15 minutes."
}
```

### General API Endpoints

**Limit:** 100 requests per 15 minutes  
**Applies To:**

- `/api/v1/expenses/*`
- `/api/v1/dashboard/*`
- `/api/v1/categories/*`
- `/api/v1/budgets/*`
- `/api/v1/migration/*`

**Response (429 Too Many Requests):**

```json
{
  "error": "Too many requests, please try again later."
}
```

**Bypassing Rate Limits (Testing):**

```javascript
// Wait for rate limit window to reset
// OR restart server (rate limits stored in memory)
// OR implement Redis store for persistent rate limiting
```

---

## 🛡️ Security Headers (Helmet)

### Enabled Headers

| Header                      | Value                                          | Purpose                  |
| --------------------------- | ---------------------------------------------- | ------------------------ |
| `Content-Security-Policy`   | See CSP section                                | Prevents XSS attacks     |
| `X-Frame-Options`           | `DENY`                                         | Prevents clickjacking    |
| `X-Content-Type-Options`    | `nosniff`                                      | Prevents MIME sniffing   |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS             |
| `X-DNS-Prefetch-Control`    | `off`                                          | Controls DNS prefetching |
| `X-Download-Options`        | `noopen`                                       | IE8+ download behavior   |

### Content Security Policy (CSP)

```javascript
{
  defaultSrc: ["'self'"],           // Only same-origin by default
  styleSrc: ["'self'", "'unsafe-inline'"],  // Inline styles allowed
  scriptSrc: ["'self'"],            // Only same-origin scripts
  imgSrc: ["'self'", "data:", "https:"],  // Images from anywhere over HTTPS
  connectSrc: ["'self'"],           // API calls to same origin only
  fontSrc: ["'self'"],              // Fonts from same origin
  objectSrc: ["'none'"],            // No plugins (Flash, etc.)
  mediaSrc: ["'self'"],             // Media from same origin
  frameSrc: ["'none'"]              // No iframes
}
```

**Testing CSP:**

```bash
# Check headers in response
curl -I http://localhost:3000/api/v1/health

# Look for:
# Content-Security-Policy: default-src 'self'; ...
```

---

## 📏 Request Size Limits

**Maximum Payload:** 1MB  
**Applies To:** All POST/PUT/PATCH requests

**Rejected Payloads:**

- JSON bodies larger than 1MB
- URL-encoded bodies larger than 1MB

**Response (413 Payload Too Large):**

```json
{
  "error": "request entity too large"
}
```

**Testing:**

```bash
# Generate large payload (should fail)
dd if=/dev/zero bs=1048577 count=1 | \
  curl -X POST http://localhost:3000/api/v1/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  --data-binary @-
```

---

## ✅ Input Validation

### Budget Routes Validation

**POST /api/v1/budgets**

```javascript
{
  "amount": 1000,           // Required: number, min 0.01
  "currency": "USD",        // Required: enum [USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, BDT]
  "period": "monthly",      // Required: enum [monthly, yearly]
  "month": 1,               // Optional: integer 1-12 (required for monthly)
  "year": 2026,             // Required: integer 2000-2100
  "categoryId": "uuid",     // Optional: valid UUID v4
  "notes": "Budget notes"   // Optional: string, max 500 chars
}
```

**GET /api/v1/budgets**

```javascript
// Query parameters
?period=monthly      // Optional: enum [monthly, yearly]
&year=2026           // Optional: integer 2000-2100
&month=1             // Optional: integer 1-12
&categoryId=<uuid>   // Optional: valid UUID v4
&page=1              // Optional: integer >= 1
&limit=50            // Optional: integer 1-100
```

**Validation Error Response (400):**

```json
{
  "errors": [
    {
      "type": "field",
      "msg": "Amount must be at least 0.01",
      "path": "amount",
      "location": "body"
    }
  ]
}
```

---

## 🔄 Graceful Shutdown

### Supported Signals

- `SIGTERM` - Termination signal (Kubernetes, Docker)
- `SIGINT` - Interrupt signal (Ctrl+C)
- `uncaughtException` - Unhandled exceptions
- `unhandledRejection` - Unhandled promise rejections

### Shutdown Sequence

1. Log shutdown signal received
2. Stop accepting new connections
3. Close HTTP server
4. Disconnect database (Prisma)
5. Exit with code 0 (success) or 1 (error)
6. Force shutdown after 30 seconds if graceful fails

**Testing:**

```bash
# Start server
npm start

# Send SIGTERM
kill -SIGTERM <pid>

# Or Ctrl+C for SIGINT
# Server should log:
# "SIGTERM signal received: closing HTTP server"
# "HTTP server closed"
# "Database connection closed"
```

---

## 🧪 Security Testing Checklist

### Admin Authorization

- [ ] Non-admin user cannot access migration routes (403)
- [ ] Admin user can access migration routes (200)
- [ ] Missing ADMIN_EMAILS env returns 500 with proper error
- [ ] Invalid admin email format logged and rejected

### Rate Limiting

- [ ] 6th login attempt within 15 minutes blocked (429)
- [ ] Successful login doesn't count against limit
- [ ] 101st API request within 15 minutes blocked (429)
- [ ] Rate limit headers present in responses

### Input Validation

- [ ] Invalid budget amount rejected (400)
- [ ] Invalid currency code rejected (400)
- [ ] Invalid UUID format rejected (400)
- [ ] Month out of range (13) rejected (400)
- [ ] Year out of range (1999, 2101) rejected (400)

### Security Headers

- [ ] CSP header present in all responses
- [ ] HSTS header present in production
- [ ] X-Frame-Options set to DENY
- [ ] X-Content-Type-Options set to nosniff

### Request Size Limits

- [ ] 1MB+ payload rejected (413)
- [ ] 999KB payload accepted
- [ ] Error message doesn't leak implementation details

### Graceful Shutdown

- [ ] SIGTERM closes server cleanly
- [ ] Database connections closed
- [ ] No connection leaks
- [ ] Force shutdown after 30s timeout

---

## 📊 Security Monitoring

### Logs to Monitor

**Admin Access:**

```
[INFO] Admin access granted: { userId: '...', email: '...', path: '/default-categories' }
[WARN] Admin access denied: { userId: '...', email: 'user@example.com' }
```

**Rate Limiting:**

```
[WARN] Rate limit exceeded: { ip: '192.168.1.1', path: '/auth/login', userId: null }
[WARN] Auth rate limit exceeded: { ip: '192.168.1.1', path: '/auth/login', email: 'attacker@example.com' }
```

**CORS Violations:**

```
[WARN] CORS blocked request: { origin: 'https://evil.com', allowedOrigins: ['https://app.expenser.site'] }
```

**Shutdown Events:**

```
[INFO] SIGTERM signal received: closing HTTP server
[INFO] HTTP server closed
[INFO] Database connection closed
[ERROR] Could not close connections in time, forcefully shutting down
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] Set `ADMIN_EMAILS` environment variable
- [ ] Set `SESSION_SECRET` (don't rely on JWT_SECRET fallback)
- [ ] Set `NODE_ENV=production`
- [ ] Update `CORS_ORIGIN` to production domains only
- [ ] Verify rate limit thresholds are appropriate
- [ ] Test graceful shutdown in container environment
- [ ] Enable HSTS preload if using HTTPS
- [ ] Set log level to `warn` or `error`

### Environment Variables

```env
# Production .env
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://...

# Security
JWT_SECRET=<64-char-random-string>
SESSION_SECRET=<64-char-random-string>
ADMIN_EMAILS=admin@expenser.site,superadmin@expenser.site

# CORS
CORS_ORIGIN=https://app.expenser.site,https://expenser.site

# Logging
LOG_LEVEL=warn
```

### Kubernetes Deployment

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: expense-manager-api
      lifecycle:
        preStop:
          exec:
            command: ['/bin/sh', '-c', 'sleep 5']
      env:
        - name: ADMIN_EMAILS
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: admin-emails
```

---

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Rate Limit](https://express-rate-limit.mintlify.app/)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)

---

**Maintained By:** Development Team  
**Last Security Audit:** February 4, 2026  
**Next Review:** May 4, 2026 (3 months)
