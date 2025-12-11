# Products API Quick Reference

## Product Endpoints

### List Products by Supplier
```bash
GET /api/products/suppliers/{supplier_id}/products/?page=1
→ Returns: paginated product list with supplier metadata
```

### List Products for Sale
```bash
GET /api/products/products/for-sale/?page=1
→ Returns: lightweight product list for sales
```

### Create Product
```bash
POST /api/products/products/create/
{
  "name": "Premium Rice",
  "product_type": "KG",
  "supplier": 1,
  "batch": { "quantity": 100, "buy_price": "15000.00", "sell_price": "18000.00" },
  "finance": { "currency": "UZS", "exchange_rate": "1.0" }
}
```

### Get Product
```bash
GET /api/products/products/{id}/
```

### Update Product
```bash
PATCH /api/products/products/{id}/update/
{ "name": "Updated Name", "sell_price": "19000.00" }
```

### Delete Product
```bash
DELETE /api/products/products/{id}/delete/
→ Returns: 204 No Content
```

---

## Batch Endpoints

### List Batches
```bash
GET /api/products/products/{product_id}/batches/?page=1
```

### Create Batch
```bash
POST /api/products/products/{product_id}/batches/create/
{
  "quantity": 100,
  "buy_price": "15000.00",
  "sell_price": "18000.00",
  "finance": { "currency": "UZS", "exchange_rate": "1.0" }
}
```

### Get Batch
```bash
GET /api/products/batches/{id}/
```

### Update Batch
```bash
PATCH /api/products/batches/{id}/update/
{ "sell_price": "19000.00" }
```

### Delete Batch
```bash
DELETE /api/products/batches/{id}/delete/
```

---

## Category Endpoints

### List Categories
```bash
GET /api/products/categories/?page=1
```

### Create Category
```bash
POST /api/products/categories/create/
{ "name": "Grains" }
```

### Update Category
```bash
PATCH /api/products/categories/{id}/update/
{ "name": "Updated Name" }
```

---

## Product Types

| Type | Value |
|------|-------|
| Kilogram | `KG` |
| Piece | `PIECE` |
| Liter | `LITER` |

---

## Data Structures

### Product Object
```json
{
  "id": 1,
  "name": "Premium Rice",
  "description": "...",
  "product_type": "KG",
  "category": 1,
  "supplier": 1,
  "images": [...],
  "batches": [...],
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Batch Object
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

### Category Object
```json
{
  "id": 1,
  "name": "Grains",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## Permission Levels

| Operation | Permission |
|-----------|------------|
| Read | IsAuthenticated |
| Create/Update/Delete | IsAuthenticated + IsAdminUser |

---

## Key Features

✅ CRUD for products, batches, categories  
✅ Automatic debt creation on batch import  
✅ Image management (pre-upload or direct)  
✅ Soft delete for data retention  
✅ Multi-supplier support  
✅ Product type tracking (KG/PIECE/LITER)  

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |

---

**Quick Reference Version:** 1.0
