# Budget API Collection

This Bruno collection contains all API endpoints for managing budgets in the
Expense Manager API.

## Overview

The Budget API allows users to:

- Create monthly or yearly budgets
- Set category-specific or overall budgets
- Track spending against budgets
- Get alerts when spending reaches 80% or 100% of budget
- View budget status with actual spending comparison

## Environment Variables

Required variables (set in Bruno environments):

- `baseUrl` - API base URL (e.g., `http://localhost:3000`)
- `token` - JWT authentication token
- `categoryId` - Category ID for category-specific budgets (optional)
- `budgetId` - Budget ID for update/delete/get operations (auto-set after
  creation)
- `yearlyBudgetId` - Yearly budget ID (auto-set after creation)

## Endpoints

### 1. Create Budget

**POST** `/api/v1/budgets`

Create a new monthly or yearly budget.

**Request Body:**

```json
{
  "amount": 1500.0,
  "currency": "USD",
  "period": "monthly",
  "month": 2,
  "year": 2026,
  "categoryId": "uuid", // Optional - for category-specific budget
  "notes": "Budget notes",
  "alertAt80": true,
  "alertAt100": true
}
```

**Validation:**

- `amount`: Number, minimum 0.01
- `currency`: Enum [USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, BDT]
- `period`: Enum [monthly, yearly]
- `month`: Integer 1-12 (required for monthly budgets)
- `year`: Integer 2000-2100
- `categoryId`: Valid UUID v4 (optional)
- `notes`: String, max 500 characters (optional)

**Response:** 201 Created

```json
{
  "budget": {
    "id": "uuid",
    "amount": 1500,
    "currency": "USD",
    "period": "monthly",
    "month": 2,
    "year": 2026,
    "categoryId": "uuid",
    "userId": "uuid",
    "notes": "Budget notes",
    "alertAt80": true,
    "alertAt100": true,
    "createdAt": "2026-02-04T10:00:00.000Z",
    "updatedAt": "2026-02-04T10:00:00.000Z",
    "category": {
      "id": "uuid",
      "name": "Groceries",
      "color": "#4CAF50",
      "icon": "shopping-cart"
    }
  },
  "_links": {
    "self": { "href": "/api/v1/budgets/{id}" },
    "update": { "href": "/api/v1/budgets/{id}", "method": "PUT" },
    "delete": { "href": "/api/v1/budgets/{id}", "method": "DELETE" }
  }
}
```

---

### 2. Get All Budgets

**GET** `/api/v1/budgets`

Retrieve all budgets with optional filters and pagination.

**Query Parameters:**

- `page`: Integer ≥ 1 (default: 1)
- `limit`: Integer 1-100 (default: 50)
- `period`: Enum [monthly, yearly] (optional)
- `year`: Integer 2000-2100 (optional)
- `month`: Integer 1-12 (optional)
- `categoryId`: Valid UUID v4 (optional)

**Response:** 200 OK

```json
{
  "budgets": [...],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "pages": 1
  },
  "_links": {
    "self": { "href": "/api/v1/budgets?page=1&limit=50" },
    "first": { "href": "/api/v1/budgets?page=1&limit=50" },
    "last": { "href": "/api/v1/budgets?page=1&limit=50" }
  }
}
```

---

### 3. Get Budget by ID

**GET** `/api/v1/budgets/:id`

Retrieve a specific budget by ID.

**Response:** 200 OK

```json
{
  "budget": {
    "id": "uuid",
    "amount": 1500
    // ... full budget object
  },
  "_links": {
    "self": { "href": "/api/v1/budgets/{id}" },
    "update": { "href": "/api/v1/budgets/{id}", "method": "PUT" },
    "delete": { "href": "/api/v1/budgets/{id}", "method": "DELETE" },
    "status": { "href": "/api/v1/budgets/status?year={year}&month={month}" }
  }
}
```

---

### 4. Get Budget Status

**GET** `/api/v1/budgets/status`

Get budget status with actual spending comparison.

**Query Parameters:**

- `year`: Integer (optional, defaults to current year)
- `month`: Integer (optional, defaults to current month)
- `categoryId`: UUID (optional, filter by category)

**Response:** 200 OK

```json
{
  "year": 2026,
  "month": 2,
  "overallSummary": {
    "totalBudget": 3000.00,
    "totalSpent": 1250.75,
    "totalRemaining": 1749.25
  },
  "budgetStatus": [
    {
      "budgetId": "uuid",
      "budgetAmount": 1500,
      "currency": "USD",
      "period": "monthly",
      "month": 2,
      "year": 2026,
      "category": {
        "id": "uuid",
        "name": "Groceries",
        "color": "#4CAF50",
        "icon": "shopping-cart"
      },
      "spent": 1250.75,
      "remaining": 249.25,
      "percentageUsed": 83.38,
      "isOverBudget": false,
      "alerts": [
        {
          "type": "warning",
          "message": "You've used 83.4% of your budget"
        }
      ]
    }
  ],
  "categoryBreakdown": [...]
}
```

**Alert Types:**

- `warning`: Triggered when spending reaches 80% (if `alertAt80: true`)
- `danger`: Triggered when spending reaches 100% (if `alertAt100: true`)

---

### 5. Update Budget

**PUT** `/api/v1/budgets/:id`

Update an existing budget. Partial updates are supported.

**Request Body:**

```json
{
  "amount": 2000.0,
  "notes": "Updated budget notes",
  "alertAt80": true,
  "alertAt100": false
}
```

**Note:** You cannot change `period`, `month`, `year`, or `categoryId` after
creation.

**Response:** 200 OK

---

### 6. Delete Budget

**DELETE** `/api/v1/budgets/:id`

Delete a budget.

**Response:** 200 OK

```json
{
  "message": "Budget deleted successfully",
  "budget": {
    "id": "uuid",
    "amount": 1500
  }
}
```

---

## Test Cases

### Positive Tests

1. **Create Budget** - Creates monthly budget with all fields
2. **Get All Budgets** - Retrieves budgets with pagination
3. **Get Budget by ID** - Retrieves specific budget
4. **Get Budget Status** - Retrieves spending comparison
5. **Update Budget** - Updates budget amount and notes
6. **Delete Budget** - Deletes budget successfully
7. **Create Yearly Budget** - Creates annual budget without month

### Validation Tests

8. **Invalid Amount** - Tests negative amount rejection
9. **Invalid Currency** - Tests invalid currency code rejection
10. **With Filters** - Tests query parameter filtering

### Additional Test Scenarios

- Test duplicate budget creation (same category/period/month/year)
- Test budget with spending exceeding limit
- Test monthly vs yearly budget calculations
- Test category-specific vs overall budgets
- Test pagination boundaries (page 0, limit 101)
- Test invalid UUID format
- Test unauthorized access (missing token)

## Testing Order

Run tests in this sequence for best results:

1. Create Category (if testing category-specific budgets)
2. Create Budget (sets `budgetId` variable)
3. Get All Budgets
4. Get Budget by ID
5. Create some expenses (to test budget status)
6. Get Budget Status
7. Update Budget
8. Create Yearly Budget
9. Get Budgets - With Filters
10. Validation tests (Invalid Amount, Invalid Currency)
11. Delete Budget

## Rate Limiting

Budget API endpoints are subject to rate limiting:

- **General Limit:** 100 requests per 15 minutes
- **Response Headers:**
  - `RateLimit-Limit`: Maximum requests allowed
  - `RateLimit-Remaining`: Remaining requests
  - `RateLimit-Reset`: Unix timestamp when limit resets

## Error Responses

### 400 Bad Request

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

### 401 Unauthorized

```json
{
  "error": "Authentication required"
}
```

### 404 Not Found

```json
{
  "error": "Budget not found"
}
```

### 409 Conflict

```json
{
  "error": "Budget already exists for this category, period, and timeframe"
}
```

### 429 Too Many Requests

```json
{
  "error": "Too many requests, please try again later."
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## Notes

- All monetary amounts are stored as decimals with 2 decimal precision
- Budget uniqueness is enforced by: userId + categoryId + period + month + year
- Monthly budgets require a month field (1-12)
- Yearly budgets have month set to null
- Category-specific budgets require a valid categoryId
- Overall budgets have categoryId set to null
- Budget status is calculated based on expenses within the budget period
- HATEOAS links are provided for API navigation

## Related Collections

- **Categories** - Required for category-specific budgets
- **Expenses** - Required for budget status calculations
- **Dashboard** - Includes budget comparison data

---

**Last Updated:** February 4, 2026
