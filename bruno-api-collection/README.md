# Bruno API Collection for Expenser

This directory contains the complete Bruno API collection for testing the
Expenser APIs.

## What is Bruno?

Bruno is a modern, open-source API client that stores collections as plain text
files, making them perfect for version control with Git.

## Installation

Download and install Bruno from: <https://www.usebruno.com/>

## Getting Started

1. Open Bruno
2. Click "Open Collection"
3. Navigate to this directory: `expense-manager-apis/bruno-api-collection`
4. Select the collection

## Environments

The collection includes two environments:

- **Local** - For local development (`http://localhost:3001`)
- **Production** - For production API (update the URL as needed)

To switch environments:

1. Click on the environment dropdown in Bruno
2. Select your desired environment

## Collection Structure

```text
bruno-api-collection/
├── bruno.bru                  # Collection metadata
├── environments/
│   ├── local.bru             # Local environment variables
│   └── production.bru        # Production environment variables
├── Health Check.bru          # Basic health check endpoint
├── Health Check Detailed.bru # Detailed health check with DB status
├── Auth/
│   ├── Register.bru          # User registration
│   ├── Login.bru             # User login
│   └── Get Profile.bru       # Get user profile
├── Expenses/
│   ├── Create Expense.bru           # Create new expense
│   ├── Get All Expenses.bru         # List all expenses
│   ├── Get Expenses with Filter.bru # Filter expenses
│   ├── Get Expense by ID.bru        # Get single expense
│   ├── Update Expense.bru           # Full update
│   ├── Partial Update Expense.bru   # Partial update
│   └── Delete Expense.bru           # Delete expense
└── Dashboard/
    ├── Get Dashboard Summary.bru              # Overall statistics
    ├── Get Summary with Date Filter.bru       # Filtered statistics
    ├── Get Category Analytics.bru             # Category breakdown
    ├── Get Category Analytics with Filter.bru # Filtered by date
    ├── Get Monthly Trends.bru                 # 12-month trends
    ├── Get Monthly Trends by Year.bru         # Specific year
    └── Get Recent Expenses.bru                # Latest expenses
```

## Usage Flow

### 1. Health Check (Optional)

Start by verifying the API is running:

1. **Health Check** - Basic API status
2. **Health Check Detailed** - Includes database connectivity

### 2. Authentication Flow

Run requests in this order:

1. **Register** - Create a new user account
   - Automatically saves the token to environment variable

2. **Login** - Login with existing credentials
   - Automatically saves the token to environment variable

3. **Get Profile** - Test authentication by getting user profile
   - Uses the saved token

### 3. Expense Management

After authentication, test expense operations:

1. **Create Expense** - Add a new expense
   - Automatically saves the expense ID for other requests

2. **Get All Expenses** - List all expenses with pagination

3. **Get Expenses with Filter** - Filter by category and date range

4. **Get Expense by ID** - Get a specific expense
   - Uses the saved expense ID from Create

5. **Update Expense** - Full update of an expense

6. **Partial Update Expense** - Update only specific fields

7. **Delete Expense** - Remove an expense

### 4. Dashboard Analytics

Test dashboard endpoints:

1. **Get Dashboard Summary** - Overall statistics

2. **Get Summary with Date Filter** - Filtered statistics

3. **Get Category Analytics** - Breakdown by category

4. **Get Category Analytics with Filter** - Filtered by date

5. **Get Monthly Trends** - 12-month trend data

6. **Get Monthly Trends by Year** - Specific year trends

7. **Get Recent Expenses** - Latest expenses

## Environment Variables

The collection uses these environment variables:

- `baseUrl` - The API base URL
- `token` - JWT authentication token (auto-set by auth requests)
- `expenseId` - Last created expense ID (auto-set by Create Expense)

## Tests

Each request includes automated tests that verify:

- Response status codes
- Response body structure
- Data types
- Required fields
- Business logic

Tests run automatically after each request and show pass/fail status.

## Running All Tests

To run all requests in sequence:

1. Select the collection in Bruno
2. Click the "Run Collection" button
3. Review the test results

## Tips

1. **Start with Authentication** - Always run Register or Login first to get a
   valid token

2. **Check Environment Variables** - Make sure `token` is set after login

3. **Create Test Data** - Run "Create Expense" a few times to generate test data

4. **Use Variables** - The `{{expenseId}}` variable is automatically set, but
   you can manually update it in the environment

5. **Modify Request Bodies** - Feel free to modify the JSON bodies to test
   different scenarios

6. **Check Tests** - Review the test results to ensure APIs work correctly

## Example Data

The collection includes realistic example data:

- **Categories**: Food, Transportation, Shopping, Entertainment, Bills,
  Healthcare, Other
- **Sample Expenses**: Grocery shopping, gas, rent, etc.
- **Date Ranges**: Current month and year

## Troubleshooting

### Token Not Set

- Run Login or Register request again
- Check that the response includes a token
- Verify the post-response script executed

### 401 Unauthorized

- Your token may have expired
- Run Login again to get a fresh token

### 404 Not Found

- Check that the API server is running
- Verify the baseUrl in your environment
- Ensure expense ID exists (run Create Expense first)

### Connection Error

- Verify the API server is running on the configured port
- Check your baseUrl environment variable
- Ensure no firewall blocking the connection

### Database Connection Error (Health Check)

- Ensure PostgreSQL is running
- Check database credentials in backend `.env`
- Verify Prisma migrations are applied

## Contributing

When adding new endpoints:

1. Create a new `.bru` file in the appropriate folder
2. Include proper metadata and tests
3. Use environment variables for dynamic values
4. Add documentation in this README
5. Commit the changes to Git

## Version Control

All `.bru` files are plain text and Git-friendly. Commit them like any other
code file:

```bash
git add bruno-api-collection/
git commit -m "Add/Update API collection"
git push
```

## API Endpoints Reference

### Health

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with database status

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/profile` - Get user profile (requires auth)

### Expenses

- `POST /api/v1/expenses` - Create expense (requires auth)
- `GET /api/v1/expenses` - Get all expenses with pagination (requires auth)
- `GET /api/v1/expenses?category=Food&startDate=2025-12-01` - Filter expenses
  (requires auth)
- `GET /api/v1/expenses/:id` - Get expense by ID (requires auth)
- `PUT /api/v1/expenses/:id` - Update expense (requires auth)
- `DELETE /api/v1/expenses/:id` - Delete expense (requires auth)

### Dashboard

- `GET /api/v1/dashboard/summary` - Get summary statistics (requires auth)
- `GET /api/v1/dashboard/summary?startDate=2025-12-01&endDate=2025-12-31` -
  Filtered summary (requires auth)
- `GET /api/v1/dashboard/category-analytics` - Category breakdown (requires
  auth)
- `GET /api/v1/dashboard/category-analytics?startDate=2025-12-01` - Filtered
  analytics (requires auth)
- `GET /api/v1/dashboard/monthly-trends` - 12-month trends (requires auth)
- `GET /api/v1/dashboard/monthly-trends?year=2025` - Year-specific trends
  (requires auth)
- `GET /api/v1/dashboard/recent-expenses?limit=5` - Recent expenses (requires
  auth)
