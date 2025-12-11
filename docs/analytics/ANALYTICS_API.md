# Analytics API Documentation

## Overview
The Analytics API provides comprehensive dashboard data for monitoring business metrics including inventory, debts, income, users, and transactions. All analytics data is aggregated in real-time from the database.

---

## Base URL
```
/analytics/
```

---

## Endpoints

### 1. Get Analytics Dashboard
**GET** `/analytics/dashboard/`

Retrieves comprehensive analytics data for the dashboard, including inventory statistics, debt totals, income calculations, user counts, and transaction metrics.

#### Authentication
- **Required**: Yes
- **Type**: Bearer Token

#### Request Parameters

##### Query Parameters (Required)
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `exchange_rate` | number | Yes | Current USD to UZS exchange rate | `12500` |

#### Example Request
```bash
GET /analytics/dashboard/?exchange_rate=12500
Authorization: Bearer <your-token>
```

```bash
curl -X GET "https://api.example.com/analytics/dashboard/?exchange_rate=12500" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Success Response (200 OK)

```json
{
  "inventory": {
    "total_products": 150,
    "total_asset_value": 2500000.00,
    "categories_count": 12
  },
  "debts": {
    "client_debt": {
      "usd": 5000.00,
      "uzs": 62500000.00
    },
    "supplier_debt": {
      "usd": 3000.00,
      "uzs": 37500000.00
    }
  },
  "income": {
    "raw_income_today": {
      "usd": 800.00,
      "uzs": 10000000.00
    }
  },
  "users": {
    "total_users": 25,
    "suppliers_count": 10,
    "clients_count": 15
  },
  "transactions": {
    "today_count": 42
  }
}
```

#### Response Fields

##### Inventory Object
| Field | Type | Description |
|-------|------|-------------|
| `total_products` | integer | Total count of non-deleted products |
| `total_asset_value` | number | Total inventory value (sum of sell_price × quantity for all batches) |
| `categories_count` | integer | Total count of product categories |

##### Debts Object
Contains `client_debt` and `supplier_debt` objects, each with:

| Field | Type | Description |
|-------|------|-------------|
| `usd` | number | Total debt amount in USD (converted using exchange rate) |
| `uzs` | number | Total debt amount in UZS (converted using exchange rate) |

**Client Debt**: Money owed by clients (pending and partially paid debts)
**Supplier Debt**: Money owed to suppliers (includes old seller debts and new seller debts from batches)

##### Income Object
| Field | Type | Description |
|-------|------|-------------|
| `raw_income_today.usd` | number | Today's profit in USD (sell_price - buy_price) × quantity |
| `raw_income_today.uzs` | number | Today's profit in UZS |

##### Users Object
| Field | Type | Description |
|-------|------|-------------|
| `total_users` | integer | Total count of active users |
| `suppliers_count` | integer | Total count of non-deleted suppliers |
| `clients_count` | integer | Total count of non-deleted clients |

##### Transactions Object
| Field | Type | Description |
|-------|------|-------------|
| `today_count` | integer | Number of sales transactions made today |

#### Error Responses

##### 400 Bad Request - Missing Exchange Rate
```json
{
  "error": "exchange_rate query parameter is required"
}
```

##### 400 Bad Request - Invalid Exchange Rate
```json
{
  "error": "Invalid exchange_rate: Exchange rate must be positive"
}
```

```json
{
  "error": "Invalid exchange_rate: invalid decimal value"
}
```

##### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## Data Structure Details

### Inventory Analytics

#### Total Products Count
- **Source**: `Product` model
- **Filter**: `deleted=False`
- **Calculation**: Simple count

#### Total Asset Value
- **Source**: `ProductBatch` model
- **Filter**: `deleted=False` AND `product.deleted=False`
- **Formula**: `SUM(sell_price × quantity)`
- **Currency**: UZS (native currency in database)

#### Categories Count
- **Source**: `Category` model
- **Filter**: None (all categories)
- **Calculation**: Simple count

---

### Debt Analytics

#### Client Debt Totals
- **Source**: `OldClientDebt` model
- **Filter**: `status IN (PENDING, PARTIALLY_PAID)`
- **Currencies Handled**: 
  - USD debts: Summed directly
  - UZS debts: Summed directly
- **Conversion**:
  - `total_usd = usd_debt + (uzs_debt / exchange_rate)`
  - `total_uzs = (usd_debt × exchange_rate) + uzs_debt`

#### Supplier Debt Totals
- **Sources**: 
  - `OldSellerDebt` model (legacy debts)
  - `NewSellerDebt` model (batch-based debts)
- **Filter**: `status IN (PENDING, PARTIALLY_PAID)` AND `deleted=False` (for NewSellerDebt)
- **Currencies Handled**: Same as client debts
- **Conversion**: Same formula as client debts

---

### Income Analytics

#### Raw Income Today
- **Source**: `SaleItem` model with related `ProductBatch`
- **Filter**: `sale.created_at` is today (00:00:00 to 23:59:59)
- **Formula**: `SUM((sell_price - buy_price) × quantity_sold)` for all items sold today
- **Buy Price Source**: Latest batch's `buy_price` for each product
- **Currency**: Calculated in UZS, converted to USD
- **Conversion**: `usd = uzs / exchange_rate`

**Note**: This represents profit margin, not total revenue. It's the difference between what you sold items for and what you paid for them.

---

### User Analytics

#### Total Users Count
- **Source**: `User` model
- **Filter**: `is_active=True`
- **Calculation**: Simple count

#### Suppliers Count
- **Source**: `Supplier` model
- **Filter**: `deleted=False`
- **Calculation**: Simple count

#### Clients Count
- **Source**: `Client` model
- **Filter**: `deleted=False`
- **Calculation**: Simple count

---

### Transaction Analytics

#### Today's Transaction Count
- **Source**: `Sale` model
- **Filter**: `created_at` is today (00:00:00 to 23:59:59)
- **Calculation**: Simple count
- **Definition**: Each sale is counted as one transaction

---

## Service Layer Architecture

The analytics functionality is organized into separate service modules:

### Service Modules

| Module | File | Functions |
|--------|------|-----------|
| Inventory Analytics | `analytics/services/inventory_analytics.py` | `get_total_products_count()`<br>`get_total_asset_value()`<br>`get_categories_count()` |
| Debt Analytics | `analytics/services/debt_analytics.py` | `get_client_debt_totals(exchange_rate)`<br>`get_supplier_debt_totals(exchange_rate)` |
| Income Analytics | `analytics/services/income_analytics.py` | `calculate_raw_income_today(exchange_rate)` |
| User Analytics | `analytics/services/user_analytics.py` | `get_users_count()`<br>`get_suppliers_count()`<br>`get_clients_count()` |
| Transaction Analytics | `analytics/services/transaction_analytics.py` | `get_transactions_count_today()` |

### Service Function Signatures

```python
# Inventory Analytics
def get_total_products_count() -> int
def get_total_asset_value() -> Decimal
def get_categories_count() -> int

# Debt Analytics
def get_client_debt_totals(exchange_rate: Decimal) -> dict  # {'usd': Decimal, 'uzs': Decimal}
def get_supplier_debt_totals(exchange_rate: Decimal) -> dict  # {'usd': Decimal, 'uzs': Decimal}

# Income Analytics
def calculate_raw_income_today(exchange_rate: Decimal) -> dict  # {'usd': Decimal, 'uzs': Decimal}

# User Analytics
def get_users_count() -> int
def get_suppliers_count() -> int
def get_clients_count() -> int

# Transaction Analytics
def get_transactions_count_today() -> int
```

---

## Usage Examples

### JavaScript/Fetch
```javascript
const exchangeRate = 12500;

fetch(`https://api.example.com/analytics/dashboard/?exchange_rate=${exchangeRate}`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Total Products:', data.inventory.total_products);
  console.log('Client Debt (USD):', data.debts.client_debt.usd);
  console.log('Today\'s Income (UZS):', data.income.raw_income_today.uzs);
  console.log('Today\'s Transactions:', data.transactions.today_count);
})
.catch(error => console.error('Error:', error));
```

### Python/Requests
```python
import requests

url = "https://api.example.com/analytics/dashboard/"
headers = {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
params = {
    "exchange_rate": 12500
}

response = requests.get(url, headers=headers, params=params)
data = response.json()

print(f"Total Products: {data['inventory']['total_products']}")
print(f"Client Debt (USD): ${data['debts']['client_debt']['usd']}")
print(f"Today's Income (UZS): {data['income']['raw_income_today']['uzs']}")
print(f"Today's Transactions: {data['transactions']['today_count']}")
```

### cURL
```bash
curl -X GET "https://api.example.com/analytics/dashboard/?exchange_rate=12500" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Business Logic Notes

### Currency Conversion
All monetary values are stored in their original currency (USD or UZS) in the database. The API:
1. Sums all USD amounts separately
2. Sums all UZS amounts separately
3. Converts between currencies using the provided exchange rate
4. Returns both USD and UZS totals for flexibility

**Formula**:
- `total_usd = native_usd + (native_uzs / exchange_rate)`
- `total_uzs = (native_usd × exchange_rate) + native_uzs`

### Debt Status Filtering
Only debts with the following statuses are included:
- `PENDING`: Completely unpaid
- `PARTIALLY_PAID`: Some payment made, but not fully paid

Fully paid debts (`PAID` status) are excluded from calculations.

### Income Calculation
Raw income represents **profit margin**, not revenue:
- **Revenue**: Total amount received from sales
- **Profit/Income**: Revenue minus cost of goods sold
- **Formula**: `(sell_price - buy_price) × quantity`

The buy price is taken from the most recent batch for each product at the time of calculation.

### Time Zones
All "today" calculations use Django's timezone-aware datetime:
- Start: 00:00:00 (midnight)
- End: 23:59:59.999999 (last microsecond of the day)
- Uses server's configured timezone from Django settings

---

## Performance Considerations

### Database Queries
The dashboard endpoint makes multiple database queries:
1. Products count query
2. Asset value aggregation
3. Categories count query
4. Client debts aggregation
5. Old seller debts aggregation
6. New seller debts aggregation
7. Today's sales with batch information
8. Users count query
9. Suppliers count query
10. Clients count query
11. Today's sales count query

### Optimization Tips
- Use database connection pooling
- Consider caching for frequently accessed data
- The endpoint aggregates data in real-time; for high-traffic applications, consider implementing caching with a TTL (time-to-live)
- Indexes on `created_at`, `deleted`, and `status` fields improve query performance

### Response Time
Typical response time: 200-500ms depending on database size and server load.

---

## Related Models

### Database Models Used
- `Product` - Products in inventory
- `ProductBatch` - Product batches with pricing and quantity
- `Category` - Product categories
- `OldClientDebt` - Legacy client debts
- `OldSellerDebt` - Legacy supplier debts
- `NewSellerDebt` - Batch-based supplier debts
- `Sale` - Sales transactions
- `SaleItem` - Individual items in sales
- `User` - System users
- `Supplier` - Supplier entities
- `Client` - Client entities

---

## Troubleshooting

### Common Issues

#### Issue: "exchange_rate query parameter is required"
**Solution**: Always include the `exchange_rate` parameter in your request URL.

#### Issue: "Invalid exchange_rate: Exchange rate must be positive"
**Solution**: Ensure the exchange rate is a positive number greater than 0.

#### Issue: Zero values returned
**Possible Causes**:
- No data exists in the database
- All records are marked as `deleted=True`
- Date/time filtering excluded all records (check server timezone)

#### Issue: Inconsistent currency totals
**Possible Cause**: Using different exchange rates in different requests.
**Solution**: Use a consistent exchange rate across your application, ideally from a central configuration.

---

## API Versioning
- **Current Version**: v1 (implicit)
- **Stability**: Stable
- **Breaking Changes**: Will be announced with migration guide

---

## Support
For issues or questions:
1. Check this documentation
2. Review service layer code in `analytics/services/`
3. Check related model definitions
4. Contact API support team

---

## Changelog

### Current Version
- Initial analytics dashboard endpoint
- Real-time data aggregation
- Multi-currency support (USD/UZS)
- Comprehensive business metrics
