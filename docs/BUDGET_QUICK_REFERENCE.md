# Budget API Quick Reference

## Base URL

```
http://localhost:3000/api/v1/budgets
```

> **Note**: All requests require authentication. Include JWT token in header:
> `Authorization: Bearer <your-jwt-token>`

---

## Quick Start Examples

### 1. Create Monthly Budget (Minimal)

```bash
curl -X POST http://localhost:3000/api/v1/budgets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "period": "monthly",
    "month": 2,
    "year": 2026
  }'
```

### 2. Create Category Budget

```bash
curl -X POST http://localhost:3000/api/v1/budgets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 300,
    "period": "monthly",
    "month": 2,
    "year": 2026,
    "categoryId": "CATEGORY_UUID",
    "notes": "Food budget for February"
  }'
```

### 3. Create Yearly Budget

```bash
curl -X POST http://localhost:3000/api/v1/budgets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 12000,
    "period": "yearly",
    "year": 2026
  }'
```

### 4. Get All Budgets

```bash
curl -X GET http://localhost:3000/api/v1/budgets \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Get Budgets with Filters

```bash
curl -X GET "http://localhost:3000/api/v1/budgets?period=monthly&year=2026&month=2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Get Budget Status

```bash
curl -X GET "http://localhost:3000/api/v1/budgets/status?year=2026&month=2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Get Single Budget

```bash
curl -X GET http://localhost:3000/api/v1/budgets/BUDGET_UUID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 8. Update Budget

```bash
curl -X PUT http://localhost:3000/api/v1/budgets/BUDGET_UUID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1200,
    "notes": "Increased budget"
  }'
```

### 9. Delete Budget

```bash
curl -X DELETE http://localhost:3000/api/v1/budgets/BUDGET_UUID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 10. Get Dashboard with Budget

```bash
curl -X GET http://localhost:3000/api/v1/dashboard/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Common Scenarios

### Scenario 1: Set Up Monthly Budgets for All Categories

```bash
# Overall budget
curl -X POST http://localhost:3000/api/v1/budgets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 2000, "period": "monthly", "month": 2, "year": 2026}'

# Food budget
curl -X POST http://localhost:3000/api/v1/budgets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500, "period": "monthly", "month": 2, "year": 2026, "categoryId": "FOOD_ID"}'

# Entertainment budget
curl -X POST http://localhost:3000/api/v1/budgets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 300, "period": "monthly", "month": 2, "year": 2026, "categoryId": "ENTERTAINMENT_ID"}'
```

### Scenario 2: Check Budget Health

```bash
# Get current month status
curl -X GET "http://localhost:3000/api/v1/budgets/status" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get specific month
curl -X GET "http://localhost:3000/api/v1/budgets/status?year=2026&month=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Scenario 3: Yearly Planning

```bash
# Create yearly budget
curl -X POST http://localhost:3000/api/v1/budgets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 24000, "period": "yearly", "year": 2026}'

# Check yearly progress
curl -X GET "http://localhost:3000/api/v1/budgets/status?year=2026" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Field Reference

### Required Fields (POST)

- `amount` - Budget amount (number)
- `period` - "monthly" or "yearly"
- `year` - Budget year (2000-2100)
- `month` - Required for monthly budgets (1-12)

### Optional Fields

- `currency` - Default: "USD"
- `categoryId` - For category-specific budgets
- `alertAt80` - Default: true
- `alertAt100` - Default: true
- `notes` - Custom description

### Filter Parameters (GET)

- `period` - "monthly" or "yearly"
- `year` - Filter by year
- `month` - Filter by month
- `categoryId` - Filter by category
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

---

## Response Fields

### Budget Object

```json
{
  "id": "uuid",
  "amount": 1000.0,
  "currency": "USD",
  "period": "monthly",
  "month": 2,
  "year": 2026,
  "categoryId": null,
  "category": null,
  "userId": "uuid",
  "alertAt80": true,
  "alertAt100": true,
  "groupId": null,
  "isRecurring": false,
  "notes": "My budget",
  "createdAt": "2026-02-04T10:00:00.000Z",
  "updatedAt": "2026-02-04T10:00:00.000Z"
}
```

### Budget Status Object

```json
{
  "budgetId": "uuid",
  "budgetAmount": 1000.0,
  "currency": "USD",
  "period": "monthly",
  "month": 2,
  "year": 2026,
  "category": null,
  "spent": 750.5,
  "remaining": 249.5,
  "percentageUsed": 75.05,
  "isOverBudget": false,
  "alerts": [
    {
      "type": "warning",
      "message": "You've used 75.0% of your budget"
    }
  ]
}
```

---

## Alert Status

- **normal**: < 80% spent
- **warning**: 80-100% spent
- **danger**: > 100% spent (over budget)

---

## Supported Currencies

USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, BDT

---

## Error Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **404**: Not Found
- **409**: Conflict (duplicate)
- **500**: Server Error

---

## Tips

1. **Start Simple**: Create an overall monthly budget first
2. **Category Budgets**: Add category budgets for specific tracking
3. **Check Status**: Use `/budgets/status` to monitor spending
4. **Dashboard**: View budget summary in dashboard endpoint
5. **Alerts**: Keep alert thresholds enabled for notifications

---

## Testing Workflow

1. Get your JWT token from login
2. Get your category IDs from `/api/v1/categories`
3. Create overall monthly budget
4. Create category-specific budgets
5. Check budget status
6. View dashboard with budget comparison
7. Add expenses and monitor budget health

---

## Environment

Make sure your `.env` file has:

```
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
PORT=3000
```

And the database is running:

```bash
# Check database
psql -d expensedb -c "SELECT * FROM budgets LIMIT 5;"
```
