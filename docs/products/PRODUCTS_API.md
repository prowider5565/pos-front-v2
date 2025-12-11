# Products API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [Product Endpoints](#product-endpoints)
5. [Product Batch Endpoints](#product-batch-endpoints)
6. [Category Endpoints](#category-endpoints)
7. [Data Models](#data-models)
8. [Product Types](#product-types)
9. [Error Handling](#error-handling)
10. [Examples](#examples)

---

## Overview

The Products API manages the product catalog, inventory batches, and product categories. It supports:

- **Products**: Product management with images and supplier tracking
- **Batches**: Inventory batch tracking with buy/sell prices and automatic debt creation
- **Categories**: Product categorization

**Key Features:**
- CRUD operations for products, batches, and categories
- Product image management (upload before or after product creation)
- Automatic new seller debt creation on batch import
- Multi-supplier product support
- Soft delete for data retention
- Pagination support
- Product type tracking (KG, PIECE, LITER)

**Base URL:** `/api/products/`

**Authentication:** All endpoints require JWT Bearer token authentication.

---

## Base URL

```
/api/products/
```

All product endpoints are prefixed with this base URL.

---

## Authentication

All endpoints require JWT authentication:

```
Authorization: Bearer <access_token>
```

**Permission Levels:**
- **Read operations**: IsAuthenticated
- **Write operations**: IsAuthenticated + IsAdminUser

---

## Product Endpoints

### 1. List Products by Supplier

Retrieve all products for a specific supplier.

**Endpoint:** `GET /api/products/suppliers/{supplier_id}/products/`

**Permissions:** IsAuthenticated

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
  "count": 25,
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
      "name": "Premium Rice",
      "description": "High quality basmati rice",
      "product_type": "KG",
      "category": {
        "id": 1,
        "name": "Grains"
      },
      "supplier": {
        "id": 1,
        "full_name": "Ali Valiyev",
        "company_name": "ABC Supply Co.",
        "phone_number": "+998901234567"
      },
      "images": [
        {
          "id": 1,
          "url": "/media/products/1/image1.jpg",
          "is_main": true
        }
      ],
      "batches": [
        {
          "id": 1,
          "quantity": 100,
          "buy_price": "15000.00",
          "sell_price": "18000.00"
        }
      ],
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Notes:**
- Returns only non-deleted products
- Includes supplier metadata
- Returns 32 products per page
- Includes product images and batches

**Error Responses:**

- `404 Not Found`: Supplier not found
  ```json
  {
    "error": "Supplier not found"
  }
  ```

---

### 2. List Products for Sale

Retrieve lightweight product list optimized for sales interface.

**Endpoint:** `GET /api/products/products/for-sale/`

**Permissions:** IsAuthenticated

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |

**Response:** `200 OK`

```json
{
  "count": 50,
  "current_page": 1,
  "next": "url",
  "previous": null,
  "total_pages": 2,
  "results": [
    {
      "id": 1,
      "name": "Premium Rice",
      "product_type": "KG",
      "available_quantity": 100,
      "sell_price": "18000.00"
    }
  ]
}
```

**Notes:**
- Lightweight serializer for performance
- Only shows products with available stock
- Aggregates quantity across all batches

---

### 3. Create Product

Create a new product with optional images and batch.

**Endpoint:** `POST /api/products/products/create/`

**Permissions:** IsAuthenticated, IsAdminUser

**Request Body:**

```json
{
  "name": "Premium Rice",
  "description": "High quality basmati rice",
  "product_type": "KG",
  "category": 1,
  "supplier": 1,
  "images": [
    {
      "url": "/media/products/uuid/image1.jpg",
      "is_main": true
    }
  ],
  "batch": {
    "quantity": 100,
    "buy_price": "15000.00",
    "sell_price": "18000.00"
  },
  "finance": {
    "currency": "UZS",
    "exchange_rate": "1.0"
  },
  "product_uuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Product name (max 255 chars) |
| `description` | string | No | Product description (max 10000 chars) |
| `product_type` | string | Yes | Product unit: 'KG', 'PIECE', 'LITER' |
| `category` | integer | No | Category ID |
| `supplier` | integer | Yes | Supplier ID |
| `images` | array | No | Array of image objects |
| `batch` | object | No | Initial batch data |
| `finance` | object | No | Finance data (required if batch provided) |
| `product_uuid` | UUID | No | UUID from pre-uploaded images |

**Batch Object Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quantity` | integer | Yes | Quantity (must be > 0) |
| `buy_price` | decimal | Yes | Buy price (must be > 0) |
| `sell_price` | decimal | Yes | Sell price (must be > 0) |

**Finance Object Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `currency` | string | Yes | Currency: 'UZS' or 'USD' |
| `exchange_rate` | decimal | No | Exchange rate (default: 1.0) |

**Response:** `201 Created`

```json
{
  "id": 1,
  "name": "Premium Rice",
  "description": "High quality basmati rice",
  "product_type": "KG",
  "category": 1,
  "supplier": 1,
  "images": [
    {
      "id": 1,
      "url": "/media/products/1/image1.jpg",
      "is_main": true
    }
  ],
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Image Upload Workflow:**

**Option 1: Pre-upload images (recommended)**
1. Upload images via `/api/media/upload/` → Get `product_uuid`
2. Create product with `product_uuid` → Images migrated to product directory

**Option 2: Include images directly**
1. Create product with `images` array → Images created with product

**Notes:**
- If batch provided, finance data required
- Creates NewSellerDebt automatically when batch provided
- Images migrated from UUID directory to product ID directory
- Batch creation is transactional

**Error Responses:**

- `400 Bad Request`: Validation error
  ```json
  {
    "name": ["This field is required."]
  }
  ```

---

### 4. Get Product Details

Retrieve detailed information about a specific product.

**Endpoint:** `GET /api/products/products/{id}/`

**Permissions:** IsAuthenticated

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Product ID |

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Premium Rice",
  "description": "High quality basmati rice",
  "product_type": "KG",
  "category": 1,
  "supplier": 1,
  "images": [
    {
      "id": 1,
      "url": "/media/products/1/image1.jpg",
      "is_main": true
    }
  ],
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

- `404 Not Found`: Product not found
  ```json
  {
    "error": "Product not found"
  }
  ```

---

### 5. Update Product

Update product information.

**Endpoint:** `PATCH /api/products/products/{id}/update/`

**Permissions:** IsAuthenticated, IsAdminUser

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Product ID |

**Request Body:** (All fields optional for partial update)

```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "product_type": "PIECE",
  "category": 2
}
```

**Updatable Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Product name |
| `description` | string | Product description |
| `product_type` | string | Product unit type |
| `category` | integer | Category ID |

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Updated Product Name",
  "description": "Updated description",
  "product_type": "PIECE",
  "category": 2,
  "supplier": 1,
  "images": [...],
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Notes:**
- Supplier cannot be changed after creation
- Supports partial updates (PATCH)
- Cannot update images via this endpoint (use media API)

---

### 6. Delete Product

Soft delete a product.

**Endpoint:** `DELETE /api/products/products/{id}/delete/`

**Permissions:** IsAuthenticated, IsAdminUser

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Product ID |

**Response:** `204 No Content`

**Notes:**
- Performs soft delete (sets `deleted=true`)
- Product data retained in database
- Associated batches not affected

**Error Responses:**

- `404 Not Found`: Product not found
  ```json
  {
    "error": "Product not found"
  }
  ```

---

## Product Batch Endpoints

### 7. List Batches for Product

Retrieve all batches for a specific product.

**Endpoint:** `GET /api/products/products/{product_id}/batches/`

**Permissions:** IsAuthenticated

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `product_id` | integer | Yes | Product ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |

**Response:** `200 OK`

```json
{
  "count": 5,
  "current_page": 1,
  "next": null,
  "previous": null,
  "total_pages": 1,
  "results": [
    {
      "id": 1,
      "product": 1,
      "quantity": 100,
      "buy_price": "15000.00",
      "sell_price": "18000.00",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "product": 1,
      "quantity": 50,
      "buy_price": "15500.00",
      "sell_price": "19000.00",
      "created_at": "2024-01-20T14:00:00Z"
    }
  ]
}
```

**Notes:**
- Returns only non-deleted batches
- Ordered by creation date
- Returns 32 batches per page

---

### 8. Create Batch

Create a new batch for a product with automatic debt creation.

**Endpoint:** `POST /api/products/products/{product_id}/batches/create/`

**Permissions:** IsAuthenticated, IsAdminUser

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `product_id` | integer | Yes | Product ID |

**Request Body:**

```json
{
  "quantity": 100,
  "buy_price": "15000.00",
  "sell_price": "18000.00",
  "finance": {
    "currency": "UZS",
    "exchange_rate": "1.0"
  }
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quantity` | integer | Yes | Quantity (must be > 0) |
| `buy_price` | decimal | Yes | Buy price per unit (must be > 0) |
| `sell_price` | decimal | Yes | Sell price per unit (must be > 0) |
| `finance` | object | Yes | Finance data for debt creation |

**Response:** `201 Created`

```json
{
  "id": 1,
  "product": 1,
  "quantity": 100,
  "buy_price": "15000.00",
  "sell_price": "18000.00",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Automatic Debt Creation:**
- Creates NewSellerDebt automatically
- Debt amount = `quantity * buy_price`
- Links debt to batch and supplier
- Uses provided exchange rate

**Error Responses:**

- `404 Not Found`: Product not found
  ```json
  {
    "error": "Product not found"
  }
  ```

---

### 9. Get Batch Details

Retrieve details of a specific batch.

**Endpoint:** `GET /api/products/batches/{id}/`

**Permissions:** IsAuthenticated

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Batch ID |

**Response:** `200 OK`

```json
{
  "id": 1,
  "product": 1,
  "quantity": 100,
  "buy_price": "15000.00",
  "sell_price": "18000.00",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 10. Update Batch

Update batch information (only sell_price allowed).

**Endpoint:** `PATCH /api/products/batches/{id}/update/`

**Permissions:** IsAuthenticated, IsAdminUser

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Batch ID |

**Request Body:**

```json
{
  "sell_price": "19000.00"
}
```

**Updatable Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `sell_price` | decimal | Sell price per unit |

**Response:** `200 OK`

```json
{
  "id": 1,
  "product": 1,
  "quantity": 100,
  "buy_price": "15000.00",
  "sell_price": "19000.00",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Notes:**
- Only `sell_price` can be updated
- Cannot update `quantity` or `buy_price` (financial integrity)
- Cannot update if batch has sales

---

### 11. Delete Batch

Soft delete a batch.

**Endpoint:** `DELETE /api/products/batches/{id}/delete/`

**Permissions:** IsAuthenticated, IsAdminUser

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Batch ID |

**Response:** `204 No Content`

**Notes:**
- Performs soft delete
- Associated debt not deleted
- Cannot delete if batch has sales

---

## Category Endpoints

### 12. List Categories

Retrieve all product categories.

**Endpoint:** `GET /api/products/categories/`

**Permissions:** IsAuthenticated

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |

**Response:** `200 OK`

```json
{
  "count": 10,
  "current_page": 1,
  "next": null,
  "previous": null,
  "total_pages": 1,
  "results": [
    {
      "id": 1,
      "name": "Grains",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "Beverages",
      "created_at": "2024-01-02T00:00:00Z"
    }
  ]
}
```

**Notes:**
- Returns all categories (no soft delete)
- Returns 32 categories per page

---

### 13. Create Category

Create a new product category.

**Endpoint:** `POST /api/products/categories/create/`

**Permissions:** IsAuthenticated, IsAdminUser

**Request Body:**

```json
{
  "name": "Grains"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Category name (max 255 chars, unique) |

**Response:** `201 Created`

```json
{
  "id": 1,
  "name": "Grains",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request`: Duplicate name
  ```json
  {
    "name": ["Category with this name already exists."]
  }
  ```

---

### 14. Update Category

Update a category name.

**Endpoint:** `PATCH /api/products/categories/{id}/update/`

**Permissions:** IsAuthenticated, IsAdminUser

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Category ID |

**Request Body:**

```json
{
  "name": "Updated Category Name"
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Updated Category Name",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## Data Models

### Product Model

**Database Table:** `products`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key | Product ID |
| `name` | string (255) | Required | Product name |
| `description` | text (10000) | Optional | Product description |
| `product_type` | string (20) | Required | Unit type: KG, PIECE, LITER |
| `category` | foreign key | SET_NULL | Reference to Category |
| `supplier` | foreign key | CASCADE | Reference to Supplier |
| `deleted` | boolean | Default: false | Soft delete flag |
| `created_at` | datetime | Auto-set | Creation timestamp |

---

### ProductBatch Model

**Database Table:** `product_batches`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key | Batch ID |
| `product` | foreign key | CASCADE | Reference to Product |
| `quantity` | integer | Required, >= 0 | Available quantity |
| `buy_price` | decimal (30,2) | Required | Buy price per unit |
| `sell_price` | decimal (30,2) | Required | Sell price per unit |
| `deleted` | boolean | Default: false | Soft delete flag |
| `created_at` | datetime | Auto-set | Creation timestamp |

**Relationships:**
- Has one `NewSellerDebt` (one-to-one via seller_debt)

---

### Category Model

**Database Table:** `categories`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key | Category ID |
| `name` | string (255) | Required, Unique | Category name |
| `created_at` | datetime | Auto-set | Creation timestamp |

---

## Product Types

Product units supported by the system:

| Type | Value | Description |
|------|-------|-------------|
| **KG** | `KG` | Kilogram (weight-based) |
| **PIECE** | `PIECE` | Piece/Unit (count-based) |
| **LITER** | `LITER` | Liter (volume-based) |

**Usage:**
- Determines how product is measured
- Used in sales for quantity calculation
- Cannot be changed after product has sales

---

## Error Handling

### Standard Error Responses

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content (delete successful) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |

### Common Errors

**Validation Error:**
```json
{
  "name": ["This field is required."]
}
```

**Not Found:**
```json
{
  "error": "Product not found"
}
```

**Duplicate Category:**
```json
{
  "name": ["Category with this name already exists."]
}
```

---

## Examples

### Create Product with Batch

**Request:**
```bash
curl -X POST https://api.example.com/api/products/products/create/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Rice",
    "description": "High quality basmati rice",
    "product_type": "KG",
    "category": 1,
    "supplier": 1,
    "batch": {
      "quantity": 100,
      "buy_price": "15000.00",
      "sell_price": "18000.00"
    },
    "finance": {
      "currency": "UZS",
      "exchange_rate": "1.0"
    }
  }'
```

---

### List Products for Supplier

**Request:**
```bash
curl -X GET https://api.example.com/api/products/suppliers/1/products/ \
  -H "Authorization: Bearer <token>"
```

---

### Update Product

**Request:**
```bash
curl -X PATCH https://api.example.com/api/products/products/1/update/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Basmati Rice",
    "sell_price": "19000.00"
  }'
```

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**API Base URL:** `/api/products/`
