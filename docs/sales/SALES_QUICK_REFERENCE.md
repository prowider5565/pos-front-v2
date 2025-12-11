# Sales API Quick Reference

## Sale Endpoints

### Create Sale
```bash
POST /api/sales/create/
{
  "client_id": 1,
  "exchange_rate": "12500.00",
  "discount_amount": "50000.00",
  "items": [
    {"product_id": 1, "quantity": 10}
  ],
  "payments": [
    {"method": "CASH", "currency": "UZS", "amount": "500000.00"}
  ]
}
→ Returns: sale details with items and payments
```

### List Sales
```bash
GET /api/sales/list/?page=1&page_size=20
→ Returns: paginated sale list (20 per page, max 100)
```

### Get Sale Details
```bash
GET /api/sales/{id}/
→ Returns: full sale details with client, items, payments
```

---

## Request Structures

### Sale Creation
```json
{
  "client_id": 1,
  "exchange_rate": "12500.00",
  "discount_amount": "50000.00",
  "needs_cheque": false,
  "notes": "Urgent delivery",
  "items": [...],
  "payments": [...]
}
```

### Sale Item
```json
{
  "product_id": 1,
  "quantity": 10
}
```

### Payment
```json
{
  "method": "CASH",
  "currency": "UZS",
  "amount": "500000.00"
}
```

---

## Response Structures

### Sale Object
```json
{
  "id": 1,
  "client": {"id": 1, "full_name": "..."},
  "user": {"id": 1, "username": "..."},
  "total_amount": "1750000.00",
  "discount_amount": "50000.00",
  "status": "PARTIALLY_PAID",
  "exchange_rate": "12500.00",
  "needs_cheque": false,
  "notes": "...",
  "created_at": "2024-01-15T10:30:00Z",
  "items": [...],
  "payments": [...]
}
```

### Sale List Item
```json
{
  "id": 1,
  "sale_date": "2024-01-15T10:30:00Z",
  "status": "PAID",
  "client_full_name": "Sardor Rahimov",
  "number_of_products": 2,
  "debt_amounts": {...}
}
```

---

## Payment Methods

| Method | Value |
|--------|-------|
| Cash | `CASH` |
| Card | `CARD` |
| Bank Account | `BANK_ACCOUNT` |
| Transfer | `TRANSFER` |

---

## Sale Status

| Status | Description |
|--------|-------------|
| `PENDING` | No payments made |
| `PARTIALLY_PAID` | Some payment made |
| `PAID` | Fully paid |

---

## FIFO Inventory

✅ Oldest batches used first  
✅ Automatic quantity deduction  
✅ Multi-batch support  
✅ Stock validation before sale  

---

## Key Features

✅ Multi-product sales  
✅ Optional payments at sale time  
✅ FIFO inventory management  
✅ Client debt tracking  
✅ Discount support  
✅ Automatic status updates  

---

## Common Errors

```json
// Client not found
{"client_id": ["Mijoz topilmadi."]}

// No items
{"items": ["Kamida bitta mahsulot kiritilishi kerak."]}

// Insufficient stock
{"items": ["Omborda yetarli Premium Rice mavjud emas. Qolgan miqdor: 50"]}

// Overpayment
{"non_field_errors": ["Sotuvda to'lov talab qilinadigan miqdordan oshib ketdi."]}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |

---

**Quick Reference Version:** 1.0
