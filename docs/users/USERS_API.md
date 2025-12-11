# Users API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Authentication Endpoints](#authentication-endpoints)
4. [User Management Endpoints](#user-management-endpoints)
5. [Supplier Management Endpoints](#supplier-management-endpoints)
6. [Client Management Endpoints](#client-management-endpoints)
7. [Data Models](#data-models)
8. [Common Patterns](#common-patterns)
9. [Error Handling](#error-handling)
10. [Examples](#examples)

---

## Overview

The Users API provides comprehensive user authentication, authorization, and management functionality. It handles:

- User registration and authentication (JWT-based)
- User profile management
- Supplier management with old debt tracking
- Client management
- User activation/deactivation

**Base URL:** `/api/users/`

**Authentication:** Most endpoints require JWT Bearer token authentication.

**Pagination:** List endpoints use the global pagination system (32 items per page by default).

---

## Authentication & Authorization

### Authentication Methods

The API uses JWT (JSON Web Token) authentication with two token types:

1. **Access Token**: Short-lived token for API requests (included in Authorization header)
2. **Refresh Token**: Long-lived token to obtain new access tokens

### Permission Levels

- **AllowAny**: No authentication required (login endpoints)
- **IsAuthenticated**: Requires valid JWT access token
- **IsSuperUser**: Requires authenticated user with superuser privileges

### Using Authentication

Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### 1. User Registration (Add User)

Create a new user account. Only accessible by superusers.

**Endpoint:** `POST /api/users/auth/add-user/`

**Permissions:** IsAuthenticated, IsSuperUser

**Request Body:**

```json
{
  "username": "string (required, unique)",
  "password": "string (required, write-only)",
  "phone_number": "string (required, unique, default: '+998')",
  "first_name": "string (optional)",
  "last_name": "string (optional)"
}
```

**Response:** `201 Created`

```json
{
  "message": "Foydalanuvchi {username} tizimga muvaffaqiyatli qo'shildi!",
  "user": {
    "id": 1,
    "username": "johndoe",
    "phone_number": "+998901234567",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Notes:**
- Password is hashed using bcrypt before storage
- Username must be unique among active users
- Phone number must be unique among active users
- Returns user data without password

**Validation Errors:**

- `400 Bad Request`: Username or phone number already exists
  ```json
  {
    "username": ["Bu foydalanuvchi nomi allaqachon mavjud."]
  }
  ```
  ```json
  {
    "phone_number": ["Bu raqam allaqachon mavjud."]
  }
  ```

---

### 2. User Login

Authenticate a user and receive JWT tokens.

**Endpoint:** `POST /api/users/auth/login/`

**Permissions:** AllowAny (No authentication required)

**Request Body:**

```json
{
  "login": "string (required, username or phone_number)",
  "password": "string (required)"
}
```

**Response:** `200 OK`

```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "phone_number": "+998901234567",
    "first_name": "John",
    "last_name": "Doe"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Authentication Process:**

1. Accepts either username OR phone_number in the `login` field
2. Looks up active users only (`is_active=True`)
3. Supports both bcrypt and Django default password hashing
4. Returns JWT access and refresh tokens on success

**Error Responses:**

- `401 Unauthorized`: Invalid credentials
  ```json
  {
    "detail": "Noto'g'ri login kiritildi."
  }
  ```
  ```json
  {
    "detail": "Noto'g'ri parol kiritildi."
  }
  ```

- `400 Bad Request`: Missing required fields
  ```json
  {
    "login": ["Login qismiga telefon raqamingiz yoki foydalanuvchi nomingizni kiriting."]
  }
  ```
  ```json
  {
    "password": ["Parol kiritilmadi."]
  }
  ```

---

### 3. Refresh Token

Obtain a new access token using a refresh token.

**Endpoint:** `POST /api/users/auth/token/refresh/`

**Permissions:** AllowAny

**Request Body:**

```json
{
  "refresh": "string (required, refresh token)"
}
```

**Response:** `200 OK`

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Notes:**
- This endpoint is provided by `rest_framework_simplejwt`
- Use when the access token expires to get a new one without re-logging in

---

### 4. Get Current User (Me)

Retrieve the authenticated user's profile information.

**Endpoint:** `GET /api/users/auth/me/`

**Permissions:** IsAuthenticated

**Response:** `200 OK`

```json
{
  "id": 1,
  "username": "johndoe",
  "phone_number": "+998901234567",
  "first_name": "John",
  "last_name": "Doe",
  "is_superuser": false,
  "is_active": true
}
```

**Notes:**
- Returns the profile of the currently authenticated user
- No request parameters required
- Token user is determined from the Authorization header

---

## User Management Endpoints

### 5. List Users

Retrieve a paginated list of all users with optional filtering.

**Endpoint:** `GET /api/users/auth/list/`

**Permissions:** IsAuthenticated, IsSuperUser

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `is_active` | boolean | No | Filter by active status (true/false) |
| `page` | integer | No | Page number (default: 1) |

**Response:** `200 OK`

```json
{
  "count": 50,
  "current_page": 1,
  "next": "http://api.example.com/api/users/auth/list/?page=2",
  "previous": null,
  "total_pages": 2,
  "results": [
    {
      "id": 1,
      "username": "johndoe",
      "phone_number": "+998901234567",
      "first_name": "John",
      "last_name": "Doe"
    },
    {
      "id": 2,
      "username": "janedoe",
      "phone_number": "+998901234568",
      "first_name": "Jane",
      "last_name": "Doe"
    }
  ]
}
```

**Notes:**
- Returns 32 users per page (global pagination default)
- Password field is never included in response
- Can filter active and inactive users

**Example Requests:**

```bash
# Get all users (first page)
GET /api/users/auth/list/

# Get only active users
GET /api/users/auth/list/?is_active=true

# Get only inactive users
GET /api/users/auth/list/?is_active=false

# Get page 2
GET /api/users/auth/list/?page=2
```

---

### 6. Disable User

Deactivate a user account (soft delete).

**Endpoint:** `POST /api/users/auth/disable-user/{user_id}/`

**Permissions:** IsAuthenticated, IsSuperUser

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | integer | Yes | ID of the user to disable |

**Response:** `200 OK`

```json
{
  "detail": "Foydalanuvchi johndoe o'chirib qo'yildi."
}
```

**Error Responses:**

- `404 Not Found`: User does not exist
  ```json
  {
    "detail": "User not found."
  }
  ```

**Notes:**
- Sets `is_active` to `false` (soft delete)
- User data is retained in the database
- Disabled users cannot log in
- Does not delete user permanently

---

## Supplier Management Endpoints

### 7. List Suppliers

Retrieve a paginated list of suppliers with optional filtering.

**Endpoint:** `GET /api/users/suppliers/`

**Permissions:** IsAuthenticated, IsSuperUser

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deleted` | boolean | No | Filter by deleted status. If not provided, returns only non-deleted suppliers |
| `page` | integer | No | Page number (default: 1) |

**Response:** `200 OK`

```json
{
  "count": 25,
  "current_page": 1,
  "next": "http://api.example.com/api/users/suppliers/?page=2",
  "previous": null,
  "total_pages": 1,
  "results": [
    {
      "id": 1,
      "company_name": "ABC Supply Co.",
      "full_name": "Ali Valiyev",
      "phone_number": "+998901234567",
      "deleted": false
    },
    {
      "id": 2,
      "company_name": "Firma",
      "full_name": "Vali Aliyev",
      "phone_number": "+998901234568",
      "deleted": false
    }
  ]
}
```

**Notes:**
- By default, returns only non-deleted suppliers (`deleted=false`)
- To see all suppliers including deleted ones, explicitly pass `deleted` parameter
- Returns 32 suppliers per page
- `old_debt` field is write-only and not returned in list

**Example Requests:**

```bash
# Get active suppliers (default)
GET /api/users/suppliers/

# Get all suppliers (including deleted)
GET /api/users/suppliers/?deleted=true
GET /api/users/suppliers/?deleted=false

# Get page 2
GET /api/users/suppliers/?page=2
```

---

### 8. Get Supplier Details

Retrieve detailed information about a specific supplier.

**Endpoint:** `GET /api/users/suppliers/{id}/`

**Permissions:** IsAuthenticated, IsSuperUser (Read-only permission mixin applied)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Supplier ID |

**Response:** `200 OK`

```json
{
  "id": 1,
  "company_name": "ABC Supply Co.",
  "full_name": "Ali Valiyev",
  "phone_number": "+998901234567",
  "deleted": false
}
```

**Error Responses:**

- `404 Not Found`: Supplier does not exist
  ```json
  {
    "detail": "Not found."
  }
  ```

---

### 9. Create Supplier

Create a new supplier with optional old debt.

**Endpoint:** `POST /api/users/suppliers/`

**Permissions:** IsAuthenticated, IsSuperUser

**Request Body:**

```json
{
  "company_name": "string (optional, default: 'Firma')",
  "full_name": "string (required)",
  "phone_number": "string (required, unique among non-deleted suppliers)",
  "old_debt": {
    "amount": "decimal (required)",
    "currency": "string (required, choices: 'UZS', 'USD')",
    "exchange_rate": "decimal (optional, default: 1.0)"
  }
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "company_name": "ABC Supply Co.",
  "full_name": "Ali Valiyev",
  "phone_number": "+998901234567",
  "deleted": false
}
```

**Notes:**
- `old_debt` is optional and used for tracking legacy debt from before system implementation
- If `old_debt` is provided, it's created in a transaction with the supplier
- `old_debt` is write-only and not returned in response
- `company_name` defaults to "Firma" if not provided
- Phone number must be unique among non-deleted suppliers

**Old Debt Structure:**

The `old_debt` object follows the `OldSellerDebt` model:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | decimal | Yes | Debt amount (max 10 digits, 2 decimal places) |
| `currency` | string | Yes | Currency code: 'UZS' or 'USD' |
| `exchange_rate` | decimal | No | Exchange rate (max 30 digits, 2 decimal places), default: 1.0 |

**Validation Errors:**

- `400 Bad Request`: Phone number already exists
  ```json
  {
    "phone_number": ["Bu telefon raqami allaqachon mavjud."]
  }
  ```

**Example Request:**

```json
{
  "company_name": "Tech Supplies Ltd",
  "full_name": "Alisher Navoiy",
  "phone_number": "+998901234567",
  "old_debt": {
    "amount": "5000000.00",
    "currency": "UZS",
    "exchange_rate": "1.0"
  }
}
```

---

### 10. Update Supplier

Update an existing supplier's information.

**Endpoint:** `PATCH /api/users/suppliers/{id}/`

**Permissions:** IsAuthenticated, IsSuperUser

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Supplier ID |

**Request Body:** (All fields optional for partial update)

```json
{
  "company_name": "string",
  "full_name": "string",
  "phone_number": "string"
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "company_name": "Updated Company Name",
  "full_name": "Ali Valiyev",
  "phone_number": "+998901234567",
  "deleted": false
}
```

**Notes:**
- Supports partial updates (PATCH method)
- Only provided fields are updated
- Phone number uniqueness is validated (excluding current supplier)
- Cannot update `deleted` status directly (use delete endpoint)
- Cannot update `old_debt` after creation

**Validation Errors:**

- `400 Bad Request`: Phone number already exists for another supplier
  ```json
  {
    "phone_number": ["Bu telefon raqami allaqachon mavjud."]
  }
  ```

---

### 11. Delete Supplier

Soft delete a supplier (sets deleted flag to true).

**Endpoint:** `DELETE /api/users/suppliers/{id}/`

**Permissions:** IsAuthenticated, IsSuperUser

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Supplier ID |

**Response:** `200 OK`

```json
{
  "detail": "Supplier Ali Valiyev o'chirib qo'yildi."
}
```

**Notes:**
- Performs soft delete (sets `deleted=true`)
- Supplier data is retained in database
- Deleted suppliers are excluded from default lists
- Phone number validation allows reuse after deletion

**Error Responses:**

- `404 Not Found`: Supplier does not exist
  ```json
  {
    "detail": "Not found."
  }
  ```

---

### 12. Get Supplier Debts

Retrieve debts associated with a specific supplier.

**Endpoint:** `GET /api/users/suppliers/{supplier_id}/debts/`

**Permissions:** IsAuthenticated, IsSuperUser

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `supplier_id` | integer | Yes | Supplier ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |

**Response:** `200 OK`

```json
{
  "count": 3,
  "current_page": 1,
  "next": null,
  "previous": null,
  "total_pages": 1,
  "results": [
    {
      "id": 1,
      "exchange_rate": "12500.00",
      "currency": "USD",
      "status": "FULLY_PAID",
      "debt_amounts": {
        "original_amount": "1000.00",
        "paid_amount": "1000.00",
        "remaining_amount": "0.00"
      }
    },
    {
      "id": 2,
      "exchange_rate": "1.0",
      "currency": "UZS",
      "status": "PARTIALLY_PAID",
      "debt_amounts": {
        "original_amount": "5000000.00",
        "paid_amount": "2000000.00",
        "remaining_amount": "3000000.00"
      }
    }
  ]
}
```

**Notes:**
- Returns all debts (both old and new) for the specified supplier
- Includes debt status and amount breakdowns
- Uses `DebtAmountField` to calculate amounts
- Paginated with 32 items per page

**Debt Status Values:**

- `FULLY_PAID`: All debt has been paid
- `PARTIALLY_PAID`: Some payments made, debt remaining
- `UNPAID`: No payments made

---

## Client Management Endpoints

### 13. List Clients

Retrieve a paginated list of clients with optional filtering.

**Endpoint:** `GET /api/users/clients/`

**Permissions:** IsAuthenticated, IsSuperUser

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deleted` | boolean | No | Filter by deleted status. If not provided, returns only non-deleted clients |
| `page` | integer | No | Page number (default: 1) |

**Response:** `200 OK`

```json
{
  "count": 40,
  "current_page": 1,
  "next": "http://api.example.com/api/users/clients/?page=2",
  "previous": null,
  "total_pages": 2,
  "results": [
    {
      "id": 1,
      "full_name": "Sardor Rahimov",
      "phone_number": "+998901234567",
      "deleted": false
    },
    {
      "id": 2,
      "full_name": "Dilshod Toshmatov",
      "phone_number": "+998901234568",
      "deleted": false
    }
  ]
}
```

**Notes:**
- By default, returns only non-deleted clients (`deleted=false`)
- To see all clients including deleted ones, explicitly pass `deleted` parameter
- Returns 32 clients per page
- Client model is simpler than Supplier (no company_name field)

**Example Requests:**

```bash
# Get active clients (default)
GET /api/users/clients/

# Get all clients (including deleted)
GET /api/users/clients/?deleted=true
GET /api/users/clients/?deleted=false

# Get page 2
GET /api/users/clients/?page=2
```

---

### 14. Get Client Details

Retrieve detailed information about a specific client.

**Endpoint:** `GET /api/users/clients/{id}/`

**Permissions:** IsAuthenticated, IsSuperUser (Read-only permission mixin applied)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Client ID |

**Response:** `200 OK`

```json
{
  "id": 1,
  "full_name": "Sardor Rahimov",
  "phone_number": "+998901234567",
  "deleted": false
}
```

**Error Responses:**

- `404 Not Found`: Client does not exist
  ```json
  {
    "detail": "Not found."
  }
  ```

---

### 15. Create Client

Create a new client.

**Endpoint:** `POST /api/users/clients/`

**Permissions:** IsAuthenticated, IsSuperUser

**Request Body:**

```json
{
  "full_name": "string (required)",
  "phone_number": "string (required, unique among non-deleted clients)"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "full_name": "Sardor Rahimov",
  "phone_number": "+998901234567",
  "deleted": false
}
```

**Notes:**
- Phone number must be unique among non-deleted clients
- No old debt tracking for clients (unlike suppliers)
- Simpler structure compared to suppliers

**Validation Errors:**

- `400 Bad Request`: Phone number already exists
  ```json
  {
    "phone_number": ["Bu telefon raqami allaqachon mavjud."]
  }
  ```

**Example Request:**

```json
{
  "full_name": "Jahongir Otajonov",
  "phone_number": "+998909876543"
}
```

---

### 16. Update Client

Update an existing client's information.

**Endpoint:** `PATCH /api/users/clients/{id}/`

**Permissions:** IsAuthenticated, IsSuperUser

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Client ID |

**Request Body:** (All fields optional for partial update)

```json
{
  "full_name": "string",
  "phone_number": "string"
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "full_name": "Updated Name",
  "phone_number": "+998901234567",
  "deleted": false
}
```

**Notes:**
- Supports partial updates (PATCH method)
- Only provided fields are updated
- Phone number uniqueness is validated (excluding current client)
- Cannot update `deleted` status directly (use delete endpoint)

**Validation Errors:**

- `400 Bad Request`: Phone number already exists for another client
  ```json
  {
    "phone_number": ["Bu telefon raqami allaqachon mavjud."]
  }
  ```

---

### 17. Delete Client

Soft delete a client (sets deleted flag to true).

**Endpoint:** `DELETE /api/users/clients/{id}/`

**Permissions:** IsAuthenticated, IsSuperUser

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Client ID |

**Response:** `200 OK`

```json
{
  "detail": "Client Sardor Rahimov o'chirib qo'yildi."
}
```

**Notes:**
- Performs soft delete (sets `deleted=true`)
- Client data is retained in database
- Deleted clients are excluded from default lists
- Phone number validation allows reuse after deletion

**Error Responses:**

- `404 Not Found`: Client does not exist
  ```json
  {
    "detail": "Not found."
  }
  ```

---

## Data Models

### User Model

Represents a system user with authentication capabilities.

**Database Table:** `users`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key, Auto-increment | Unique user identifier |
| `username` | string | Required, Unique | Username for login |
| `password` | string (256) | Required, Write-only | Hashed password (bcrypt or Django default) |
| `phone_number` | string (120) | Required, Default: '+998' | User's phone number (can be used for login) |
| `first_name` | string (150) | Optional | User's first name |
| `last_name` | string (150) | Optional | User's last name |
| `is_superuser` | boolean | Default: false | Superuser status for admin access |
| `is_active` | boolean | Default: true | Active status (false = soft deleted) |
| `date_joined` | datetime | Auto-set | Account creation timestamp |
| `last_login` | datetime | Auto-updated | Last login timestamp |

**Inherited from:** `AbstractUser` (Django's built-in user model)

**Authentication:**
- Username field: `username`
- Login accepts: `username` OR `phone_number`
- Password hashing: bcrypt (primary) or Django default

**Notes:**
- Extends Django's `AbstractUser` model
- Custom `USERNAME_FIELD` set to `username`
- Password is never returned in API responses (write-only)
- Phone numbers default to Uzbekistan format (+998)

---

### Supplier Model

Represents a supplier/vendor entity.

**Database Table:** `suppliers`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key, Auto-increment | Unique supplier identifier |
| `company_name` | string (255) | Default: 'Firma' | Company or business name |
| `full_name` | string (255) | Required | Full name of supplier contact person |
| `phone_number` | string (20) | Required | Contact phone number |
| `deleted` | boolean | Default: false | Soft delete flag |
| `created_at` | datetime | Auto-set | Record creation timestamp |

**Inherited from:** `BaseModel`

**Relationships:**
- Has many `OldSellerDebt` records
- Has many `NewSellerDebt` records
- Has many `ProductBatch` records (through purchases)

**Validation:**
- `phone_number` must be unique among non-deleted suppliers
- Can include `old_debt` object during creation (write-only)

**Business Rules:**
- Soft delete only (data retained)
- Phone number can be reused after deletion
- Old debt can only be set during creation
- Company name defaults to "Firma" if not provided

---

### Client Model

Represents a customer/client entity.

**Database Table:** `clients`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key, Auto-increment | Unique client identifier |
| `full_name` | string (255) | Required | Client's full name |
| `phone_number` | string (20) | Required | Client's phone number |
| `deleted` | boolean | Default: false | Soft delete flag |
| `created_at` | datetime | Auto-set | Record creation timestamp |

**Inherited from:** `BaseModel`

**Relationships:**
- Has many `Sale` records
- Has many `OldClientDebt` records

**Validation:**
- `phone_number` must be unique among non-deleted clients

**Business Rules:**
- Soft delete only (data retained)
- Phone number can be reused after deletion
- Simpler structure than Supplier (no company_name, no old debt support)

---

### OldSellerDebt Model

Represents legacy debt from suppliers (before system implementation).

**Database Table:** `old_seller_debts`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key, Auto-increment | Unique debt identifier |
| `supplier` | foreign key | Required | Reference to Supplier |
| `amount` | decimal (10,2) | Required | Original debt amount |
| `currency` | string | Required, Choices: 'UZS', 'USD' | Currency code |
| `exchange_rate` | decimal (30,2) | Default: 1.0 | Exchange rate at time of debt |
| `created_at` | datetime | Auto-set | Record creation timestamp |

**Inherited from:** `BaseModel`

**Relationships:**
- Belongs to `Supplier` (foreign key)
- Has many `OldSellerDebtPayment` records

**Computed Fields:**
- `status`: UNPAID, PARTIALLY_PAID, or FULLY_PAID (based on payments)
- `debt_amounts`: Object with original_amount, paid_amount, remaining_amount

**Business Rules:**
- Created during supplier registration for legacy debt tracking
- Cannot be modified after creation (except through payments)
- Exchange rate locked at creation time
- Status calculated dynamically based on payment history

---

## Common Patterns

### Pagination

All list endpoints use the global pagination system with consistent structure.

**Default Page Size:** 32 items

**Query Parameter:** `page` (integer, default: 1)

**Response Structure:**

```json
{
  "count": 100,
  "current_page": 2,
  "next": "http://api.example.com/endpoint/?page=3",
  "previous": "http://api.example.com/endpoint/?page=1",
  "total_pages": 4,
  "results": [...]
}
```

**Pagination Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `count` | integer | Total number of items across all pages |
| `current_page` | integer | Current page number |
| `next` | string/null | URL to next page (null if last page) |
| `previous` | string/null | URL to previous page (null if first page) |
| `total_pages` | integer | Total number of pages |
| `results` | array | Array of items for current page |

**Notes:**
- Page numbers start at 1
- Missing or empty page parameter defaults to 1
- Invalid page numbers return error message
- Page size is fixed at 32 (not configurable per request)

---

### Soft Delete Pattern

All entity deletion endpoints implement soft delete (logical delete) rather than hard delete.

**Implementation:**
- Sets `deleted` field to `true`
- Data remains in database
- Excluded from default listings

**Benefits:**
- Data recovery possible
- Audit trail maintained
- Referential integrity preserved
- Historical data available

**Query Behavior:**

```bash
# Default: only active (deleted=false)
GET /api/users/suppliers/

# Explicit filter
GET /api/users/suppliers/?deleted=false
GET /api/users/suppliers/?deleted=true
```

**Reuse Policy:**
- Phone numbers can be reused after deletion
- Unique constraints apply only to non-deleted records

---

### Permission System

The API uses a layered permission system with multiple checks.

**Permission Classes:**

1. **AllowAny**
   - No authentication required
   - Used for: Login endpoint
   
2. **IsAuthenticated**
   - Requires valid JWT token
   - Used for: Me endpoint
   
3. **IsSuperUser**
   - Requires authenticated superuser
   - Used for: All management endpoints
   - Error message: "Bu amalni faqat platformani adminisitratori amalga oshira oladi."

**ReadOnlyPermissionMixin:**

Applied to ViewSets to enforce different permissions for read vs write operations:
- Read operations (GET, HEAD, OPTIONS): `IsAuthenticated`
- Write operations (POST, PATCH, DELETE): `IsAuthenticated` + `IsSuperUser`

**Usage Pattern:**

```python
# View with IsSuperUser requirement
permission_classes = [IsAuthenticated, IsSuperUser]

# ViewSet with ReadOnlyPermissionMixin
class SupplierViewSet(ReadOnlyPermissionMixin, ModelViewSet):
    # GET: IsAuthenticated only
    # POST/PATCH/DELETE: IsAuthenticated + IsSuperUser
    pass
```

---

### Password Handling

The system supports dual password hashing schemes for backward compatibility.

**Supported Formats:**

1. **Bcrypt** (Primary)
   - Format: Starts with `$2` prefix
   - Used for: New user registrations
   - Library: `bcrypt` package
   
2. **Django Default** (Fallback)
   - Format: Standard Django password hash
   - Used for: Legacy compatibility
   - Library: `django.contrib.auth.hashers`

**Registration Flow:**

```python
# Password is hashed with bcrypt during user creation
raw_password = "user_password"
hashed = bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt())
```

**Login Validation:**

```python
# System automatically detects hash type
if password.startswith('$2'):
    # Bcrypt validation
    is_valid = bcrypt.checkpw(password.encode('utf-8'), stored_hash)
else:
    # Django default validation
    is_valid = check_password(password, stored_hash)
```

**Security Notes:**
- Passwords never returned in API responses (write-only)
- Bcrypt uses auto-generated salt
- No password recovery (must be reset by admin)

---

### JWT Token System

Authentication uses JWT tokens with access/refresh pattern.

**Token Types:**

1. **Access Token**
   - Short-lived (configurable expiry)
   - Used for API authentication
   - Included in Authorization header
   
2. **Refresh Token**
   - Long-lived (configurable expiry)
   - Used to obtain new access tokens
   - Not included in API requests

**Token Flow:**

```
1. Login → Receive access + refresh tokens
2. Use access token for API requests
3. When access token expires → Use refresh token to get new access token
4. When refresh token expires → Must login again
```

**Usage:**

```bash
# Login
POST /api/users/auth/login/
Response: { "access": "...", "refresh": "..." }

# API Request
GET /api/users/auth/me/
Authorization: Bearer <access_token>

# Refresh
POST /api/users/auth/token/refresh/
Body: { "refresh": "<refresh_token>" }
Response: { "access": "..." }
```

**Implementation:**
- Library: `rest_framework_simplejwt`
- User identification: Extracted from token payload
- Token validation: Automatic via middleware

---

### Currency Support

The system supports multi-currency operations with exchange rate tracking.

**Supported Currencies:**

- `UZS`: Uzbekistan Sum (default)
- `USD`: US Dollar

**Fields:**

```python
currency = "UZS" or "USD"
exchange_rate = Decimal("12500.00")  # UZS per USD
amount = Decimal("1000.00")  # Amount in specified currency
```

**Exchange Rate Rules:**

- Default: `1.0` (for UZS or when not needed)
- Used for: Converting between currencies
- Locked at creation: Exchange rate stored with debt/transaction
- Precision: 30 digits total, 2 decimal places

**Usage in Old Debts:**

```json
{
  "amount": "1000.00",
  "currency": "USD",
  "exchange_rate": "12500.00"
}
```

This represents $1,000 USD, equivalent to 12,500,000 UZS at the recorded rate.

---

## Error Handling

### Standard Error Responses

The API returns standardized error responses with appropriate HTTP status codes.

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| `200` | OK | Successful GET, PATCH, DELETE operations |
| `201` | Created | Successful POST (resource creation) |
| `400` | Bad Request | Validation errors, malformed requests |
| `401` | Unauthorized | Authentication failed or missing token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource does not exist |
| `500` | Internal Server Error | Server-side errors |

---

### Authentication Errors

**Missing Token:**

```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Invalid Token:**

```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token is invalid or expired"
    }
  ]
}
```

**Expired Token:**

```json
{
  "detail": "Token has expired",
  "code": "token_not_valid"
}
```

---

### Authorization Errors

**Insufficient Permissions (Non-Superuser):**

```json
{
  "detail": "Bu amalni faqat platformani adminisitratori amalga oshira oladi."
}
```

---

### Validation Errors

**Field Validation:**

```json
{
  "username": ["Bu foydalanuvchi nomi allaqachon mavjud."],
  "phone_number": ["Bu raqam allaqachon mavjud."]
}
```

**Missing Required Field:**

```json
{
  "full_name": ["This field is required."]
}
```

**Invalid Data Type:**

```json
{
  "amount": ["A valid number is required."]
}
```

---

### Resource Not Found

**User Not Found:**

```json
{
  "detail": "User not found."
}
```

**Generic Not Found:**

```json
{
  "detail": "Not found."
}
```

---

### Login Errors

**Invalid Username/Phone:**

```json
{
  "detail": "Noto'g'ri login kiritildi."
}
```

**Invalid Password:**

```json
{
  "detail": "Noto'g'ri parol kiritildi."
}
```

**Missing Login Field:**

```json
{
  "login": ["Login qismiga telefon raqamingiz yoki foydalanuvchi nomingizni kiriting."]
}
```

**Missing Password:**

```json
{
  "password": ["Parol kiritilmadi."]
}
```

---

### Pagination Errors

**Invalid Page Number:**

```json
{
  "detail": "Invalid page number."
}
```

---

## Examples

### Complete User Registration Flow

**Step 1: Superuser Creates New User**

```bash
curl -X POST https://api.example.com/api/users/auth/add-user/ \
  -H "Authorization: Bearer <superuser_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "SecurePass123",
    "phone_number": "+998901234567",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

**Response:**

```json
{
  "message": "Foydalanuvchi newuser tizimga muvaffaqiyatli qo'shildi!",
  "user": {
    "id": 5,
    "username": "newuser",
    "phone_number": "+998901234567",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

---

### Complete Login Flow

**Step 1: Login with Username**

```bash
curl -X POST https://api.example.com/api/users/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "login": "newuser",
    "password": "SecurePass123"
  }'
```

**Step 2: Login with Phone Number (Alternative)**

```bash
curl -X POST https://api.example.com/api/users/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "login": "+998901234567",
    "password": "SecurePass123"
  }'
```

**Response:**

```json
{
  "user": {
    "id": 5,
    "username": "newuser",
    "phone_number": "+998901234567",
    "first_name": "John",
    "last_name": "Doe"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Step 3: Use Access Token**

```bash
curl -X GET https://api.example.com/api/users/auth/me/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Step 4: Refresh Token When Expired**

```bash
curl -X POST https://api.example.com/api/users/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }'
```

---

### Supplier Management Workflow

**Step 1: Create Supplier with Old Debt**

```bash
curl -X POST https://api.example.com/api/users/suppliers/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Tech Supplies Inc",
    "full_name": "Alisher Navoiy",
    "phone_number": "+998901111111",
    "old_debt": {
      "amount": "5000000.00",
      "currency": "UZS",
      "exchange_rate": "1.0"
    }
  }'
```

**Response:**

```json
{
  "id": 10,
  "company_name": "Tech Supplies Inc",
  "full_name": "Alisher Navoiy",
  "phone_number": "+998901111111",
  "deleted": false
}
```

**Step 2: List All Active Suppliers**

```bash
curl -X GET https://api.example.com/api/users/suppliers/ \
  -H "Authorization: Bearer <access_token>"
```

**Step 3: Get Supplier Debts**

```bash
curl -X GET https://api.example.com/api/users/suppliers/10/debts/ \
  -H "Authorization: Bearer <access_token>"
```

**Response:**

```json
{
  "count": 1,
  "current_page": 1,
  "next": null,
  "previous": null,
  "total_pages": 1,
  "results": [
    {
      "id": 15,
      "exchange_rate": "1.0",
      "currency": "UZS",
      "status": "UNPAID",
      "debt_amounts": {
        "original_amount": "5000000.00",
        "paid_amount": "0.00",
        "remaining_amount": "5000000.00"
      }
    }
  ]
}
```

**Step 4: Update Supplier Information**

```bash
curl -X PATCH https://api.example.com/api/users/suppliers/10/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Tech Supplies Ltd",
    "phone_number": "+998902222222"
  }'
```

**Step 5: Delete (Soft Delete) Supplier**

```bash
curl -X DELETE https://api.example.com/api/users/suppliers/10/ \
  -H "Authorization: Bearer <access_token>"
```

**Response:**

```json
{
  "detail": "Supplier Alisher Navoiy o'chirib qo'yildi."
}
```

---

### Client Management Workflow

**Step 1: Create Client**

```bash
curl -X POST https://api.example.com/api/users/clients/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Sardor Rahimov",
    "phone_number": "+998903333333"
  }'
```

**Response:**

```json
{
  "id": 20,
  "full_name": "Sardor Rahimov",
  "phone_number": "+998903333333",
  "deleted": false
}
```

**Step 2: List All Active Clients**

```bash
curl -X GET https://api.example.com/api/users/clients/ \
  -H "Authorization: Bearer <access_token>"
```

**Step 3: Update Client**

```bash
curl -X PATCH https://api.example.com/api/users/clients/20/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Sardor Rahimovich Rahimov"
  }'
```

**Step 4: Get Client Details**

```bash
curl -X GET https://api.example.com/api/users/clients/20/ \
  -H "Authorization: Bearer <access_token>"
```

**Step 5: Delete (Soft Delete) Client**

```bash
curl -X DELETE https://api.example.com/api/users/clients/20/ \
  -H "Authorization: Bearer <access_token>"
```

---

### User Management Workflow

**Step 1: List All Users**

```bash
curl -X GET https://api.example.com/api/users/auth/list/ \
  -H "Authorization: Bearer <superuser_access_token>"
```

**Step 2: Filter Active Users Only**

```bash
curl -X GET "https://api.example.com/api/users/auth/list/?is_active=true" \
  -H "Authorization: Bearer <superuser_access_token>"
```

**Step 3: Disable a User**

```bash
curl -X POST https://api.example.com/api/users/auth/disable-user/5/ \
  -H "Authorization: Bearer <superuser_access_token>"
```

**Response:**

```json
{
  "detail": "Foydalanuvchi newuser o'chirib qo'yildi."
}
```

**Step 4: Verify User is Disabled**

```bash
curl -X GET "https://api.example.com/api/users/auth/list/?is_active=false" \
  -H "Authorization: Bearer <superuser_access_token>"
```

---

### Pagination Example

**Navigating Multiple Pages:**

```bash
# Get first page (default)
curl -X GET https://api.example.com/api/users/suppliers/ \
  -H "Authorization: Bearer <access_token>"

# Get specific page
curl -X GET "https://api.example.com/api/users/suppliers/?page=2" \
  -H "Authorization: Bearer <access_token>"

# Response structure
{
  "count": 95,
  "current_page": 2,
  "next": "https://api.example.com/api/users/suppliers/?page=3",
  "previous": "https://api.example.com/api/users/suppliers/?page=1",
  "total_pages": 3,
  "results": [...]
}
```

---

### Error Handling Examples

**Example 1: Duplicate Phone Number**

```bash
curl -X POST https://api.example.com/api/users/suppliers/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Supplier",
    "phone_number": "+998901111111"
  }'
```

**Response: 400 Bad Request**

```json
{
  "phone_number": ["Bu telefon raqami allaqachon mavjud."]
}
```

**Example 2: Unauthorized Access**

```bash
curl -X POST https://api.example.com/api/users/suppliers/ \
  -H "Authorization: Bearer <invalid_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Supplier",
    "phone_number": "+998904444444"
  }'
```

**Response: 401 Unauthorized**

```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid"
}
```

**Example 3: Non-Superuser Attempting Restricted Action**

```bash
curl -X POST https://api.example.com/api/users/auth/add-user/ \
  -H "Authorization: Bearer <regular_user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123"
  }'
```

**Response: 403 Forbidden**

```json
{
  "detail": "Bu amalni faqat platformani adminisitratori amalga oshira oladi."
}
```

---

## Best Practices

### Authentication
- Store tokens securely (e.g., httpOnly cookies, secure storage)
- Implement token refresh before expiration
- Clear tokens on logout
- Never log or expose refresh tokens

### Phone Number Format
- Use international format: `+998XXXXXXXXX`
- Validate format on client side
- Store with country code

### Error Handling
- Always check HTTP status codes
- Display user-friendly error messages
- Log errors for debugging
- Handle network failures gracefully

### Pagination
- Use `total_pages` to show page indicators
- Implement "Load More" or page navigation
- Cache previous pages if needed
- Show loading states during pagination

### Soft Deletes
- Clarify to users that deletion is reversible
- Implement "restore" functionality if needed
- Provide filters to view deleted items
- Consider automatic cleanup after retention period

### Security
- Always use HTTPS in production
- Implement rate limiting for authentication endpoints
- Use strong passwords (enforce on client side)
- Monitor for suspicious activity
- Implement account lockout after failed attempts

---

## Appendix

### Related Documentation

- **Debts API**: Documentation for debt management endpoints
- **Payments API**: Documentation for payment processing
- **Analytics API**: See `docs/analytics/ANALYTICS_API.md`

### Quick Reference

**Authentication Endpoints:**
- `POST /api/users/auth/login/` - Login
- `POST /api/users/auth/token/refresh/` - Refresh token
- `GET /api/users/auth/me/` - Get current user

**User Management (Superuser only):**
- `POST /api/users/auth/add-user/` - Create user
- `GET /api/users/auth/list/` - List users
- `POST /api/users/auth/disable-user/{id}/` - Disable user

**Suppliers (Superuser only):**
- `GET /api/users/suppliers/` - List suppliers
- `POST /api/users/suppliers/` - Create supplier
- `GET /api/users/suppliers/{id}/` - Get supplier
- `PATCH /api/users/suppliers/{id}/` - Update supplier
- `DELETE /api/users/suppliers/{id}/` - Delete supplier
- `GET /api/users/suppliers/{id}/debts/` - Get supplier debts

**Clients (Superuser only):**
- `GET /api/users/clients/` - List clients
- `POST /api/users/clients/` - Create client
- `GET /api/users/clients/{id}/` - Get client
- `PATCH /api/users/clients/{id}/` - Update client
- `DELETE /api/users/clients/{id}/` - Delete client

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**API Base URL:** `/api/users/`

