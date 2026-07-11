# Budget Alert System

## Overview

The Budget Alert System automatically monitors spending against budgets and
sends email notifications when thresholds are reached (80% and 100%).

## Features

- ✅ **80% Alert**: Warns users when they've used 80% of their budget
- ✅ **100% Alert**: Notifies users when they've exceeded their budget
- ✅ **Duplicate Prevention**: Tracks sent alerts to avoid spam
- ✅ **Automatic Checking**: Alerts are checked when:
  - Expenses are created, updated, or deleted
  - Budget status is queried
  - Manual check is triggered (for scheduled jobs)
- ✅ **Beautiful Email Templates**: HTML emails with spending breakdown
- ✅ **Category-Aware**: Works with overall budgets and category-specific
  budgets

## Architecture

### Database Schema

```prisma
model BudgetAlert {
  id           String   @id @default(uuid())
  budgetId     String
  budget       Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  threshold    Int      // 80 or 100 (percentage)
  sentAt       DateTime @default(now())
  spentAmount  Float    // Amount spent when alert was triggered
  spentPercent Float    // Percentage spent when alert was triggered

  @@unique([budgetId, threshold])
  @@index([budgetId])
  @@map("budget_alerts")
}
```

### Components

1. **BudgetAlertService** (`src/services/budgetAlertService.js`)
   - `checkAndSendAlerts()` - Check spending and send alerts if needed
   - `sendAlertIfNeeded()` - Send alert for specific threshold
   - `resetAlerts()` - Clear alerts for a budget
   - `checkAllBudgets()` - Periodic check of all budgets
   - `calculateBudgetSpending()` - Calculate current spending

2. **Email Template** (`src/services/email/templates/budgetAlert.js`)
   - HTML email with spending breakdown
   - Shows budget details, spent amount, percentage, and remaining
   - Category information
   - Action button to view budget details

3. **Integration Points**
   - `budgetController.js` - Checks budgets when status is queried
   - `expenseController.js` - Checks budgets when expenses change

## Usage

### Automatic Alerts

Alerts are automatically triggered when:

1. **Creating an Expense**

   ```javascript
   POST / api / v1 / expenses;
   // Budget alerts checked asynchronously after expense creation
   ```

2. **Updating an Expense**

   ```javascript
   PUT /api/v1/expenses/:id
   // Budget alerts checked for affected budgets
   ```

3. **Deleting an Expense**

   ```javascript
   DELETE /api/v1/expenses/:id
   // Budget alerts checked (may clear alerts if spending drops)
   ```

4. **Querying Budget Status**
   ```javascript
   GET / api / v1 / budgets / status;
   // Checks all budgets in the response and sends alerts if needed
   ```

### Manual Checks (Scheduled Jobs)

You can set up a cron job to periodically check all budgets:

```javascript
import budgetAlertService from './services/budgetAlertService.js';

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  await budgetAlertService.checkAllBudgets();
});
```

### Programmatic Usage

```javascript
import budgetAlertService from './services/budgetAlertService.js';

// Check specific budget
await budgetAlertService.checkAndSendAlerts(
  budgetId,
  spentAmount,
  spentPercent
);

// Reset alerts for a budget (e.g., start of new month)
await budgetAlertService.resetAlerts(budgetId);

// Calculate current spending
const { spentAmount, spentPercent } =
  await budgetAlertService.calculateBudgetSpending(budget);
```

## Email Examples

### 80% Alert Email

```
Subject: ⚠️ Budget Alert: 80% Reached - Food Budget (Jan 2026)

Hello John,

⚠️ Budget Alert: You've reached 80% of your Food Budget

Budget Details for Jan 2026:
- Budget Amount: $500.00
- Amount Spent: $400.00
- Percentage Used: 80.0%
- Remaining: $100.00

Categories: Food, Groceries

💡 Tip: Keep an eye on your spending to stay within your budget for the rest of the period.

[View Budget Details]
```

### 100% Alert Email

```
Subject: ⚠️ Budget Exceeded - Food Budget (Jan 2026)

Hello John,

⚠️ Budget Exceeded! You've spent 105.2% of your Food Budget

Budget Details for Jan 2026:
- Budget Amount: $500.00
- Amount Spent: $526.00
- Percentage Used: 105.2%
- Remaining: -$26.00

Categories: Food, Groceries

💡 Tip: Consider reviewing your recent expenses and adjusting your budget or spending habits.

[View Budget Details]
```

## Configuration

### Enable/Disable Alerts

Alerts can be controlled per budget:

```javascript
POST /api/v1/budgets
{
  "amount": 500,
  "period": "monthly",
  "month": 1,
  "year": 2026,
  "alertAt80": true,   // Enable 80% alert
  "alertAt100": true   // Enable 100% alert
}
```

### Email Provider

Configure in `.env`:

```bash
# Use DEVELOPMENT provider for testing (logs to console)
EMAIL_PROVIDER=DEVELOPMENT

# Use ZEPTOMAIL for production
EMAIL_PROVIDER=ZEPTOMAIL
EMAIL_API_KEY=your_zeptomail_api_key
EMAIL_FROM=no-reply@expenser.site
```

## Database Migration

Run the migration to create the `budget_alerts` table:

```bash
# Generate migration
npx prisma migrate dev --name add-budget-alerts

# Or apply migration in production
npx prisma migrate deploy
```

## Performance Considerations

1. **Async Processing**: Alert checks run asynchronously (via `setImmediate()`)
   to avoid blocking API responses
2. **Duplicate Prevention**: `@@unique([budgetId, threshold])` prevents
   duplicate alerts
3. **Efficient Queries**: Uses batch queries to minimize database calls
4. **Email Throttling**: Each alert is sent only once per threshold

## Alert Lifecycle

```
1. Expense Created/Updated/Deleted
   ↓
2. Check Affected Budgets
   ↓
3. Calculate Current Spending
   ↓
4. Check if Threshold Reached (80% or 100%)
   ↓
5. Check if Alert Already Sent
   ↓
6. Send Email Notification
   ↓
7. Record Alert in Database
```

## Troubleshooting

### Alerts Not Sending

1. Check email provider configuration:

   ```javascript
   // View current provider
   emailService.getProviderName();
   ```

2. Check logs for errors:

   ```bash
   tail -f logs/combined.log | grep "budget-alert"
   ```

3. Verify budget settings:
   ```javascript
   GET /api/v1/budgets/:id
   // Check alertAt80 and alertAt100 fields
   ```

### Duplicate Alerts

The system prevents duplicates, but if you need to resend:

```javascript
// Reset alerts for a budget
await budgetAlertService.resetAlerts(budgetId);

// Check again
await budgetAlertService.checkAndSendAlerts(
  budgetId,
  spentAmount,
  spentPercent
);
```

### Testing in Development

Use the DEVELOPMENT email provider to test without sending real emails:

```bash
# In .env
EMAIL_PROVIDER=DEVELOPMENT

# Emails will be logged to console instead
```

## Future Enhancements

- [ ] Custom threshold percentages (not just 80% and 100%)
- [ ] SMS/Push notifications in addition to email
- [ ] Weekly/Monthly summary emails
- [ ] Configurable alert frequency (daily digest vs immediate)
- [ ] In-app notifications
- [ ] Alert history dashboard

## Related Documentation

- [Email Service README](./src/services/email/README.md)
- [Budget API Documentation](./docs/BUDGET_README.md)
- [Prisma Schema](./prisma/schema.prisma)
