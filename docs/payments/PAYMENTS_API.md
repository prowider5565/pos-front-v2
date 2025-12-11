# Payments API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [Old Seller Debt Payment Endpoints](#old-seller-debt-payment-endpoints)
5. [Old Client Debt Payment Endpoints](#old-client-debt-payment-endpoints)
6. [New Seller Debt Payment Endpoints](#new-seller-debt-payment-endpoints)
7. [Sale Payment Endpoints](#sale-payment-endpoints)
8. [Data Models](#data-models)
9. [Payment Methods](#payment-methods)
10. [Payment Distribution](#payment-distribution)
11. [Error Handling](#error-handling)
12. [Examples](#examples)

---

## Overview

The Payments API handles all payment processing for debts and sales. It supports:

- **Old Seller Debt Payments**: Payments for legacy supplier debts
- **Old Client Debt Payments**: Payments for legacy client debts
- **New Seller Debt Payments**: Payments for batch import debts
- **Sale Payments**: Payments for sales transactions

**Key Features:**
- Direct payment to specific debt/sale
- Bulk payment distribution (FIFO strategy)
- Multi-currency support (UZS, USD)
- Multiple payment methods
- Automatic debt/sale status updates
- Payment tracking and history
- Overpayment prevention

**Base URL:** `/api/payments/`

**Authentication:** All endpoints require JWT Bearer token authentication.

---

## Base URL

```
/api/payments/
```

All payment endpoints are prefixed with this base URL.

---

## Authentication

All endpoints require JWT authentication:

```
Authorization: Bearer <access_token>
```

**Permission Level:** IsAuthenticated

---

## Old Seller Debt Payment Endpoints

### 1. Create Direct Payment (Old Seller Debt)

Make a direct payment to a specific old seller debt.

**Endpoint:** `POST /api/payments/old-seller-debt-payments/direct-payment/`

**Permissions:** IsAuthenticated

**Request Body:**

```json
{
  "old_seller_debt_id": 1,
  "amount": "1000000.00",
  "currency": "UZS",
  "exchange_rate": "1.0"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `old_seller_debt_id` | integer | Yes | Old seller debt ID |
| `amount` | decimal | Yes | Payment amount (must be > 0) |
| `currency` | string | Yes | Currency: 'UZS' or 'USD' |
| `exchange_rate` | decimal | No | Exchange rate (default: 1.0) |

**Response:** `201 Created`

```json
{
  "id": 1,
  "old_seller_debt": 1,
  "amount_display": {
    "amount": "1000000.00",
    "currency": "UZS"
  },
  "exchange_rate": "1.0",
  "currency": "UZS",
  "seller": 1
}
```

**Notes:**
- Payment amount cannot exceed remaining debt
- Automatically updates debt status
- Seller (user) is set from authenticated user
- Prevents overpayment

**Error Responses:**

- `400 Bad Request`: Overpayment attempt
  ```json
  {
    "non_field_errors": ["Payment amount exceeds remaining debt amount."]
  }
  ```

---

### 2. Create Bulk Payment (Old Seller Debt)

Distribute a payment across multiple old seller debts for a supplier using FIFO strategy.

**Endpoint:** `POST /api/payments/old-seller-debt-payments/bulk-payment/`

**Permissions:** IsAuthenticated

**Request Body:**

```json
{
  "supplier_id": 1,
  "total_amount": "5000000.00",
  "currency": "UZS",
  "exchange_rate": "1.0"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `supplier_id` | integer | Yes | Supplier ID |
| `total_amount` | decimal | Yes | Total payment amount |
| `currency` | string | Yes | Currency: 'UZS' or 'USD' |
| `exchange_rate` | decimal | No | Exchange rate (default: 1.0) |

**Response:** `201 Created`

```json
{
  "total_amount": "5000000.00",
  "total_distributed": "5000000.00",
  "payments_created": 3,
  "payments": [
    {
      "id": 1,
      "old_seller_debt": 1,
      "amount_display": {
        "amount": "3000000.00",
        "currency": "UZS"
      },
      "exchange_rate": "1.0",
      "currency": "UZS",
      "seller": 1
    },
    {
      "id": 2,
      "old_seller_debt": 2,
      "amount_display": {
        "amount": "2000000.00",
        "currency": "UZS"
      },
      "exchange_rate": "1.0",
      "currency": "UZS",
      "seller": 1
    }
  ]
}
```

**Distribution Strategy:**
- **FIFO (First In, First Out)**: Oldest unpaid debts paid first
- Automatically splits payment across multiple debts
- Stops when total amount exhausted or all debts paid
- Updates each debt's status automatically

**Notes:**
- Payment distributed to debts with status PENDING or PARTIALLY_PAID
- Ordered by created_at (oldest first)
- Cannot exceed total unpaid amount
- Returns details of all created payments

**Error Responses:**

- `400 Bad Request`: No unpaid debts
  ```json
  {
    "non_field_errors": ["No unpaid debts found for this supplier."]
  }
  ```

- `400 Bad Request`: Overpayment
  ```json
  {
    "non_field_errors": ["Total payment exceeds total unpaid amount."]
  }
  ```

---

### 3. Get Supplier Payments

Retrieve all payments made for a supplier's old debts.

**Endpoint:** `GET /api/payments/old-seller-debt-payments/supplier-payments/`

**Permissions:** IsAuthenticated

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `supplier_id` | integer | Yes | Supplier ID |
| `old_debt_id` | integer | No | Filter by specific old debt |

**Response:** `200 OK`

```json
{
  "supplier": {
    "id": 1,
    "full_name": "Ali Valiyev",
    "company_name": "ABC Supply Co.",
    "phone_number": "+998901234567"
  },
  "total_paid": "7000000.00",
  "payments": [
    {
      "id": 1,
      "old_seller_debt": 1,
      "amount_display": {
        "amount": "3000000.00",
        "currency": "UZS"
      },
      "exchange_rate": "1.0",
      "currency": "UZS",
      "seller": 1
    },
    {
      "id": 2,
      "old_seller_debt": 2,
      "amount_display": {
        "amount": "4000000.00",
        "currency": "UZS"
      },
      "exchange_rate": "1.0",
      "currency": "UZS",
      "seller": 1
    }
  ]
}
```

**Notes:**
- Returns all payments for supplier's old debts
- Total paid calculated in UZS
- Can filter by specific debt

---

### 4. Get Debt Payments

Retrieve all payments for a specific old seller debt.

**Endpoint:** `GET /api/payments/old-seller-debt-payments/debt-payments/`

**Permissions:** IsAuthenticated

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `old_debt_id` | integer | Yes | Old debt ID |

**Response:** `200 OK`

```json
{
  "old_debt": {
    "id": 1,
    "supplier": 1,
    "amount": "5000000.00",
    "currency": "UZS",
    "exchange_rate": "1.0"
  },
  "total_paid": "3000000.00",
  "remaining": "2000000.00",
  "payments": [
    {
      "id": 1,
      "old_seller_debt": 1,
      "amount_display": {
        "amount": "2000000.00",
        "currency": "UZS"
      },
      "exchange_rate": "1.0",
      "currency": "UZS",
      "seller": 1
    },
    {
      "id": 2,
      "old_seller_debt": 1,
      "amount_display": {
        "amount": "1000000.00",
        "currency": "UZS"
      },
      "exchange_rate": "1.0",
      "currency": "UZS",
      "seller": 1
    }
  ]
}
```

**Notes:**
- Shows payment history for specific debt
- Includes remaining amount calculation
- All amounts in original currency

---

## Old Client Debt Payment Endpoints

### 5. Create Direct Payment (Old Client Debt)

Make a direct payment to a specific old client debt.

**Endpoint:** `POST /api/payments/old-client-debt-payments/direct-payment/`

**Permissions:** IsAuthenticated

**Request Body:**

```json
{
  "old_client_debt_id": 1,
  "amount": "500000.00",
  "currency": "UZS",
  "exchange_rate": "1.0"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `old_client_debt_id` | integer | Yes | Old client debt ID |
| `amount` | decimal | Yes | Payment amount (must be > 0) |
| `currency` | string | Yes | Currency: 'UZS' or 'USD' |
| `exchange_rate` | decimal | No | Exchange rate (default: 1.0) |

**Response:** `201 Created`

```json
{
  "id": 1,
  "old_client_debt": 1,
  "amount_display": {
    "amount": "500000.00",
    "currency": "UZS"
  },
  "exchange_rate": "1.0",
  "currency": "UZS",
  "seller": 1
}
```

**Notes:**
- Same behavior as old seller debt payments
- Prevents overpayment
- Updates debt status automatically

---

### 6. Create Bulk Payment (Old Client Debt)

Distribute a payment across multiple old client debts using FIFO strategy.

**Endpoint:** `POST /api/payments/old-client-debt-payments/bulk-payment/`

**Permissions:** IsAuthenticated

**Request Body:**

```json
{
  "client_id": 1,
  "total_amount": "2000000.00",
  "currency": "UZS",
  "exchange_rate": "1.0"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `client_id` | integer | Yes | Client ID |
| `total_amount` | decimal | Yes | Total payment amount |
| `currency` | string | Yes | Currency: 'UZS' or 'USD' |
| `exchange_rate` | decimal | No | Exchange rate (default: 1.0) |

**Response:** `201 Created`

```json
{
  "total_amount": "2000000.00",
  "total_distributed": "2000000.00",
  "payments_created": 2,
  "payments": [...]
}
```

**Notes:**
- FIFO distribution strategy
- Same behavior as supplier bulk payments
- Prevents overpayment

---

### 7. Get Client Payments

Retrieve all payments made for a client's old debts.

**Endpoint:** `GET /api/payments/old-client-debt-payments/client-payments/`

**Permissions:** IsAuthenticated

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `client_id` | integer | Yes | Client ID |
| `old_debt_id` | integer | No | Filter by specific old debt |

**Response:** `200 OK`

```json
{
  "client": {
    "id": 1,
    "full_name": "Sardor Rahimov",
    "phone_number": "+998901234567"
  },
  "total_paid": "2000000.00",
  "payments": [...]
}
```

---

### 8. Get Debt Payments (Old Client Debt)

Retrieve all payments for a specific old client debt.

**Endpoint:** `GET /api/payments/old-client-debt-payments/debt-payments/`

**Permissions:** IsAuthenticated

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `old_debt_id` | integer | Yes | Old client debt ID |

**Response:** `200 OK`

```json
{
  "old_debt": {...},
  "total_paid": "1500000.00",
  "remaining": "500000.00",
  "payments": [...]
}
```

---

## New Seller Debt Payment Endpoints

### 9. Create Direct Payment (New Seller Debt)

Make a direct payment to a specific new seller debt (from batch import).

**Endpoint:** `POST /api/payments/new-seller-debt-payments/direct-payment/`

**Permissions:** IsAuthenticated

**Request Body:**

```json
{
  "new_seller_debt_id": 1,
  "amount": "1000000.00",
  "currency": "UZS",
  "exchange_rate": "1.0"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `new_seller_debt_id` | integer | Yes | New seller debt ID |
| `amount` | decimal | Yes | Payment amount (must be > 0) |
| `currency` | string | Yes | Currency: 'UZS' or 'USD' |
| `exchange_rate` | decimal | No | Exchange rate (default: 1.0) |

**Response:** `201 Created`

```json
{
  "id": 1,
  "new_seller_debt": 1,
  "amount_display": {
    "amount": "1000000.00",
    "currency": "UZS"
  },
  "exchange_rate": "1.0",
  "currency": "UZS",
  "seller": 1
}
```

**Notes:**
- New seller debts created automatically when batches imported
- Same payment behavior as old seller debts
- Linked to specific product batch

---

### 10. Create Bulk Payment (New Seller Debt)

Distribute a payment across multiple new seller debts for a supplier.

**Endpoint:** `POST /api/payments/new-seller-debt-payments/bulk-payment/`

**Permissions:** IsAuthenticated

**Request Body:**

```json
{
  "supplier_id": 1,
  "total_amount": "3000000.00",
  "currency": "UZS",
  "exchange_rate": "1.0"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `supplier_id` | integer | Yes | Supplier ID |
| `total_amount` | decimal | Yes | Total payment amount |
| `currency` | string | Yes | Currency: 'UZS' or 'USD' |
| `exchange_rate` | decimal | No | Exchange rate (default: 1.0) |

**Response:** `201 Created`

```json
{
  "total_amount": "3000000.00",
  "total_distributed": "3000000.00",
  "payments_created": 2,
  "payments": [...]
}
```

---

### 11. Get New Debt Payments

Retrieve all payments for a specific new seller debt.

**Endpoint:** `GET /api/payments/new-seller-debt-payments/debt-payments/`

**Permissions:** IsAuthenticated

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `new_seller_debt_id` | integer | Yes | New seller debt ID |

**Response:** `200 OK`

```json
{
  "new_seller_debt": {...},
  "total_paid": "2000000.00",
  "remaining": "1000000.00",
  "payments": [...]
}
```

---

## Sale Payment Endpoints

### 12. Create Direct Sale Payment

Make a direct payment to a specific sale.

**Endpoint:** `POST /api/payments/sale-payments/direct-payment/`

**Permissions:** IsAuthenticated

**Request Body:**

```json
{
  "sale_id": 1,
  "amount": "500000.00",
  "currency": "UZS",
  "method": "CASH"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sale_id` | integer | Yes | Sale ID |
| `amount` | decimal | Yes | Payment amount (must be > 0.01) |
| `currency` | string | Yes | Currency: 'UZS' or 'USD' |
| `method` | string | Yes | Payment method: 'CASH', 'CARD', 'BANK_ACCOUNT', 'TRANSFER' |

**Response:** `201 Created`

```json
{
  "message": "To'lov muvaffaqiyatli amalga oshirildi."
}
```

**Notes:**
- Payment method is required for sales
- Uses sale's exchange rate for conversion
- Prevents overpayment
- Updates sale status automatically

**Error Responses:**

- `400 Bad Request`: Sale not found
  ```json
  {
    "sale_id": ["Sotuv topilmadi."]
  }
  ```

- `400 Bad Request`: Overpayment
  ```json
  {
    "non_field_errors": ["Sotuvda to'lov talab qilinadigan miqdordan oshib ketdi. Qolgan: 300000.00 so'm"]
  }
  ```

---

### 13. Create Bulk Sale Payment

Distribute a payment across multiple sales for a client using FIFO strategy.

**Endpoint:** `POST /api/payments/sale-payments/bulk-payment/`

**Permissions:** IsAuthenticated

**Request Body:**

```json
{
  "client_id": 1,
  "total_amount": "2000000.00",
  "currency": "UZS",
  "method": "CASH",
  "distribution_strategy": "oldest"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `client_id` | integer | Yes | Client ID |
| `total_amount` | decimal | Yes | Total payment amount (must be > 0.01) |
| `currency` | string | Yes | Currency: 'UZS' or 'USD' |
| `method` | string | Yes | Payment method |
| `distribution_strategy` | string | No | Distribution strategy (default: 'oldest') |

**Response:** `201 Created`

```json
{
  "message": "Ommaviy to'lov muvaffaqiyatli amalga oshirildi.",
  "total_amount": "2000000.00",
  "total_distributed": "2000000.00",
  "payments_created": 3
}
```

**Distribution Strategies:**
- `oldest`: FIFO - Oldest sales first (default)
- `newest`: LIFO - Newest sales first
- `least_amount`: Smallest debts first
- `largest_amount`: Largest debts first

**Notes:**
- Distributes across sales with status PENDING or PARTIALLY_PAID
- Uses first sale's exchange rate for conversion
- Updates each sale's status
- Prevents overpayment

**Error Responses:**

- `400 Bad Request`: Client not found
  ```json
  {
    "client_id": ["Mijoz topilmadi."]
  }
  ```

- `400 Bad Request`: No unpaid sales
  ```json
  {
    "non_field_errors": ["Mijozda to'lanmagan sotuvlar topilmadi."]
  }
  ```

- `400 Bad Request`: Overpayment
  ```json
  {
    "non_field_errors": ["To'lov miqdori jami qarzdan oshib ketdi. Jami qarz: 1500000.00 so'm"]
  }
  ```

---

## Data Models

### OldSellerDebtPayment Model

**Database Table:** `old_seller_debt_payments`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key | Unique payment identifier |
| `old_seller_debt` | foreign key | Required, CASCADE | Reference to OldSellerDebt |
| `amount` | decimal (30,2) | Required | Payment amount |
| `currency` | string | Required | Currency code |
| `exchange_rate` | decimal (30,2) | Required | Exchange rate |
| `deleted` | boolean | Default: false | Soft delete flag |
| `seller` | foreign key | Required | User who processed payment |
| `created_at` | datetime | Auto-set | Payment timestamp |

---

### OldClientDebtPayment Model

**Database Table:** `old_client_debt_payments`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key | Unique payment identifier |
| `old_client_debt` | foreign key | Required, CASCADE | Reference to OldClientDebt |
| `amount` | decimal (30,2) | Required | Payment amount |
| `currency` | string | Required | Currency code |
| `exchange_rate` | decimal (30,2) | Required | Exchange rate |
| `deleted` | boolean | Default: false | Soft delete flag |
| `seller` | foreign key | Required | User who processed payment |
| `created_at` | datetime | Auto-set | Payment timestamp |

---

### NewSellerDebtPayment Model

**Database Table:** `new_seller_debt_payments`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key | Unique payment identifier |
| `new_seller_debt` | foreign key | Required, CASCADE | Reference to NewSellerDebt |
| `amount` | decimal (30,2) | Required | Payment amount |
| `currency` | string | Required | Currency code |
| `exchange_rate` | decimal (30,2) | Required | Exchange rate |
| `method` | string (50) | Optional | Payment method |
| `deleted` | boolean | Default: false | Soft delete flag |
| `seller` | foreign key | Required | User who processed payment |
| `created_at` | datetime | Auto-set | Payment timestamp |

---

### SalePayment Model

**Database Table:** `sale_payments`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key | Unique payment identifier |
| `sale` | foreign key | SET_NULL | Reference to Sale |
| `amount` | decimal (30,2) | Required | Payment amount |
| `currency` | string (3) | Required | Currency code |
| `payment_method` | string (20) | Required | Payment method |
| `created_at` | datetime | Auto-set | Payment timestamp |

---

## Payment Methods

Sale payments support multiple payment methods:

| Method | Value | Description |
|--------|-------|-------------|
| **CASH** | `CASH` | Cash payment (Naqd pul) |
| **CARD** | `CARD` | Card payment (Plastik karta) |
| **BANK_ACCOUNT** | `BANK_ACCOUNT` | Bank account transfer (Bank hisob raqami) |
| **TRANSFER** | `TRANSFER` | Money transfer (Pul o'tkazmasi) |

**Notes:**
- Payment method required only for sale payments
- Debt payments don't require method specification
- Method stored for reporting and tracking

---

## Payment Distribution

### FIFO Strategy (First In, First Out)

Used in bulk payments to distribute amount across multiple debts/sales:

**Algorithm:**
1. Get all unpaid/partially paid items ordered by `created_at`
2. Calculate remaining amount for each item
3. Apply payment starting from oldest
4. Stop when total exhausted or all items paid

**Example:**

```
Total Payment: 5,000,000 UZS

Debt 1 (oldest): 3,000,000 UZS remaining → Gets 3,000,000 UZS (PAID)
Debt 2: 4,000,000 UZS remaining → Gets 2,000,000 UZS (PARTIALLY_PAID)
Debt 3 (newest): 1,000,000 UZS remaining → Gets 0 UZS (PENDING)
```

### Currency Conversion

Payments in different currencies are converted using stored exchange rates:

**Conversion Formula:**
```
amount_in_uzs = amount * exchange_rate
```

**Example:**
```
Payment: $500 USD
Debt Exchange Rate: 12,500
Converted: 6,250,000 UZS
```

---

## Error Handling

### Standard Error Responses

| Code | Meaning |
|------|---------|
| 200 | OK - Successful GET |
| 201 | Created - Payment successful |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Missing/invalid token |
| 404 | Not Found - Resource not found |

### Common Errors

**Overpayment:**
```json
{
  "non_field_errors": ["Payment amount exceeds remaining debt amount."]
}
```

**Invalid Entity:**
```json
{
  "sale_id": ["Sotuv topilmadi."]
}
```

**No Unpaid Items:**
```json
{
  "non_field_errors": ["No unpaid debts found for this supplier."]
}
```

---

## Examples

### Direct Payment to Old Seller Debt

**Request:**
```bash
curl -X POST https://api.example.com/api/payments/old-seller-debt-payments/direct-payment/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "old_seller_debt_id": 1,
    "amount": "1000000.00",
    "currency": "UZS",
    "exchange_rate": "1.0"
  }'
```

**Response:**
```json
{
  "id": 1,
  "old_seller_debt": 1,
  "amount_display": {
    "amount": "1000000.00",
    "currency": "UZS"
  },
  "exchange_rate": "1.0",
  "currency": "UZS",
  "seller": 1
}
```

---

### Bulk Payment to Supplier

**Request:**
```bash
curl -X POST https://api.example.com/api/payments/old-seller-debt-payments/bulk-payment/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_id": 1,
    "total_amount": "5000000.00",
    "currency": "UZS"
  }'
```

**Response:**
```json
{
  "total_amount": "5000000.00",
  "total_distributed": "5000000.00",
  "payments_created": 2,
  "payments": [...]
}
```

---

### Sale Payment

**Request:**
```bash
curl -X POST https://api.example.com/api/payments/sale-payments/direct-payment/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sale_id": 1,
    "amount": "500000.00",
    "currency": "UZS",
    "method": "CASH"
  }'
```

**Response:**
```json
{
  "message": "To'lov muvaffaqiyatli amalga oshirildi."
}
```

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**API Base URL:** `/api/payments/`
