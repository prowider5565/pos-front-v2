# Sales API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [Sale Endpoints](#sale-endpoints)
5. [Data Models](#data-models)
6. [Sale Status](#sale-status)
7. [FIFO Inventory Management](#fifo-inventory-management)
8. [Error Handling](#error-handling)
9. [Examples](#examples)

---

## Overview

The Sales API manages sales transactions with inventory deduction, payment processing, and client debt tracking.

**Key Features:**
- Complete sales transaction management
- FIFO (First In, First Out) inventory deduction
- Multi-product sales support
- Optional payment at time of sale
- Client debt tracking
- Automatic status updates
- Discount support
- Notes and cheque requirements

**Base URL:** `/api/sales/`

**Authentication:** All endpoints require JWT Bearer token authentication.

---

## Base URL

```
/api/sales/
```

All sale endpoints are prefixed with this base URL.

---

## Authentication

All endpoints require JWT authentication:

```
Authorization: Bearer <access_token>
```

**Permission Level:** IsAuthenticated

---

## Sale Endpoints

### 1. Create Sale

Create a new sale transaction with items and optional payments.

**Endpoint:** `POST /api/sales/create/`

**Permissions:** IsAuthenticated

**Request Body:**

```json
{
  "client_id": 1,
  "exchange_rate": "12500.00",
  "discount_amount": "50000.00",
  "needs_cheque": false,
  "notes": "Urgent delivery",
  "items": [
    {
      "product_id": 1,
      "quantity": 10
    },
    {
      "product_id": 2,
      "quantity": 5
    }
  ],
  "payments": [
    {
      "method": "CASH",
      "currency": "UZS",
      "amount": "500000.00"
    }
  ]
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `client_id` | integer | Yes | Client ID |
| `exchange_rate` | decimal | Yes | Exchange rate (UZS per USD) |
| `discount_amount` | decimal | No | Discount amount (default: 0) |
| `needs_cheque` | boolean | No | Requires cheque? (default: false) |
| `notes` | string | No | Additional notes |
| `items` | array | Yes | Array of sale items (at least 1) |
| `payments` | array | No | Array of payments (optional) |

**Item Object Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_id` | integer | Yes | Product ID |
| `quantity` | integer | Yes | Quantity (must be >= 1) |

**Payment Object Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `method` | string | Yes | Payment method: CASH, CARD, BANK_ACCOUNT, TRANSFER |
| `currency` | string | Yes | Currency: UZS or USD |
| `amount` | decimal | Yes | Payment amount (must be >= 0.01) |

**Response:** `201 Created`

```json
{
  "id": 1,
  "client": {
    "id": 1,
    "full_name": "Sardor Rahimov"
  },
  "user": {
    "id": 1,
    "username": "admin"
  },
  "total_amount": "1800000.00",
  "discount_amount": "50000.00",
  "status": "PARTIALLY_PAID",
  "exchange_rate": "12500.00",
  "needs_cheque": false,
  "notes": "Urgent delivery",
  "created_at": "2024-01-15T10:30:00Z",
  "items": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "name": "Premium Rice"
      },
      "qty": 10,
      "unit_price": "18000.00",
      "subtotal": "180000.00"
    }
  ],
  "payments": [
    {
      "id": 1,
      "amount": "500000.00",
      "currency": "UZS",
      "payment_method": "CASH",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Sale Creation Process:**

1. **Validate Client**: Check client exists and not deleted
2. **Validate Products**: Check all products exist and not deleted
3. **Check Stock**: Verify sufficient stock available (FIFO)
4. **Calculate Prices**: Get sell prices from batches
5. **Calculate Total**: Sum all item subtotals
6. **Apply Discount**: Subtract discount from total
7. **Create Sale Record**: With PENDING status
8. **Create Sale Items**: Link products with quantities
9. **Deduct Inventory**: Use FIFO to deduct from batches
10. **Process Payments**: If provided, create payment records
11. **Update Status**: Set status based on payments

**Inventory Deduction (FIFO):**
- Oldest batches used first (by created_at)
- Quantities deducted from batches
- Multiple batches used if needed
- Batch quantity updated after deduction

**Status Calculation:**
- **PENDING**: No payments made
- **PARTIALLY_PAID**: Some payment made, balance remaining
- **PAID**: Fully paid

**Validation Rules:**
- At least one item required
- All products must exist with sufficient stock
- Payment amount cannot exceed total (after discount)
- Discount cannot be negative
- Client must exist and not be deleted

**Error Responses:**

- `400 Bad Request`: Missing client
  ```json
  {
    "client_id": ["Mijoz topilmadi."]
  }
  ```

- `400 Bad Request`: No items
  ```json
  {
    "items": ["Kamida bitta mahsulot kiritilishi kerak."]
  }
  ```

- `400 Bad Request`: Insufficient stock
  ```json
  {
    "items": ["Omborda yetarli Premium Rice mavjud emas. Qolgan miqdor: 50"]
  }
  ```

- `400 Bad Request`: Overpayment
  ```json
  {
    "non_field_errors": ["Sotuvda to'lov talab qilinadigan miqdordan oshib ketdi. Qolgan: 300000.00 so'm"]
  }
  ```

---

### 2. List Sales

Retrieve paginated list of all sales.

**Endpoint:** `GET /api/sales/list/`

**Permissions:** IsAuthenticated

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `page_size` | integer | No | Items per page (default: 20, max: 100) |

**Response:** `200 OK`

```json
{
  "count": 50,
  "next": "http://api.example.com/api/sales/list/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "sale_date": "2024-01-15T10:30:00Z",
      "status": "PAID",
      "client_full_name": "Sardor Rahimov",
      "number_of_products": 2,
      "debt_amounts": {
        "total_amount": {
          "amount": "1750000.00",
          "currency": "UZS"
        },
        "paid_amount": {
          "amount": "1750000.00",
          "currency": "UZS"
        },
        "remaining_amount": {
          "amount": "0.00",
          "currency": "UZS"
        }
      }
    }
  ]
}
```

**Notes:**
- Ordered by creation date (newest first)
- Default 20 items per page
- Includes computed debt amounts
- Lightweight serializer for list view

---

### 3. Get Sale Details

Retrieve detailed information about a specific sale.

**Endpoint:** `GET /api/sales/{id}/`

**Permissions:** IsAuthenticated

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Sale ID |

**Response:** `200 OK`

```json
{
  "id": 1,
  "client": {
    "id": 1,
    "full_name": "Sardor Rahimov",
    "phone_number": "+998901234567",
    "address": null
  },
  "sale_date": "2024-01-15T10:30:00Z",
  "status": "PARTIALLY_PAID",
  "exchange_rate": "12500.00",
  "needs_cheque": false,
  "notes": "Urgent delivery",
  "debt_amounts": {
    "total_amount": {
      "amount": "1750000.00",
      "currency": "UZS"
    },
    "paid_amount": {
      "amount": "500000.00",
      "currency": "UZS"
    },
    "remaining_amount": {
      "amount": "1250000.00",
      "currency": "UZS"
    }
  },
  "items": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "name": "Premium Rice",
        "product_type": "KG"
      },
      "qty": 10,
      "unit_price": "18000.00",
      "subtotal": "180000.00"
    }
  ],
  "payments": [
    {
      "id": 1,
      "amount_display": {
        "amount": "500000.00",
        "currency": "UZS"
      },
      "currency": "UZS",
      "payment_method": "CASH",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Notes:**
- Includes full client details
- Shows all sale items with product info
- Lists all payments
- Computed debt amounts in UZS

**Error Responses:**

- `404 Not Found`: Sale not found
  ```json
  {
    "detail": "Not found."
  }
  ```

---

## Data Models

### Sale Model

**Database Table:** `sales`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key | Sale ID |
| `client` | foreign key | CASCADE | Reference to Client |
| `user` | foreign key | CASCADE | User who created sale |
| `discount_amount` | decimal (30,2) | Default: 0 | Discount amount |
| `total_amount` | decimal (30,2) | Required | Total sale amount (after discount) |
| `status` | string (25) | Choices: DebtStatus | Payment status |
| `exchange_rate` | decimal (30,2) | Required | Exchange rate at sale time |
| `needs_cheque` | boolean | Default: false | Cheque required? |
| `notes` | text | Optional | Additional notes |
| `created_at` | datetime | Auto-set | Sale timestamp |

**Relationships:**
- Belongs to Client
- Belongs to User
- Has many SaleItem
- Has many SalePayment

**Ordering:** By `created_at` DESC (newest first)

---

### SaleItem Model

**Database Table:** `sale_items`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key | Item ID |
| `sale` | foreign key | CASCADE | Reference to Sale |
| `product` | foreign key | CASCADE | Reference to Product |
| `qty` | integer | Required | Quantity sold |
| `unit_price` | decimal (30,2) | Required | Price per unit at sale time |
| `subtotal` | decimal (30,2) | Required | qty * unit_price |

**Relationships:**
- Belongs to Sale
- Belongs to Product

---

### SalePayment Model

**Database Table:** `sale_payments`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key | Payment ID |
| `sale` | foreign key | SET_NULL | Reference to Sale |
| `amount` | decimal (30,2) | Required | Payment amount |
| `currency` | string (3) | Required | Currency: UZS or USD |
| `payment_method` | string (20) | Required | Payment method |
| `created_at` | datetime | Auto-set | Payment timestamp |

**Relationships:**
- Belongs to Sale (SET_NULL allows orphaned payments)

**Ordering:** By `created_at` DESC

---

## Sale Status

Sales use the same status system as debts:

| Status | Description |
|--------|-------------|
| **PENDING** | No payments made yet |
| **PARTIALLY_PAID** | Some payment made, balance remaining |
| **PAID** | Fully paid, no balance |

**Status Calculation:**

```
total_paid_uzs = SUM(payments converted to UZS using exchange_rate)

IF total_paid_uzs = 0:
    status = PENDING
ELSE IF total_paid_uzs < total_amount:
    status = PARTIALLY_PAID
ELSE IF total_paid_uzs >= total_amount:
    status = PAID
```

**Automatic Updates:**
- Status updated when sale created (based on initial payments)
- Status updated when additional payments made
- All currencies converted to UZS for calculation

---

## FIFO Inventory Management

The system uses FIFO (First In, First Out) for inventory management.

**FIFO Algorithm:**

1. **Get Available Batches**: 
   - Filter by product
   - Exclude deleted batches
   - Filter where quantity > 0
   - Order by `created_at` ASC (oldest first)

2. **Deduct Quantities**:
   - Start with oldest batch
   - Deduct as much as possible from current batch
   - Move to next batch if more needed
   - Continue until required quantity fulfilled

**Example:**

```
Product: Premium Rice
Required: 150 units

Batch 1 (Jan 1): 100 units available → Deduct 100 (batch empty)
Batch 2 (Jan 5): 200 units available → Deduct 50 (150 remaining)
Batch 3 (Jan 10): 50 units available → Not touched

Result: Batch 1 = 0, Batch 2 = 150, Batch 3 = 50
```

**Price Selection:**
- Uses `sell_price` from batch being deducted
- Each sale item may have different prices if multiple batches used
- Price locked at sale creation time

**Stock Validation:**
- Total available = SUM(all batch quantities for product)
- Validation fails if requested > available
- Prevents overselling

---

## Error Handling

### Standard Error Responses

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |

### Common Errors

**Client Not Found:**
```json
{
  "client_id": ["Mijoz topilmadi."]
}
```

**No Items:**
```json
{
  "items": ["Kamida bitta mahsulot kiritilishi kerak."]
}
```

**Insufficient Stock:**
```json
{
  "items": ["Omborda yetarli Premium Rice mavjud emas. Qolgan miqdor: 50"]
}
```

**Product Not Found:**
```json
{
  "items": ["Mahsulot(lar) topilmadi: 1, 2"]
}
```

**Overpayment:**
```json
{
  "non_field_errors": ["Sotuvda to'lov talab qilinadigan miqdordan oshib ketdi. Qolgan: 300000.00 so'm"]
}
```

---

## Examples

### Create Sale with Payment

**Request:**

```bash
curl -X POST https://api.example.com/api/sales/create/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "exchange_rate": "12500.00",
    "discount_amount": "50000.00",
    "items": [
      {"product_id": 1, "quantity": 10},
      {"product_id": 2, "quantity": 5}
    ],
    "payments": [
      {"method": "CASH", "currency": "UZS", "amount": "500000.00"}
    ]
  }'
```

**Response:**

```json
{
  "id": 1,
  "client": {"id": 1, "full_name": "Sardor Rahimov"},
  "user": {"id": 1, "username": "admin"},
  "total_amount": "1750000.00",
  "discount_amount": "50000.00",
  "status": "PARTIALLY_PAID",
  "items": [...],
  "payments": [...]
}
```

---

### Create Sale Without Payment (Credit)

**Request:**

```bash
curl -X POST https://api.example.com/api/sales/create/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "exchange_rate": "12500.00",
    "items": [
      {"product_id": 1, "quantity": 10}
    ]
  }'
```

**Response:**

```json
{
  "id": 2,
  "status": "PENDING",
  "total_amount": "180000.00",
  "payments": []
}
```

---

### List Sales

**Request:**

```bash
curl -X GET "https://api.example.com/api/sales/list/?page=1&page_size=20" \
  -H "Authorization: Bearer <token>"
```

---

### Get Sale Details

**Request:**

```bash
curl -X GET https://api.example.com/api/sales/1/ \
  -H "Authorization: Bearer <token>"
```

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**API Base URL:** `/api/sales/`
