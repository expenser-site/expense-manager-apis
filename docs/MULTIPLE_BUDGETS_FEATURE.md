# Multiple Budgets per Month Feature

## Overview

Users can now create multiple budgets for the same month, enabling flexible
budget management scenarios like:

- Tracking budgets from different income sources
- Managing main budget + bonus/extra income budgets
- Budget adjustments and revisions
- Category-specific budget allocations with clear naming

## Schema Changes

### Budget Model Enhancement

```prisma
model Budget {
  id       String @id @default(uuid())
  amount   Float
  currency String @default("USD")
  period   String // 'monthly' or 'yearly'
  month    Int?
  year     Int

  // NEW: Optional name field for distinguishing budgets
  name     String? // e.g., "Main Budget", "Bonus Income", "Q1 Revision"

  // Many-to-many relationship with categories
  categories BudgetCategory[]

  // Alerts and metadata
  alertAt80  Boolean @default(true)
  alertAt100 Boolean @default(true)
  notes      String?

  userId     String
  user       User @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

**Key Changes:**

- Added optional `name` field (max 100 characters)
- Removed unique constraint on `userId + period + month + year`
- Users can now have unlimited budgets per period

## API Updates

### Create Budget

**POST** `/api/v1/budgets`

**Request Body:**

```json
{
  "amount": 5000,
  "currency": "USD",
  "period": "monthly",
  "month": 2,
  "year": 2026,
  "name": "Main Salary Budget",
  "categoryIds": ["cat-uuid-1", "cat-uuid-2"],
  "alertAt80": true,
  "alertAt100": true,
  "notes": "Regular monthly budget from salary"
}
```

**Validation:**

- `name`: Optional, max 100 characters, trimmed
- All other validations remain the same
- No duplicate checking - multiple budgets per month allowed

### Update Budget

**PUT** `/api/v1/budgets/:id`

**Request Body:**

```json
{
  "amount": 5500,
  "name": "Updated Main Budget",
  "categoryIds": ["cat-uuid-1", "cat-uuid-2", "cat-uuid-3"]
}
```

**Validation:**

- `name`: Optional, max 100 characters, trimmed
- Can update budget name to distinguish from other budgets

### Get Budgets

**GET** `/api/v1/budgets?period=monthly&month=2&year=2026`

**Response:**

```json
{
  "budgets": [
    {
      "id": "budget-uuid-1",
      "amount": 5000,
      "currency": "USD",
      "period": "monthly",
      "month": 2,
      "year": 2026,
      "name": "Main Salary Budget",
      "categories": [...],
      "_links": [...]
    },
    {
      "id": "budget-uuid-2",
      "amount": 2000,
      "currency": "USD",
      "period": "monthly",
      "month": 2,
      "year": 2026,
      "name": "Bonus Income",
      "categories": [...],
      "_links": [...]
    }
  ],
  "pagination": {...},
  "_links": [...]
}
```

## Dashboard Aggregation

### Enhanced Dashboard Summary

**GET** `/api/v1/dashboard/summary`

**Response with Multiple Budgets:**

```json
{
  "summary": {
    "totalAmount": 12000,
    "totalCount": 45,
    "averageExpense": 266.67,
    "categoryBreakdown": {...}
  },
  "budgetComparison": {
    "hasBudget": true,
    "summary": {
      "totalBudgeted": 7000,
      "totalSpent": 5200,
      "totalRemaining": 1800,
      "overallPercentageUsed": 74.29,
      "budgetCount": 2
    },
    "budgets": [
      {
        "budgetId": "budget-uuid-1",
        "name": "Main Salary Budget",
        "budgetAmount": 5000,
        "currency": "USD",
        "period": "monthly",
        "month": 2,
        "year": 2026,
        "categories": [
          {
            "id": "cat-uuid-1",
            "name": "Food",
            "color": "#FF5733",
            "icon": "🍔",
            "spent": 1200
          }
        ],
        "spent": 3800,
        "remaining": 1200,
        "percentageUsed": 76.00,
        "isOverBudget": false,
        "alertStatus": "normal"
      },
      {
        "budgetId": "budget-uuid-2",
        "name": "Bonus Income",
        "budgetAmount": 2000,
        "currency": "USD",
        "period": "monthly",
        "month": 2,
        "year": 2026,
        "categories": [...],
        "spent": 1400,
        "remaining": 600,
        "percentageUsed": 70.00,
        "isOverBudget": false,
        "alertStatus": "normal"
      }
    ]
  }
}
```

### Aggregation Logic

**Query Optimization:**

1. **Single Database Query**: All budgets fetched in one query with categories
   included
2. **Efficient Grouping**: Expenses grouped by categoryId once using `groupBy`
3. **In-Memory Aggregation**: Budget totals calculated in Node.js (O(n)
   complexity)
4. **No N+1 Queries**: Uses Prisma's `include` for relationships

**Dashboard Aggregation:**

- `totalBudgeted`: Sum of all budget amounts
- `totalSpent`: Sum of spending across all budgets (handles category overlap
  correctly)
- `totalRemaining`: totalBudgeted - totalSpent
- `overallPercentageUsed`: (totalSpent / totalBudgeted) × 100
- `budgetCount`: Number of active budgets for the period

**Per-Budget Calculation:**

- Each budget calculates spent across its assigned categories
- Categories can appear in multiple budgets
- Spending is proportionally distributed based on category assignment

## Use Cases

### 1. Main Budget + Bonus Income

```bash
# Create main monthly budget
POST /api/v1/budgets
{
  "amount": 5000,
  "name": "Main Salary",
  "period": "monthly",
  "month": 2,
  "year": 2026,
  "categoryIds": ["food", "transport", "utilities"]
}

# Receive bonus - create additional budget
POST /api/v1/budgets
{
  "amount": 2000,
  "name": "Q1 Bonus",
  "period": "monthly",
  "month": 2,
  "year": 2026,
  "categoryIds": ["entertainment", "shopping"]
}

# Dashboard shows:
# - Total budgeted: $7,000
# - Individual budget tracking
# - Overall percentage used across both budgets
```

### 2. Budget Revision Without Deletion

```bash
# Initial budget
POST /api/v1/budgets
{
  "amount": 4000,
  "name": "February Initial",
  "month": 2,
  "year": 2026
}

# Mid-month adjustment - create revised budget
POST /api/v1/budgets
{
  "amount": 5000,
  "name": "February Revised",
  "month": 2,
  "year": 2026
}

# Both budgets retained for audit trail
# Can delete old budget or keep for comparison
```

### 3. Category-Specific Budget Allocation

```bash
# Essential expenses budget
POST /api/v1/budgets
{
  "amount": 3000,
  "name": "Essentials",
  "categoryIds": ["food", "utilities", "transport"]
}

# Discretionary spending budget
POST /api/v1/budgets
{
  "amount": 1500,
  "name": "Discretionary",
  "categoryIds": ["entertainment", "dining", "shopping"]
}
```

## Migration Guide

### Applied Migration

```sql
-- Migration: 20260204182553_allow_multiple_budgets_per_month

-- Add name field to Budget table
ALTER TABLE "Budget" ADD COLUMN "name" TEXT;

-- Remove existing unique constraints (if any)
-- Note: Prisma will handle constraint management
```

### Backward Compatibility

- Existing budgets work without changes
- `name` field is optional - defaults to null
- Existing API requests continue to work
- Dashboard summary enhanced but remains compatible

## Performance Considerations

### Query Optimization

1. **Budget Fetch**: Single query with `include` for categories
2. **Expense Aggregation**: Uses `groupBy` for efficient aggregation
3. **In-Memory Calculation**: Minimal database load
4. **Index Strategy**: Indexed on `userId`, `period`, `month`, `year` for fast
   filtering

### Recommended Indexes

```sql
-- Composite index for efficient budget filtering
CREATE INDEX idx_budget_user_period ON "Budget"(userId, period, month, year);

-- Index for budget-category junction lookups
CREATE INDEX idx_budget_category_budget ON "BudgetCategory"(budgetId);
CREATE INDEX idx_budget_category_category ON "BudgetCategory"(categoryId);
```

### Scalability

- **Small Scale** (< 10 budgets/month): No performance impact
- **Medium Scale** (10-50 budgets/month): Negligible impact with proper indexing
- **Large Scale** (> 50 budgets/month): Consider pagination and caching

## Testing Recommendations

### Unit Tests

```javascript
describe('Multiple Budgets Feature', () => {
  test('should create multiple budgets for same month', async () => {
    // Test budget creation with same period
  });

  test('should aggregate budgets correctly in dashboard', async () => {
    // Test aggregation logic
  });

  test('should calculate category spending across budgets', async () => {
    // Test category overlap handling
  });
});
```

### API Tests (Bruno Collection)

```javascript
// POST Create First Budget
// POST Create Second Budget (Same Month)
// GET Budgets - Verify Both Returned
// GET Dashboard - Verify Aggregation
// PUT Update Budget Name
// DELETE One Budget - Verify Other Remains
```

## Best Practices

### Naming Convention

- Use descriptive names: "Main Budget", "Bonus Income", "Q1 Revision"
- Avoid generic names when multiple budgets exist
- Consider date-based names: "Feb 2026 - Initial", "Feb 2026 - Updated"

### Budget Organization

- Limit to 5-10 budgets per month for clarity
- Delete obsolete budgets to reduce clutter
- Use notes field for detailed context

### Alert Management

- Set alerts independently per budget
- Consider disabling alerts on revision budgets
- Monitor overall percentage in dashboard summary

## Future Enhancements

### Potential Features

1. **Budget Templates**: Save budget configurations for reuse
2. **Budget Merging**: Combine multiple budgets into one
3. **Priority Levels**: Assign priority to budgets
4. **Auto-Archive**: Archive old revision budgets
5. **Budget Comparison**: Visual comparison between budgets
6. **Category Recommendations**: AI-suggested category allocations

## Support & Documentation

- API Documentation: `/docs/API_COMPLETENESS_CHECKLIST.md`
- Budget API Guide: `/docs/BUDGET_API.md`
- HATEOAS Links: All budget responses include navigational links
- Error Handling: Comprehensive validation with descriptive errors

## Changelog

### Version 1.0.0 (Feb 4, 2026)

- ✅ Added optional `name` field to Budget model
- ✅ Removed unique constraint for multiple budgets per month
- ✅ Enhanced dashboard with aggregated summary
- ✅ Updated budget create/update endpoints
- ✅ Added name validation (max 100 characters)
- ✅ Optimized dashboard queries for multiple budgets
- ✅ Applied migration: `20260204182553_allow_multiple_budgets_per_month`
