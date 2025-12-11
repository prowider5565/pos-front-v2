# Debts API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [Old Seller Debt Endpoints](#old-seller-debt-endpoints)
5. [Old Client Debt Endpoints](#old-client-debt-endpoints)
6. [Data Models](#data-models)
7. [Debt Status](#debt-status)
8. [Currency Support](#currency-support)
9. [Error Handling](#error-handling)
10. [Examples](#examples)

---

## Overview

The Debts API manages legacy debt tracking for suppliers and clients. It handles debts that existed before system implementation ("old debts") and automatically created debts from product batch imports ("new debts"). New seller debts are created automatically when batches are imported and are managed through the Products/Payments APIs.

**Key Features:**
- Old seller (supplier) debt management
- Old client debt management
- Debt status tracking (PENDING, PARTIALLY_PAID, PAID)
- Multi-currency support (UZS, USD)
- Exchange rate tracking
- Automatic debt amount calculations
- Pagination support

**Base URL:** `/api/debts/`

**Authentication:** All endpoints require JWT Bearer token authentication.

---

## Base URL

```
/api/debts/
```

All debt endpoints are prefixed with this base URL.

---

## Authentication

All endpoints require JWT authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

**Permission Level:** IsAuthenticated, IsSuperUser (for create operations)

---

## Old Seller Debt Endpoints

### 1. Create Old Seller Debt

Create a legacy debt record for a supplier.

**Endpoint:** `POST /api/debts/old-seller-debts/`

**Permissions:** IsAuthenticated, IsSuperUser

**Request Body:**

```json
{
  "supplier": 1,
  "amount": "5000000.00",
  "currency": "UZS",
  "exchange_rate": "1.0"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `supplier` | integer | Yes | Supplier ID |
| `amount` | decimal | Yes | Debt amount (must be > 0) |
| `currency` | string | Yes | Currency code: 'UZS' or 'USD' |
| `exchange_rate` | decimal | No | Exchange rate (default: 1.0), max 30 digits, 2 decimals |

**Response:** `201 Created`

```json
{
  "id": 1,
  "supplier": 1,
  "amount": "5000000.00",
  "exchange_rate": "1.0",
  "currency": "UZS"
}
```

**Validation Rules:**
- Supplier must exist and not be deleted
- Amount must be greater than zero
- Currency must be 'UZS' or 'USD'
- Exchange rate must be positive

**Error Responses:**

- `400 Bad Request`: Validation error
  ```json
  {
    "supplier": ["Cannot create debt for a deleted supplier."]
  }
  ```
  ```json
  {
    "amount": ["Amount must be greater than zero."]
  }
  ```

---

### 2. List Old Seller Debts

Retrieve debts for a specific supplier with filtering options.

**Endpoint:** `GET /api/debts/old-seller-debts/`

**Permissions:** IsAuthenticated, IsSuperUser

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `supplier_id` | integer | Yes | Filter by supplier ID |
| `status` | string | No | Filter by status: 'PENDING', 'PARTIALLY_PAID', 'PAID' |
| `currency` | string | No | Filter by currency: 'UZS' or 'USD' |
| `page` | integer | No | Page number (default: 1) |

**Response:** `200 OK`

```json
{
  "count": 3,
  "current_page": 1,
  "next": null,
  "previous": null,
  "total_pages": 1,
  "supplier": {
    "id": 1,
    "full_name": "Ali Valiyev",
    "company_name": "ABC Supply Co.",
    "phone_number": "+998901234567"
  },
  "results": [
    {
      "id": 1,
      "exchange_rate": "1.0",
      "currency": "UZS",
      "status": "PARTIALLY_PAID",
      "debt_amounts": {
        "original_amount": "5000000.00",
        "paid_amount": "2000000.00",
        "remaining_amount": "3000000.00"
      }
    },
    {
      "id": 2,
      "exchange_rate": "12500.00",
      "currency": "USD",
      "status": "PAID",
      "debt_amounts": {
        "original_amount": "1000.00",
        "paid_amount": "1000.00",
        "remaining_amount": "0.00"
      }
    }
  ]
}
```

**Notes:**
- Returns 32 debts per page (global pagination)
- Includes supplier metadata in response
- Debt amounts calculated from payment records
- Status computed dynamically based on payments

**Error Responses:**

- `400 Bad Request`: Missing required supplier_id
  ```json
  {
    "error": "Supplier ID is required"
  }
  ```

---

### 3. Get Old Seller Debt Details

Retrieve details of a specific old seller debt.

**Endpoint:** `GET /api/debts/old-seller-debts/{id}/`

**Permissions:** IsAuthenticated, IsSuperUser

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Old seller debt ID |

**Response:** `200 OK`

```json
{
  "id": 1,
  "supplier": 1,
  "amount": "5000000.00",
  "exchange_rate": "1.0",
  "currency": "UZS"
}
```

**Error Responses:**

- `404 Not Found`: Debt does not exist
  ```json
  {
    "detail": "Not found."
  }
  ```

---

## Old Client Debt Endpoints

### 4. Create Old Client Debt

Create a legacy debt record for a client.

**Endpoint:** `POST /api/debts/old-client-debts/`

**Permissions:** IsAuthenticated, IsSuperUser

**Request Body:**

```json
{
  "client": 1,
  "amount": "3000000.00",
  "currency": "UZS",
  "exchange_rate": "1.0"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `client` | integer | Yes | Client ID |
| `amount` | decimal | Yes | Debt amount (must be > 0) |
| `currency` | string | Yes | Currency code: 'UZS' or 'USD' |
| `exchange_rate` | decimal | No | Exchange rate (default: 1.0), max 30 digits, 2 decimals |

**Response:** `201 Created`

```json
{
  "id": 1,
  "client": 1,
  "amount": "3000000.00",
  "exchange_rate": "1.0",
  "currency": "UZS"
}
```

**Validation Rules:**
- Client must exist and not be deleted
- Amount must be greater than zero
- Currency must be 'UZS' or 'USD'
- Exchange rate must be positive

**Error Responses:**

- `400 Bad Request`: Validation error
  ```json
  {
    "client": ["Cannot create debt for a deleted client."]
  }
  ```
  ```json
  {
    "amount": ["Amount must be greater than zero."]
  }
  ```

---

### 5. List Old Client Debts

Retrieve debts for a specific client with filtering options.

**Endpoint:** `GET /api/debts/old-client-debts/`

**Permissions:** IsAuthenticated, IsSuperUser

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `client_id` | integer | Yes | Filter by client ID |
| `status` | string | No | Filter by status: 'PENDING', 'PARTIALLY_PAID', 'PAID' |
| `currency` | string | No | Filter by currency: 'UZS' or 'USD' |
| `page` | integer | No | Page number (default: 1) |

**Response:** `200 OK`

```json
{
  "count": 2,
  "current_page": 1,
  "next": null,
  "previous": null,
  "total_pages": 1,
  "client": {
    "id": 1,
    "full_name": "Sardor Rahimov",
    "phone_number": "+998901234567"
  },
  "results": [
    {
      "id": 1,
      "exchange_rate": "1.0",
      "currency": "UZS",
      "status": "PENDING",
      "debt_amounts": {
        "original_amount": "3000000.00",
        "paid_amount": "0.00",
        "remaining_amount": "3000000.00"
      }
    },
    {
      "id": 2,
      "exchange_rate": "12500.00",
      "currency": "USD",
      "status": "PARTIALLY_PAID",
      "debt_amounts": {
        "original_amount": "500.00",
        "paid_amount": "200.00",
        "remaining_amount": "300.00"
      }
    }
  ]
}
```

**Notes:**
- Returns 32 debts per page (global pagination)
- Includes client metadata in response
- Debt amounts calculated from payment records
- Status computed dynamically based on payments

**Error Responses:**

- `400 Bad Request`: Missing required client_id
  ```json
  {
    "error": "Client ID is required"
  }
  ```

---

### 6. Get Old Client Debt Details

Retrieve details of a specific old client debt.

**Endpoint:** `GET /api/debts/old-client-debts/{id}/`

**Permissions:** IsAuthenticated, IsSuperUser

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Old client debt ID |

**Response:** `200 OK`

```json
{
  "id": 1,
  "client": 1,
  "amount": "3000000.00",
  "exchange_rate": "1.0",
  "currency": "UZS"
}
```

**Error Responses:**

- `404 Not Found`: Debt does not exist
  ```json
  {
    "detail": "Not found."
  }
  ```

---

## Data Models

### OldSellerDebt Model

Represents legacy debt from suppliers (before system implementation).

**Database Table:** `old_seller_debts`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key, Auto-increment | Unique debt identifier |
| `supplier` | foreign key | Required, CASCADE | Reference to Supplier |
| `amount` | decimal (10,2) | Required | Original debt amount |
| `currency` | string | Required, Choices: 'UZS', 'USD' | Currency code |
| `exchange_rate` | decimal (30,2) | Default: 1.0 | Exchange rate at debt creation |
| `status` | string (25) | Choices: DebtStatus | Debt payment status |
| `created_at` | datetime | Auto-set | Record creation timestamp |

**Inherited from:** `BaseModel`, `FinancialModel`

**Relationships:**
- Belongs to `Supplier` (foreign key)
- Has many `OldSellerDebtPayment` records

**Computed Fields:**
- `status`: PENDING, PARTIALLY_PAID, or PAID (based on payments)
- `debt_amounts`: Object with original_amount, paid_amount, remaining_amount

---

### OldClientDebt Model

Represents legacy debt from clients (before system implementation).

**Database Table:** `old_client_debts`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key, Auto-increment | Unique debt identifier |
| `client` | foreign key | Required, CASCADE | Reference to Client |
| `amount` | decimal (10,2) | Required | Original debt amount |
| `currency` | string | Required, Choices: 'UZS', 'USD' | Currency code |
| `exchange_rate` | decimal (30,2) | Default: 1.0 | Exchange rate at debt creation |
| `status` | string (25) | Choices: DebtStatus | Debt payment status |
| `created_at` | datetime | Auto-set | Record creation timestamp |

**Inherited from:** `BaseModel`, `FinancialModel`

**Relationships:**
- Belongs to `Client` (foreign key)
- Has many `OldClientDebtPayment` records

**Computed Fields:**
- `status`: PENDING, PARTIALLY_PAID, or PAID (based on payments)
- `debt_amounts`: Object with original_amount, paid_amount, remaining_amount

---

### NewSellerDebt Model

Represents debt automatically created when a product batch is imported from a supplier.

**Database Table:** `new_seller_debts`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key, Auto-increment | Unique debt identifier |
| `product_batch` | foreign key | Required, CASCADE, OneToOne | Reference to ProductBatch |
| `supplier` | foreign key | Required, CASCADE | Reference to Supplier |
| `amount` | decimal (30,2) | Required | Batch purchase amount |
| `currency` | string | Required | Currency code |
| `exchange_rate` | decimal (30,2) | Required | Exchange rate at batch creation |
| `status` | string (25) | Choices: DebtStatus | Debt payment status |
| `deleted` | boolean | Default: false | Soft delete flag |
| `created_at` | datetime | Auto-set | Record creation timestamp |

**Inherited from:** `BaseModel`, `AmountModel`

**Relationships:**
- Belongs to `ProductBatch` (one-to-one)
- Belongs to `Supplier` (foreign key)
- Has many `NewSellerDebtPayment` records

**Notes:**
- Created automatically during batch import
- Cannot be created manually via API
- Managed through Products and Payments APIs

---

## Debt Status

The system uses three debt statuses to track payment progress:

### Status Values

| Status | Value | Description |
|--------|-------|-------------|
| **PENDING** | `PENDING` | No payments made yet |
| **PARTIALLY_PAID** | `PARTIALLY_PAID` | Some payments made, balance remaining |
| **PAID** | `PAID` | Fully paid, no balance remaining |

### Status Calculation

Status is calculated dynamically based on payment records:

```
IF total_paid = 0:
    status = PENDING
ELSE IF total_paid < original_amount:
    status = PARTIALLY_PAID
ELSE IF total_paid >= original_amount:
    status = PAID
```

**Notes:**
- Status is read-only and computed automatically
- Cannot be set manually
- Updates automatically when payments are added
- All currencies converted to UZS for calculation

---

## Currency Support

The Debts API supports multi-currency operations:

### Supported Currencies

| Code | Name | Description |
|------|------|-------------|
| **UZS** | Uzbekistan Sum | Default currency |
| **USD** | US Dollar | Foreign currency |

### Exchange Rate Handling

- **Default Rate:** 1.0 (for UZS or when not specified)
- **Precision:** 30 digits total, 2 decimal places
- **Locked at Creation:** Exchange rate is stored with debt and never changes
- **Payment Conversion:** Payments in different currencies converted using debt's exchange rate

### Currency Conversion Example

```
Debt: $1,000 USD at rate 12,500.00
Equivalent: 12,500,000 UZS

Payment: $500 USD
Converted: 6,250,000 UZS
Remaining: $500 USD or 6,250,000 UZS
```

---

## Error Handling

### Standard Error Responses

| Code | Meaning | Usage |
|------|---------|-------|
| `200` | OK | Successful GET operations |
| `201` | Created | Successful POST operations |
| `400` | Bad Request | Validation errors, missing parameters |
| `401` | Unauthorized | Missing or invalid auth token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource does not exist |
| `500` | Internal Server Error | Server-side errors |

### Common Errors

**Missing Required Parameter:**

```json
{
  "error": "Supplier ID is required"
}
```

**Invalid Entity:**

```json
{
  "supplier": ["Cannot create debt for a deleted supplier."]
}
```

**Invalid Amount:**

```json
{
  "amount": ["Amount must be greater than zero."]
}
```

**Not Found:**

```json
{
  "detail": "Not found."
}
```

---

## Examples

### Create Old Seller Debt

**Request:**

```bash
curl -X POST https://api.example.com/api/debts/old-seller-debts/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "supplier": 1,
    "amount": "5000000.00",
    "currency": "UZS",
    "exchange_rate": "1.0"
  }'
```

**Response:**

```json
{
  "id": 1,
  "supplier": 1,
  "amount": "5000000.00",
  "exchange_rate": "1.0",
  "currency": "UZS"
}
```

---

### List Supplier Debts with Filtering

**Request:**

```bash
curl -X GET "https://api.example.com/api/debts/old-seller-debts/?supplier_id=1&status=PARTIALLY_PAID" \
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
  "supplier": {
    "id": 1,
    "full_name": "Ali Valiyev",
    "company_name": "ABC Supply Co.",
    "phone_number": "+998901234567"
  },
  "results": [
    {
      "id": 1,
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

---

### Create Old Client Debt

**Request:**

```bash
curl -X POST https://api.example.com/api/debts/old-client-debts/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "client": 1,
    "amount": "3000000.00",
    "currency": "UZS"
  }'
```

**Response:**

```json
{
  "id": 1,
  "client": 1,
  "amount": "3000000.00",
  "exchange_rate": "1.0",
  "currency": "UZS"
}
```

---

### Get Debt Details

**Request:**

```bash
curl -X GET https://api.example.com/api/debts/old-seller-debts/1/ \
  -H "Authorization: Bearer <access_token>"
```

**Response:**

```json
{
  "id": 1,
  "supplier": 1,
  "amount": "5000000.00",
  "exchange_rate": "1.0",
  "currency": "UZS"
}
```

---

## Best Practices

### For API Consumers

**Debt Creation:**
- Always specify currency explicitly
- Provide exchange rate for USD debts
- Validate supplier/client exists before creating debt
- Use appropriate precision for amounts

**Debt Retrieval:**
- Always provide required entity ID (supplier_id or client_id)
- Use status filter to find specific debt states
- Handle pagination for large debt lists
- Cache supplier/client metadata when appropriate

**Error Handling:**
- Check entity exists before creating debt
- Validate amount is positive
- Handle validation errors gracefully
- Display user-friendly error messages

---

## Related Documentation

- **Payments API**: For making payments against debts
- **Users API**: For managing suppliers and clients
- **Products API**: For understanding new seller debt creation

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**API Base URL:** `/api/debts/`
