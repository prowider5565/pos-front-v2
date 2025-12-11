# Users API Quick Reference

## Authentication Endpoints

### Login
```bash
POST /api/users/auth/login/
{
  "login": "username_or_phone",
  "password": "password"
}
→ Returns: { user, access, refresh }
```

### Refresh Token
```bash
POST /api/users/auth/token/refresh/
{ "refresh": "token" }
→ Returns: { access }
```

### Get Current User
```bash
GET /api/users/auth/me/
Authorization: Bearer <token>
→ Returns: user profile
```

### Add User (Superuser)
```bash
POST /api/users/auth/add-user/
Authorization: Bearer <token>
{
  "username": "string",
  "password": "string",
  "phone_number": "+998...",
  "first_name": "string",
  "last_name": "string"
}
→ Returns: { message, user }
```

### List Users (Superuser)
```bash
GET /api/users/auth/list/?is_active=true&page=1
Authorization: Bearer <token>
→ Returns: paginated user list
```

### Disable User (Superuser)
```bash
POST /api/users/auth/disable-user/{user_id}/
Authorization: Bearer <token>
→ Returns: { detail }
```

---

## Supplier Endpoints

### List Suppliers
```bash
GET /api/users/suppliers/?deleted=false&page=1
Authorization: Bearer <token>
→ Returns: paginated supplier list
```

### Get Supplier
```bash
GET /api/users/suppliers/{id}/
Authorization: Bearer <token>
→ Returns: supplier details
```

### Create Supplier
```bash
POST /api/users/suppliers/
Authorization: Bearer <token>
{
  "company_name": "string",
  "full_name": "string",
  "phone_number": "+998...",
  "old_debt": {
    "amount": "decimal",
    "currency": "UZS|USD",
    "exchange_rate": "decimal"
  }
}
→ Returns: supplier details
```

### Update Supplier
```bash
PATCH /api/users/suppliers/{id}/
Authorization: Bearer <token>
{
  "company_name": "string",
  "full_name": "string",
  "phone_number": "+998..."
}
→ Returns: updated supplier
```

### Delete Supplier (Soft Delete)
```bash
DELETE /api/users/suppliers/{id}/
Authorization: Bearer <token>
→ Returns: { detail }
```

### Get Supplier Debts
```bash
GET /api/users/suppliers/{supplier_id}/debts/?page=1
Authorization: Bearer <token>
→ Returns: paginated debt list with amounts
```

---

## Client Endpoints

### List Clients
```bash
GET /api/users/clients/?deleted=false&page=1
Authorization: Bearer <token>
→ Returns: paginated client list
```

### Get Client
```bash
GET /api/users/clients/{id}/
Authorization: Bearer <token>
→ Returns: client details
```

### Create Client
```bash
POST /api/users/clients/
Authorization: Bearer <token>
{
  "full_name": "string",
  "phone_number": "+998..."
}
→ Returns: client details
```

### Update Client
```bash
PATCH /api/users/clients/{id}/
Authorization: Bearer <token>
{
  "full_name": "string",
  "phone_number": "+998..."
}
→ Returns: updated client
```

### Delete Client (Soft Delete)
```bash
DELETE /api/users/clients/{id}/
Authorization: Bearer <token>
→ Returns: { detail }
```

---

## Data Structures

### User Object
```json
{
  "id": 1,
  "username": "string",
  "phone_number": "+998...",
  "first_name": "string",
  "last_name": "string",
  "is_superuser": false,
  "is_active": true
}
```

### Supplier Object
```json
{
  "id": 1,
  "company_name": "string",
  "full_name": "string",
  "phone_number": "+998...",
  "deleted": false
}
```

### Client Object
```json
{
  "id": 1,
  "full_name": "string",
  "phone_number": "+998...",
  "deleted": false
}
```

### Old Debt Object
```json
{
  "id": 1,
  "exchange_rate": "12500.00",
  "currency": "USD",
  "status": "UNPAID|PARTIALLY_PAID|FULLY_PAID",
  "debt_amounts": {
    "original_amount": "1000.00",
    "paid_amount": "0.00",
    "remaining_amount": "1000.00"
  }
}
```

### Pagination Response
```json
{
  "count": 100,
  "current_page": 1,
  "next": "url",
  "previous": null,
  "total_pages": 4,
  "results": []
}
```

---

## Permission Levels

| Permission | Description | Required For |
|------------|-------------|--------------|
| AllowAny | No authentication | Login, Token Refresh |
| IsAuthenticated | Valid JWT token | Me endpoint, Read operations* |
| IsSuperUser | Authenticated superuser | All management operations |

*With ReadOnlyPermissionMixin

---

## Common Query Parameters

| Parameter | Type | Used In | Description |
|-----------|------|---------|-------------|
| `page` | integer | All list endpoints | Page number (default: 1) |
| `is_active` | boolean | User list | Filter by active status |
| `deleted` | boolean | Supplier/Client list | Filter by deleted status |

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Successful operation |
| 201 | Created - Resource created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Authentication failed |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Common Error Messages

### Authentication
```json
{ "detail": "Noto'g'ri login kiritildi." }
{ "detail": "Noto'g'ri parol kiritildi." }
{ "detail": "Authentication credentials were not provided." }
{ "detail": "Given token not valid for any token type" }
```

### Authorization
```json
{ "detail": "Bu amalni faqat platformani adminisitratori amalga oshira oladi." }
```

### Validation
```json
{ "username": ["Bu foydalanuvchi nomi allaqachon mavjud."] }
{ "phone_number": ["Bu telefon raqami allaqachon mavjud."] }
{ "phone_number": ["Bu raqam allaqachon mavjud."] }
```

### Not Found
```json
{ "detail": "User not found." }
{ "detail": "Not found." }
```

---

## Currency Codes

| Code | Description | Default Exchange Rate |
|------|-------------|----------------------|
| UZS | Uzbekistan Sum | 1.0 |
| USD | US Dollar | Market rate |

---

## Soft Delete Behavior

**Default Queries:** Return only non-deleted records (`deleted=false`)

**Explicit Filtering:**
- `?deleted=false` - Active records only
- `?deleted=true` - Deleted records only
- No parameter - Active records only

**After Deletion:**
- Record retained in database
- `deleted` flag set to `true`
- Excluded from default listings
- Phone number becomes reusable

---

## JWT Token Usage

### Token Flow
```
1. POST /auth/login/ → get tokens
2. Use access token in Authorization header
3. When expired, POST /auth/token/refresh/ → get new access token
4. When refresh expires, login again
```

### Header Format
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## Password Support

**Bcrypt** (Primary): Hash starts with `$2`  
**Django Default** (Fallback): Standard Django hash

Both formats validated automatically during login.

---

## Phone Number Format

**Standard:** `+998XXXXXXXXX` (Uzbekistan format)  
**Uniqueness:** Among non-deleted records only  
**Reusable:** After soft deletion

---

## Pagination Details

**Page Size:** 32 items (fixed)  
**Default Page:** 1  
**Page Parameter:** `?page=1`

### Response Structure
- `count`: Total items
- `current_page`: Current page number
- `total_pages`: Total pages
- `next`: Next page URL or null
- `previous`: Previous page URL or null
- `results`: Array of items

---

## Field Constraints

### User
- `username`: Required, unique, max 150 chars
- `password`: Required, min 8 chars (recommended), write-only
- `phone_number`: Required, unique, max 120 chars, default "+998"

### Supplier
- `company_name`: Optional, max 255 chars, default "Firma"
- `full_name`: Required, max 255 chars
- `phone_number`: Required, unique (non-deleted), max 20 chars

### Client
- `full_name`: Required, max 255 chars
- `phone_number`: Required, unique (non-deleted), max 20 chars

### Old Debt
- `amount`: Required, decimal(10,2), must be > 0
- `currency`: Required, choices: UZS, USD
- `exchange_rate`: Optional, decimal(30,2), default 1.0
- `supplier`: Required (auto-set during supplier creation)

---

## Best Practices

### Security
✅ Use HTTPS in production  
✅ Store tokens securely  
✅ Implement token refresh  
✅ Never expose refresh tokens  
✅ Clear tokens on logout

### API Usage
✅ Check HTTP status codes  
✅ Handle pagination properly  
✅ Use filters to reduce data transfer  
✅ Implement retry logic for network errors  
✅ Cache responses when appropriate

### Data Management
✅ Validate phone numbers client-side  
✅ Use international phone format  
✅ Handle soft deletes correctly  
✅ Provide "restore" functionality  
✅ Show deleted items separately if needed

---

## Example Workflows

### 1. User Authentication
```
Login → Store tokens → Make API calls → Refresh when needed → Logout
```

### 2. Create Supplier with Old Debt
```
POST /suppliers/ with old_debt → Debt auto-created → View via /suppliers/{id}/debts/
```

### 3. Manage Client
```
POST /clients/ → PATCH /clients/{id}/ → DELETE /clients/{id}/ (soft)
```

### 4. List with Pagination
```
GET /suppliers/?page=1 → Check total_pages → GET /suppliers/?page=2 → ...
```

---

## Related Documentation

- **Full API Documentation:** `docs/users/USERS_API.md`
- **Analytics API:** `docs/analytics/ANALYTICS_API.md`
- **Debts API:** (See debts app documentation)
- **Payments API:** (See payments app documentation)

---

**Quick Reference Version:** 1.0  
**Last Updated:** 2024
