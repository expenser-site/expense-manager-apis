# 🚀 Getting Started with HATEOAS APIs

## Quick Start (5 minutes)

### 1. Environment Setup

```bash
# Make sure BASE_URL is set in .env
echo "BASE_URL=http://localhost:3001" >> .env
```

### 2. Start the Server

```bash
cd expense-manager-apis
pnpm install  # Install dependencies (compression, uuid already added)
pnpm run dev  # Start development server
```

### 3. Test HATEOAS Links

```bash
# Get expenses with links
curl http://localhost:3001/api/v1/expenses | jq '._links'

# Expected output:
# [
#   {
#     "rel": "self",
#     "href": "/api/v1/expenses",
#     "method": "GET",
#     "description": "Get all expenses"
#   },
#   ...
# ]
```

### 4. Verify Performance Optimizations

```bash
# Check compression
curl -i http://localhost:3001/api/v1/expenses | grep "Content-Encoding"
# Expected: Content-Encoding: gzip

# Check health endpoint
curl http://localhost:3001/api/health/detailed | jq '.services.hateoas'
# Expected: { "status": "healthy", "cacheSize": 15, ... }
```

---

## Understanding HATEOAS Links

### Basic Structure

Every response includes a `_links` array:

```json
{
  "data": {
    "id": "123",
    "amount": 100,
    "description": "Coffee"
  },
  "_links": [
    {
      "rel": "self",
      "href": "/api/v1/expenses/123",
      "method": "GET",
      "description": "Get this expense"
    },
    {
      "rel": "update",
      "href": "/api/v1/expenses/123",
      "method": "PUT",
      "description": "Update this expense"
    },
    {
      "rel": "delete",
      "href": "/api/v1/expenses/123",
      "method": "DELETE",
      "description": "Delete this expense"
    }
  ]
}
```

### Link Relations Explained

| Relation   | Meaning          | Example              |
| ---------- | ---------------- | -------------------- |
| `self`     | Current resource | Get this expense     |
| `update`   | Modify resource  | Update this expense  |
| `delete`   | Remove resource  | Delete this expense  |
| `list`     | Collection       | Get all expenses     |
| `create`   | New resource     | Create new expense   |
| `category` | Related resource | Get expense category |
| `stats`    | Statistics       | View expense stats   |

---

## Client Usage Examples

### JavaScript/Fetch

```javascript
// 1. Get expenses
const response = await fetch('http://localhost:3000/api/v1/expenses');
const data = await response.json();

// 2. Find the link you need
const selfLink = data._links.find(link => link.rel === 'self');
const updateLink = data._links.find(link => link.rel === 'update');
const deleteLink = data._links.find(link => link.rel === 'delete');

// 3. Use the links (URLs can change without breaking your code!)
await fetch(`http://localhost:3000${updateLink.href}`, {
  method: updateLink.method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 150 })
});

// 4. Leverage ETag caching
const cachedResponse = await fetch('http://localhost:3000/api/v1/expenses', {
  headers: {
    'If-None-Match': response.headers.get('etag')
  }
});

if (cachedResponse.status === 304) {
  console.log('Using cached data - 70-90% faster!');
  // Use previously fetched data
}
```

### React Hook

```javascript
import { useState, useEffect } from 'react';

function useHATEOAS(url) {
  const [data, setData] = useState(null);
  const [links, setLinks] = useState([]);
  const [etag, setEtag] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const headers = {};
      if (etag) {
        headers['If-None-Match'] = etag;
      }

      const response = await fetch(url, { headers });

      if (response.status === 304) {
        // Data unchanged, use cached version
        return;
      }

      const json = await response.json();
      setData(json.data);
      setLinks(json._links || []);
      setEtag(response.headers.get('etag'));
    };

    fetchData();
  }, [url, etag]);

  // Helper to find links by relation
  const getLink = rel => links.find(link => link.rel === rel);

  return { data, links, getLink };
}

// Usage
function ExpenseList() {
  const { data, getLink } = useHATEOAS('/api/v1/expenses');

  const handleUpdate = async expense => {
    const updateLink = getLink('update');
    if (updateLink) {
      await fetch(`${updateLink.href}`, {
        method: updateLink.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      });
    }
  };

  return <div>...</div>;
}
```

### cURL Examples

```bash
# Get all expenses with links
curl http://localhost:3001/api/v1/expenses | jq '._links'

# Get single expense
curl http://localhost:3001/api/v1/expenses/123 | jq

# Update expense (follow update link)
UPDATE_HREF=$(curl -s http://localhost:3001/api/v1/expenses/123 | jq -r '._links[] | select(.rel=="update") | .href')
curl -X PUT "http://localhost:3001$UPDATE_HREF" \
  -H "Content-Type: application/json" \
  -d '{"amount": 150}'

# Test ETag caching
ETAG=$(curl -si http://localhost:3001/api/v1/expenses | grep -i etag | cut -d' ' -f2 | tr -d '\r')
curl -i -H "If-None-Match: $ETAG" http://localhost:3001/api/v1/expenses
# Expected: HTTP/1.1 304 Not Modified
```

---

## Performance Features

### 1. Response Compression

**Automatic!** All responses > 1KB are gzipped.

```bash
# Verify compression
curl -i http://localhost:3001/api/v1/expenses | grep "Content-Encoding"
```

**Opt-out:** Add header `x-no-compression` to disable for specific requests.

### 2. ETag Caching

**Automatic for GET requests!** Enabled on:

- `/api/v1/expenses`
- `/api/v1/categories`
- `/api/v1/dashboard`

```javascript
// Client-side implementation
let cachedEtag = null;

async function fetchWithETag(url) {
  const headers = {};
  if (cachedEtag) {
    headers['If-None-Match'] = cachedEtag;
  }

  const response = await fetch(url, { headers });

  if (response.status === 304) {
    return null; // Use cached data
  }

  cachedEtag = response.headers.get('etag');
  return response.json();
}
```

### 3. Link Caching

**Automatic!** Static links are cached in memory.

Monitor cache:

```bash
curl http://localhost:3001/api/health/detailed | jq '.services.hateoas.cacheSize'
# Expected: 15
```

---

## Common Patterns

### Pattern 1: Follow Links to Navigate

```javascript
// Don't hardcode URLs!
❌ const url = '/api/v1/expenses/123';

// Instead, follow links
✅ const selfLink = expense._links.find(l => l.rel === 'self');
   const url = selfLink.href;
```

### Pattern 2: Discover Available Actions

```javascript
// Check what actions are available
const availableActions = expense._links.map(link => ({
  action: link.rel,
  description: link.description,
  method: link.method
}));

console.log(availableActions);
// [
//   { action: 'self', description: 'Get this expense', method: 'GET' },
//   { action: 'update', description: 'Update this expense', method: 'PUT' },
//   { action: 'delete', description: 'Delete this expense', method: 'DELETE' }
// ]
```

### Pattern 3: Conditional UI Rendering

```javascript
// Show buttons based on available links
function ExpenseCard({ expense }) {
  const hasUpdateLink = expense._links.some(l => l.rel === 'update');
  const hasDeleteLink = expense._links.some(l => l.rel === 'delete');

  return (
    <div>
      <h3>{expense.description}</h3>
      <p>${expense.amount}</p>

      {hasUpdateLink && <button>Edit</button>}
      {hasDeleteLink && <button>Delete</button>}
    </div>
  );
}
```

---

## Debugging

### Check Link Generation

```bash
# Get detailed health status
curl http://localhost:3001/api/health/detailed | jq

# Expected output includes:
# {
#   "services": {
#     "hateoas": {
#       "status": "healthy",
#       "message": "HATEOAS link generation functional",
#       "baseUrl": "http://localhost:3001",
#       "cacheSize": 15,
#       "cacheEnabled": true
#     }
#   }
# }
```

### Common Issues

**1. Links have `localhost` in production**

```bash
# Fix: Update .env
BASE_URL=https://api.your-domain.com
```

**2. No compression**

```bash
# Check if client supports compression
curl -H "Accept-Encoding: gzip" http://localhost:3001/api/v1/expenses

# Verify response header
Content-Encoding: gzip
```

**3. ETag not working**

```bash
# Make sure you're using GET request
curl -X GET http://localhost:3001/api/v1/expenses

# ETag only applies to GET requests on specific routes
```

**4. Invalid UUID errors in logs**

```bash
# Check server logs for warnings
# "Invalid expense ID: abc123"

# Fix: Ensure you're using valid UUIDs from the database
```

---

## Best Practices

### 1. Always Use Links

```javascript
✅ Good: const href = expense._links.find(l => l.rel === 'self').href;
❌ Bad:  const href = `/api/v1/expenses/${expense.id}`;
```

### 2. Cache ETags Client-Side

```javascript
✅ Good: Store ETags and send If-None-Match headers
❌ Bad:  Always fetch fresh data
```

### 3. Handle 304 Responses

```javascript
✅ Good: if (response.status === 304) return cachedData;
❌ Bad:  Ignore 304 and always parse response
```

### 4. Check Link Availability

```javascript
✅ Good: if (expense._links.find(l => l.rel === 'delete')) { ... }
❌ Bad:  Assume delete link always exists
```

---

## Testing Your Integration

```bash
# 1. Get all expenses
curl http://localhost:3001/api/v1/expenses | jq '._links'

# 2. Verify compression
curl -i http://localhost:3001/api/v1/expenses | grep "Content-Encoding"

# 3. Test ETag
ETAG=$(curl -si http://localhost:3001/api/v1/expenses | grep -i etag | cut -d' ' -f2 | tr -d '\r')
curl -i -H "If-None-Match: $ETAG" http://localhost:3001/api/v1/expenses

# 4. Check health
curl http://localhost:3000/api/health/detailed | jq '.services.hateoas'

# 5. Test invalid ID handling
curl http://localhost:3000/api/v1/expenses/invalid-id
# Should not crash, check logs for warning
```

---

## Next Steps

1. **Read the Docs**
   - [HATEOAS_IMPLEMENTATION.md](./HATEOAS_IMPLEMENTATION.md) - Full guide
   - [HATEOAS_SUMMARY.md](./HATEOAS_SUMMARY.md) - Quick reference
   - [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) - Visual overview

2. **Integrate with Your Client**
   - Update fetch calls to use links
   - Implement ETag caching
   - Add link-based UI rendering

3. **Monitor Performance**
   - Check `/api/health/detailed` regularly
   - Monitor cache hit rates
   - Measure response times

4. **Deploy to Production**
   - Update BASE_URL in .env
   - Enable HTTPS
   - Configure CDN for static assets

---

## Support

Questions? Check:

- [HATEOAS_COMPLETE.md](./HATEOAS_COMPLETE.md) - Full summary
- [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) - Testing guide
- [HATEOAS_PERFORMANCE_RECOMMENDATIONS.md](./HATEOAS_PERFORMANCE_RECOMMENDATIONS.md) -
  Optimization tips

---

**Happy coding!** 🚀
