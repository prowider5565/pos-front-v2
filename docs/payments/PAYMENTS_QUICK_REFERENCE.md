# Payments API Quick Reference

## Old Seller Debt Payments

### Direct Payment
```bash
POST /api/payments/old-seller-debt-payments/direct-payment/
{
  "old_seller_debt_id": 1,
  "amount": "1000000.00",
  "currency": "UZS",
  "exchange_rate": "1.0"
}
```

### Bulk Payment
```bash
POST /api/payments/old-seller-debt-payments/bulk-payment/
{
  "supplier_id": 1,
  "total_amount": "5000000.00",
  "currency": "UZS"
}
```

### Get Supplier Payments
```bash
GET /api/payments/old-seller-debt-payments/supplier-payments/?supplier_id=1
```

### Get Debt Payments
```bash
GET /api/payments/old-seller-debt-payments/debt-payments/?old_debt_id=1
```

---

## Old Client Debt Payments

### Direct Payment
```bash
POST /api/payments/old-client-debt-payments/direct-payment/
{
  "old_client_debt_id": 1,
  "amount": "500000.00",
  "currency": "UZS"
}
```

### Bulk Payment
```bash
POST /api/payments/old-client-debt-payments/bulk-payment/
{
  "client_id": 1,
  "total_amount": "2000000.00",
  "currency": "UZS"
}
```

### Get Client Payments
```bash
GET /api/payments/old-client-debt-payments/client-payments/?client_id=1
```

### Get Debt Payments
```bash
GET /api/payments/old-client-debt-payments/debt-payments/?old_debt_id=1
```

---

## New Seller Debt Payments

### Direct Payment
```bash
POST /api/payments/new-seller-debt-payments/direct-payment/
{
  "new_seller_debt_id": 1,
  "amount": "1000000.00",
  "currency": "UZS"
}
```

### Bulk Payment
```bash
POST /api/payments/new-seller-debt-payments/bulk-payment/
{
  "supplier_id": 1,
  "total_amount": "3000000.00",
  "currency": "UZS"
}
```

### Get Debt Payments
```bash
GET /api/payments/new-seller-debt-payments/debt-payments/?new_seller_debt_id=1
```

---

## Sale Payments

### Direct Payment
```bash
POST /api/payments/sale-payments/direct-payment/
{
  "sale_id": 1,
  "amount": "500000.00",
  "currency": "UZS",
  "method": "CASH"
}
```

### Bulk Payment
```bash
POST /api/payments/sale-payments/bulk-payment/
{
  "client_id": 1,
  "total_amount": "2000000.00",
  "currency": "UZS",
  "method": "CASH",
  "distribution_strategy": "oldest"
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

## Distribution Strategies

| Strategy | Description |
|----------|-------------|
| `oldest` | FIFO - Oldest first (default) |
| `newest` | LIFO - Newest first |
| `least_amount` | Smallest debts first |
| `largest_amount` | Largest debts first |

---

## Currency Codes

| Code | Name |
|------|------|
| `UZS` | Uzbekistan Sum |
| `USD` | US Dollar |

---

## Response Structures

### Direct Payment Response
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

### Bulk Payment Response
```json
{
  "total_amount": "5000000.00",
  "total_distributed": "5000000.00",
  "payments_created": 3,
  "payments": [...]
}
```

### Sale Payment Response
```json
{
  "message": "To'lov muvaffaqiyatli amalga oshirildi."
}
```

---

## Common Errors

```json
// Overpayment
{
  "non_field_errors": ["Payment amount exceeds remaining debt amount."]
}

// Entity not found
{
  "sale_id": ["Sotuv topilmadi."]
}

// No unpaid items
{
  "non_field_errors": ["No unpaid debts found for this supplier."]
}
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

## Key Features

✅ Direct payments to specific debts/sales  
✅ Bulk payment distribution (FIFO)  
✅ Automatic status updates  
✅ Overpayment prevention  
✅ Multi-currency support  
✅ Payment history tracking  

---

**Quick Reference Version:** 1.0  
**Last Updated:** 2024
