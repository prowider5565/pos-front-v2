# Debts API Quick Reference

## Old Seller Debt Endpoints

### Create Old Seller Debt
```bash
POST /api/debts/old-seller-debts/
Authorization: Bearer <token>
{
  "supplier": 1,
  "amount": "5000000.00",
  "currency": "UZS",
  "exchange_rate": "1.0"
}
→ Returns: debt details
```

### List Old Seller Debts
```bash
GET /api/debts/old-seller-debts/?supplier_id=1&status=PENDING&currency=UZS&page=1
Authorization: Bearer <token>
→ Returns: paginated debt list with supplier metadata
```

### Get Old Seller Debt
```bash
GET /api/debts/old-seller-debts/{id}/
Authorization: Bearer <token>
→ Returns: debt details
```

---

## Old Client Debt Endpoints

### Create Old Client Debt
```bash
POST /api/debts/old-client-debts/
Authorization: Bearer <token>
{
  "client": 1,
  "amount": "3000000.00",
  "currency": "UZS",
  "exchange_rate": "1.0"
}
→ Returns: debt details
```

### List Old Client Debts
```bash
GET /api/debts/old-client-debts/?client_id=1&status=PENDING&currency=UZS&page=1
Authorization: Bearer <token>
→ Returns: paginated debt list with client metadata
```

### Get Old Client Debt
```bash
GET /api/debts/old-client-debts/{id}/
Authorization: Bearer <token>
→ Returns: debt details
```

---

## Data Structures

### Old Seller Debt Object
```json
{
  "id": 1,
  "supplier": 1,
  "amount": "5000000.00",
  "exchange_rate": "1.0",
  "currency": "UZS"
}
```

### Old Client Debt Object
```json
{
  "id": 1,
  "client": 1,
  "amount": "3000000.00",
  "exchange_rate": "1.0",
  "currency": "UZS"
}
```

### Debt List Item
```json
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
```

### Pagination Response
```json
{
  "count": 10,
  "current_page": 1,
  "next": "url",
  "previous": null,
  "total_pages": 1,
  "supplier": { ... },
  "results": [...]
}
```

---

## Debt Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | No payments made |
| `PARTIALLY_PAID` | Some payments made |
| `PAID` | Fully paid |

---

## Currency Codes

| Code | Name |
|------|------|
| `UZS` | Uzbekistan Sum |
| `USD` | US Dollar |

---

## Query Parameters

| Parameter | Type | Used In | Description |
|-----------|------|---------|-------------|
| `supplier_id` | integer | Seller debt list | Filter by supplier (required) |
| `client_id` | integer | Client debt list | Filter by client (required) |
| `status` | string | All lists | Filter by status |
| `currency` | string | All lists | Filter by currency |
| `page` | integer | All lists | Page number |

---

## Field Constraints

### Amount
- Type: decimal(10,2)
- Required: Yes
- Must be > 0

### Exchange Rate
- Type: decimal(30,2)
- Default: 1.0
- Must be > 0

### Currency
- Type: string
- Required: Yes
- Choices: 'UZS', 'USD'

---

## Permission Levels

| Endpoint | Permission |
|----------|------------|
| Create debt | IsAuthenticated + IsSuperUser |
| List debts | IsAuthenticated + IsSuperUser |
| Get debt | IsAuthenticated + IsSuperUser |

---

## Common Errors

```json
// Missing required parameter
{ "error": "Supplier ID is required" }

// Invalid entity
{ "supplier": ["Cannot create debt for a deleted supplier."] }

// Invalid amount
{ "amount": ["Amount must be greater than zero."] }

// Not found
{ "detail": "Not found." }
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |

---

## Related APIs

- **Payments API**: Make payments against debts
- **Users API**: Manage suppliers and clients
- **Products API**: New seller debt creation

---

**Quick Reference Version:** 1.0  
**Last Updated:** 2024
