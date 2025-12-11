# Users API Documentation

This directory contains comprehensive documentation for the Users API, which handles authentication, authorization, and entity management (users, suppliers, clients).

## Documentation Files

### 📘 [USERS_API.md](USERS_API.md)
**Complete API Reference** - 1959 lines

Comprehensive documentation covering:
- All 17 API endpoints with detailed specifications
- Request/response formats for every endpoint
- Authentication and authorization mechanisms
- Data models and field definitions
- Common patterns (pagination, soft delete, permissions)
- Error handling with all error codes and messages
- Complete code examples and workflows
- Best practices and security guidelines

**Use this for:** In-depth understanding, implementation reference, troubleshooting

### 📗 [USERS_QUICK_REFERENCE.md](USERS_QUICK_REFERENCE.md)
**Quick Reference Guide** - 457 lines

Condensed reference including:
- All endpoints with curl examples
- Data structures and response formats
- Permission levels and status codes
- Common query parameters
- Error messages reference
- Field constraints
- Best practices checklist

**Use this for:** Quick lookups, cheat sheet, daily development

---

## API Overview

### Base URL
```
/api/users/
```

### Total Endpoints: 17

**Authentication (6 endpoints):**
- User login (username or phone)
- Token refresh
- Current user profile
- User registration (superuser only)
- List users (superuser only)
- Disable user (superuser only)

**Supplier Management (6 endpoints):**
- List suppliers
- Create supplier (with optional old debt)
- Get supplier details
- Update supplier
- Delete supplier (soft delete)
- Get supplier debts

**Client Management (5 endpoints):**
- List clients
- Create client
- Get client details
- Update client
- Delete client (soft delete)

---

## Key Features

### 🔐 Authentication
- **JWT-based** authentication with access/refresh tokens
- **Dual login** support: username OR phone number
- **Dual password** hashing: bcrypt (primary) + Django default (fallback)
- Automatic token validation via middleware

### 👥 User Management
- User registration by superusers
- User profile retrieval
- User listing with filters
- Soft delete (disable) functionality

### 🏢 Supplier Management
- CRUD operations with soft delete
- Old debt tracking during creation
- Phone number uniqueness validation
- Company name with default value
- Debt history retrieval

### 🛒 Client Management
- CRUD operations with soft delete
- Simplified structure (no company name)
- Phone number uniqueness validation
- Soft delete with data retention

### 🔒 Security Features
- JWT access/refresh token pattern
- Bcrypt password hashing
- Permission-based access control
- Superuser-only operations
- Token expiration handling

### 📄 Pagination
- Consistent pagination across all list endpoints
- 32 items per page (fixed)
- Standard response format with metadata
- Page navigation support

### 🗑️ Soft Delete
- All deletions are logical (data retained)
- Deleted records excluded from defaults
- Phone numbers reusable after deletion
- Filter support for viewing deleted records

---

## Permission Levels

| Level | Description | Endpoints |
|-------|-------------|-----------|
| **AllowAny** | No authentication | Login, Token Refresh |
| **IsAuthenticated** | Valid JWT token | Me, Read operations* |
| **IsSuperUser** | Authenticated superuser | All management operations |

*ReadOnlyPermissionMixin allows authenticated users to read, superusers to write

---

## Data Models

### User
- Username, password (hashed), phone number
- First name, last name
- Superuser and active flags
- Timestamps (date_joined, last_login)

### Supplier
- Company name (default: "Firma"), full name, phone number
- Deleted flag, created_at timestamp
- Optional old_debt during creation

### Client
- Full name, phone number
- Deleted flag, created_at timestamp

### OldSellerDebt
- Amount, currency (UZS/USD), exchange rate
- Status (UNPAID/PARTIALLY_PAID/FULLY_PAID)
- Calculated debt amounts

---

## Quick Start Examples

### 1. Login
```bash
curl -X POST /api/users/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"login": "username", "password": "pass123"}'
```

### 2. Get Current User
```bash
curl -X GET /api/users/auth/me/ \
  -H "Authorization: Bearer <access_token>"
```

### 3. Create Supplier
```bash
curl -X POST /api/users/suppliers/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "ABC Inc",
    "full_name": "John Doe",
    "phone_number": "+998901234567"
  }'
```

### 4. List Clients
```bash
curl -X GET /api/users/clients/ \
  -H "Authorization: Bearer <token>"
```

---

## Common Use Cases

### New User Setup
1. Superuser creates account via `/auth/add-user/`
2. New user logs in via `/auth/login/`
3. User stores access/refresh tokens
4. User makes authenticated requests

### Supplier Onboarding
1. Create supplier via `/suppliers/`
2. Optionally include old_debt for legacy tracking
3. View supplier debts via `/suppliers/{id}/debts/`
4. Update information as needed

### Client Management
1. Create client via `/clients/`
2. Update client info via `/clients/{id}/`
3. Soft delete when no longer active
4. Filter to view deleted clients if needed

### Token Refresh Flow
1. Access token expires during request
2. Catch 401 error
3. Use refresh token at `/auth/token/refresh/`
4. Get new access token
5. Retry original request

---

## Error Handling

### Common HTTP Status Codes
- `200 OK` - Successful operation
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication failed
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found

### Common Errors
- Duplicate username/phone number
- Invalid credentials
- Insufficient permissions
- Token expired/invalid
- Resource not found
- Invalid page number

See full documentation for complete error reference.

---

## Field Constraints Summary

### Phone Numbers
- Format: `+998XXXXXXXXX` (Uzbekistan)
- Must be unique among non-deleted records
- Reusable after soft delete

### Passwords
- Hashed with bcrypt (new) or Django default (legacy)
- Write-only (never returned in responses)
- Minimum 8 characters recommended

### Names
- Username: max 150 characters, unique
- Full names: max 255 characters
- Company name: max 255 characters, default "Firma"

### Currency
- Supported: UZS (Uzbekistan Sum), USD (US Dollar)
- Exchange rate: decimal(30,2), default 1.0
- Amounts: decimal(10,2)

---

## Integration Notes

### With Other Apps
- **Debts App**: Supplier debts endpoint at `/suppliers/{id}/debts/`
- **Payments App**: Payments reference suppliers and clients
- **Sales App**: Sales reference clients
- **Products App**: Product batches reference suppliers

### Database Relationships
- Supplier → OldSellerDebt (one-to-many)
- Supplier → NewSellerDebt (one-to-many)
- Client → Sale (one-to-many)
- Client → OldClientDebt (one-to-many)

---

## Testing Checklist

### Authentication
- [ ] Login with username
- [ ] Login with phone number
- [ ] Token refresh
- [ ] Invalid credentials handling
- [ ] Token expiration

### User Management
- [ ] Create user (superuser only)
- [ ] List users with filters
- [ ] Disable user
- [ ] Permission checks

### Supplier Management
- [ ] Create supplier without old debt
- [ ] Create supplier with old debt
- [ ] List suppliers with pagination
- [ ] Update supplier
- [ ] Soft delete supplier
- [ ] View supplier debts

### Client Management
- [ ] Create client
- [ ] List clients with pagination
- [ ] Update client
- [ ] Soft delete client
- [ ] Filter deleted clients

---

## API Design Principles

### RESTful
- Standard HTTP methods (GET, POST, PATCH, DELETE)
- Resource-based URLs
- Proper status codes
- JSON request/response

### Consistency
- Uniform pagination structure
- Standard error format
- Consistent naming conventions
- Common patterns across endpoints

### Security
- JWT token authentication
- Permission-based authorization
- Password hashing
- Soft delete for data retention

### User Experience
- Clear error messages
- Uzbek language support for errors
- Flexible login (username or phone)
- Partial update support (PATCH)

---

## Best Practices

### For API Consumers

**Authentication:**
- Store tokens securely
- Implement automatic token refresh
- Handle 401 errors gracefully
- Clear tokens on logout

**Error Handling:**
- Check status codes
- Parse error messages
- Display user-friendly errors
- Log errors for debugging

**Performance:**
- Use pagination properly
- Cache responses when appropriate
- Implement debouncing for search
- Minimize redundant requests

**Data Management:**
- Validate data client-side
- Use proper phone number format
- Handle soft deletes correctly
- Show deleted items when relevant

### For API Maintainers

**Security:**
- Use HTTPS in production
- Implement rate limiting
- Monitor authentication attempts
- Regular security audits

**Documentation:**
- Keep docs synchronized with code
- Update examples for changes
- Document breaking changes
- Version API when needed

**Testing:**
- Test all endpoints
- Test permission boundaries
- Test edge cases
- Integration tests with other apps

**Monitoring:**
- Log authentication failures
- Track API usage
- Monitor response times
- Alert on errors

---

## Migration Guide

### From Username-Only to Phone Support
The API now supports login with either username or phone number. No breaking changes - username login continues to work.

### From Hard Delete to Soft Delete
All delete operations now perform soft deletes. Update client code to:
1. Use `?deleted=true` to view deleted records
2. Implement restore functionality if needed
3. Update deletion confirmation messages

### Password Hashing Update
New users get bcrypt hashing. Existing Django-hashed passwords continue to work. Gradual migration on password changes.

---

## Troubleshooting

### "Authentication credentials were not provided"
**Cause:** Missing or malformed Authorization header  
**Fix:** Include `Authorization: Bearer <token>` header

### "Bu amalni faqat platformani adminisitratori amalga oshira oladi"
**Cause:** Non-superuser attempting superuser-only operation  
**Fix:** Use superuser account or request permission elevation

### "Bu telefon raqami allaqachon mavjud"
**Cause:** Phone number already exists for non-deleted record  
**Fix:** Use different phone number or check for duplicates

### Token expired
**Cause:** Access token has expired  
**Fix:** Use refresh token to get new access token

### Pagination showing empty results
**Cause:** Page number beyond available pages  
**Fix:** Check `total_pages` in response, use valid page number

---

## Version History

### Version 1.0 (Current)
- Complete authentication system with JWT
- User management (CRUD + disable)
- Supplier management with old debt tracking
- Client management
- Soft delete implementation
- Dual password hashing support
- Phone number login support
- Comprehensive pagination

---

## Support & Contributing

### Getting Help
1. Check this documentation first
2. Review error messages carefully
3. Check example workflows
4. Consult related app documentation

### Reporting Issues
- Provide endpoint URL
- Include request/response
- Note error messages
- Describe expected behavior

### Feature Requests
- Describe use case
- Explain current limitation
- Suggest implementation
- Consider backward compatibility

---

## Related Resources

- **Full API Documentation**: [USERS_API.md](USERS_API.md)
- **Quick Reference**: [USERS_QUICK_REFERENCE.md](USERS_QUICK_REFERENCE.md)
- **Analytics API**: `../analytics/ANALYTICS_API.md`
- **Debts App**: (See debts app documentation)
- **Payments App**: (See payments app documentation)

---

**Documentation Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Development Team  
**API Base URL:** `/api/users/`
