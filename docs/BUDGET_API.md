# Budget API Documentation

## Overview

The Budget API allows users to create, manage, and track budgets for their
expenses. Budgets can be set on a monthly or yearly basis, and can be applied to
overall spending or specific categories.

## Features

- **Monthly and Yearly Budgets**: Set budgets for different time periods
- **Category-Specific Budgets**: Create budgets for individual expense
  categories
- **Budget Tracking**: Compare actual spending against budgeted amounts
- **Alert Thresholds**: Get notified when spending reaches 80% or 100% of budget
- **Future-Proof Design**: Built to support upcoming features like family
  sharing, recurring budgets, and receipt scanning

## Base URL

```
/api/v1/budgets
```

All endpoints require authentication via JWT token in the Authorization header.

---

## Endpoints

### 1. Create Budget

**POST** `/api/v1/budgets`

Create a new budget for the authenticated user.

#### Request Body

```json
{
  "amount": 1000.0, // Required: Budget amount
  "currency": "USD", // Optional: Currency code (default: USD)
  "period": "monthly", // Required: "monthly" or "yearly"
  "month": 2, // Required for monthly budgets: 1-12
  "year": 2026, // Required: Budget year
  "categoryId": "uuid", // Optional: Category ID for category-specific budget
  "alertAt80": true, // Optional: Alert at 80% (default: true)
  "alertAt100": true, // Optional: Alert at 100% (default: true)
  "notes": "Monthly budget" // Optional: Budget notes
}
```

#### Response (201 Created)

```json
{
  "message": "Budget created successfully",
  "budget": {
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
    "notes": "Monthly budget",
    "createdAt": "2026-02-04T10:00:00.000Z",
    "updatedAt": "2026-02-04T10:00:00.000Z"
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid input data
- **404 Not Found**: Category not found
- **409 Conflict**: Budget with same parameters already exists

---

### 2. Get All Budgets

**GET** `/api/v1/budgets`

Retrieve all budgets for the authenticated user with optional filtering and
pagination.

#### Query Parameters

- `period` (optional): Filter by "monthly" or "yearly"
- `year` (optional): Filter by year
- `month` (optional): Filter by month (1-12)
- `categoryId` (optional): Filter by category ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

#### Example Request

```
GET /api/v1/budgets?period=monthly&year=2026&page=1&limit=10
```

#### Response (200 OK)

```json
{
  "budgets": [
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
      "notes": "Monthly budget",
      "createdAt": "2026-02-04T10:00:00.000Z",
      "updatedAt": "2026-02-04T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 3. Get Budget by ID

**GET** `/api/v1/budgets/:id`

Retrieve a specific budget by its ID.

#### Response (200 OK)

```json
{
  "budget": {
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
    "notes": "Monthly budget",
    "createdAt": "2026-02-04T10:00:00.000Z",
    "updatedAt": "2026-02-04T10:00:00.000Z"
  }
}
```

#### Error Responses

- **404 Not Found**: Budget not found

---

### 4. Update Budget

**PUT** `/api/v1/budgets/:id`

Update an existing budget.

#### Request Body

All fields are optional. Only include fields you want to update.

```json
{
  "amount": 1200.0,
  "currency": "USD",
  "period": "monthly",
  "month": 3,
  "year": 2026,
  "categoryId": "uuid",
  "alertAt80": false,
  "alertAt100": true,
  "notes": "Updated budget"
}
```

#### Response (200 OK)

```json
{
  "message": "Budget updated successfully",
  "budget": {
    "id": "uuid",
    "amount": 1200.0,
    "currency": "USD",
    "period": "monthly",
    "month": 3,
    "year": 2026,
    "categoryId": "uuid",
    "category": {
      "id": "uuid",
      "name": "Food",
      "color": "#FF5733",
      "icon": "🍔"
    },
    "userId": "uuid",
    "alertAt80": false,
    "alertAt100": true,
    "groupId": null,
    "isRecurring": false,
    "notes": "Updated budget",
    "createdAt": "2026-02-04T10:00:00.000Z",
    "updatedAt": "2026-02-04T11:00:00.000Z"
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid input data
- **404 Not Found**: Budget or category not found
- **409 Conflict**: Budget with updated parameters already exists

---

### 5. Delete Budget

**DELETE** `/api/v1/budgets/:id`

Delete a budget.

#### Response (200 OK)

```json
{
  "message": "Budget deleted successfully"
}
```

#### Error Responses

- **404 Not Found**: Budget not found

---

### 6. Get Budget Status

**GET** `/api/v1/budgets/status`

Get comprehensive budget status with actual spending comparison. This endpoint
compares budgeted amounts against actual expenses for the specified period.

#### Query Parameters

- `year` (optional): Target year (default: current year)
- `month` (optional): Target month (default: current month)
- `categoryId` (optional): Filter by specific category

#### Example Request

```
GET /api/v1/budgets/status?year=2026&month=2
```

#### Response (200 OK)

```json
{
  "year": 2026,
  "month": 2,
  "overallSummary": {
    "totalBudget": 1000.0,
    "totalSpent": 750.5,
    "totalRemaining": 249.5
  },
  "budgetStatus": [
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
      "alerts": []
    },
    {
      "budgetId": "uuid",
      "budgetAmount": 300.0,
      "currency": "USD",
      "period": "monthly",
      "month": 2,
      "year": 2026,
      "category": {
        "id": "uuid",
        "name": "Food",
        "color": "#FF5733",
        "icon": "🍔"
      },
      "spent": 250.0,
      "remaining": 50.0,
      "percentageUsed": 83.33,
      "isOverBudget": false,
      "alerts": [
        {
          "type": "warning",
          "message": "You've used 83.3% of your budget"
        }
      ]
    },
    {
      "budgetId": "uuid",
      "budgetAmount": 200.0,
      "currency": "USD",
      "period": "monthly",
      "month": 2,
      "year": 2026,
      "category": {
        "id": "uuid",
        "name": "Entertainment",
        "color": "#3498DB",
        "icon": "🎮"
      },
      "spent": 225.0,
      "remaining": -25.0,
      "percentageUsed": 112.5,
      "isOverBudget": true,
      "alerts": [
        {
          "type": "danger",
          "message": "You've exceeded your budget by 25.00 USD"
        }
      ]
    }
  ],
  "categoryBreakdown": [
    {
      "budgetId": "uuid",
      "categoryId": "uuid",
      "categoryName": "Food",
      "budgetAmount": 300.0,
      "currency": "USD",
      "period": "monthly",
      "spent": 250.0,
      "remaining": 50.0,
      "percentageUsed": 83.33,
      "isOverBudget": false,
      "alertStatus": "warning"
    }
  ]
}
```

---

## Budget Model Schema

```javascript
{
  id: String (UUID),
  amount: Float,              // Budget amount
  currency: String,           // Currency code (default: USD)
  period: String,             // "monthly" or "yearly"
  month: Int?,                // 1-12 for monthly budgets, null for yearly
  year: Int,                  // Budget year
  categoryId: String?,        // Optional category ID
  category: Category?,        // Category relation
  userId: String,             // User ID
  user: User,                 // User relation
  alertAt80: Boolean,         // Alert at 80% threshold
  alertAt100: Boolean,        // Alert at 100% threshold
  groupId: String?,           // For future family/group sharing
  isRecurring: Boolean,       // For future recurring budgets
  notes: String?,             // Optional notes
  createdAt: DateTime,
  updatedAt: DateTime
}
```

---

## Supported Currencies

USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, BDT

---

## Alert Status Levels

- **normal**: Spending is below 80% of budget
- **warning**: Spending is between 80% and 100% of budget
- **danger**: Spending has exceeded 100% of budget

---

## Dashboard Integration

The dashboard `/api/v1/dashboard/summary` endpoint now includes budget
comparison data:

```json
{
  "summary": {
    "totalAmount": 750.5,
    "totalCount": 25,
    "averageExpense": 30.02,
    "categoryBreakdown": {
      "Food": 250.0,
      "Entertainment": 225.0,
      "Transportation": 275.5
    }
  },
  "budgetComparison": {
    "hasBudget": true,
    "overall": {
      "budgetId": "uuid",
      "budgetAmount": 1000.0,
      "currency": "USD",
      "period": "monthly",
      "spent": 750.5,
      "remaining": 249.5,
      "percentageUsed": 75.05,
      "isOverBudget": false,
      "alertStatus": "normal"
    },
    "categories": [
      {
        "budgetId": "uuid",
        "categoryId": "uuid",
        "categoryName": "Food",
        "budgetAmount": 300.0,
        "currency": "USD",
        "period": "monthly",
        "spent": 250.0,
        "remaining": 50.0,
        "percentageUsed": 83.33,
        "isOverBudget": false,
        "alertStatus": "warning"
      }
    ]
  }
}
```

---

## Best Practices

1. **Start Simple**: Create an overall monthly budget before adding
   category-specific budgets
2. **Use Current Month**: When creating monthly budgets, use the current month
   and year for immediate tracking
3. **Category Budgets**: Create category budgets to track spending in specific
   areas
4. **Yearly Planning**: Use yearly budgets for long-term financial planning
5. **Regular Monitoring**: Check `/budgets/status` regularly to stay on track
6. **Alert Thresholds**: Keep alert thresholds enabled to get timely
   notifications

---

## Future Features

The Budget model is designed to support these upcoming features:

1. **Budget Alerts**: Automatic notifications when reaching 80% or 100%
2. **Recurring Budgets**: Automatically create budgets for future periods
3. **Family/Group Sharing**: Share budgets with family members or groups
4. **Receipt Integration**: Link receipt scans to budget tracking
5. **Smart Suggestions**: AI-powered budget recommendations based on spending
   patterns

---

## Example Use Cases

### Use Case 1: Monthly Overall Budget

```bash
# Create a monthly budget for February 2026
POST /api/v1/budgets
{
  "amount": 1500,
  "period": "monthly",
  "month": 2,
  "year": 2026
}

# Check status
GET /api/v1/budgets/status?year=2026&month=2
```

### Use Case 2: Category-Specific Budget

```bash
# Create a food budget for the month
POST /api/v1/budgets
{
  "amount": 400,
  "period": "monthly",
  "month": 2,
  "year": 2026,
  "categoryId": "food-category-uuid"
}
```

### Use Case 3: Yearly Budget

```bash
# Create a yearly budget for 2026
POST /api/v1/budgets
{
  "amount": 15000,
  "period": "yearly",
  "year": 2026
}

# Check yearly progress
GET /api/v1/budgets/status?year=2026
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (missing/invalid token)
- **404**: Not Found
- **409**: Conflict (duplicate budget)
- **500**: Internal Server Error
