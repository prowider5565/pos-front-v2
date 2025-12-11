# Analytics API - Quick Reference

## Endpoint
```
GET /analytics/dashboard/?exchange_rate=12500
```

## Request
- **Authentication**: Required (Bearer Token)
- **Method**: GET
- **Query Params**: `exchange_rate` (required, number)

## Response Structure
```json
{
  "inventory": {
    "total_products": int,
    "total_asset_value": float,
    "categories_count": int
  },
  "debts": {
    "client_debt": {"usd": float, "uzs": float},
    "supplier_debt": {"usd": float, "uzs": float}
  },
  "income": {
    "raw_income_today": {"usd": float, "uzs": float}
  },
  "users": {
    "total_users": int,
    "suppliers_count": int,
    "clients_count": int
  },
  "transactions": {
    "today_count": int
  }
}
```

## Quick Example
```bash
curl -X GET "https://api.example.com/analytics/dashboard/?exchange_rate=12500" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Key Metrics Explained

| Metric | What it Shows |
|--------|---------------|
| `total_products` | Number of active products |
| `total_asset_value` | Total inventory value (sell_price × quantity) |
| `client_debt` | Money owed by clients (USD & UZS) |
| `supplier_debt` | Money owed to suppliers (USD & UZS) |
| `raw_income_today` | Today's profit: (sell_price - buy_price) × qty |
| `today_count` | Number of sales today |

## Important Notes
- ✅ All monetary values returned in both USD and UZS
- ✅ Debts include only PENDING and PARTIALLY_PAID statuses
- ✅ Income is **profit**, not revenue
- ✅ "Today" uses server timezone (00:00 to 23:59)
- ⚠️ Exchange rate must be positive number
- ⚠️ Exchange rate parameter is required

## Service Architecture
```
analytics/
├── views.py                          # AnalyticsDashboardViewSet
├── urls.py                           # /analytics/dashboard/
└── services/
    ├── inventory_analytics.py        # Products, assets, categories
    ├── debt_analytics.py             # Client & supplier debts
    ├── income_analytics.py           # Profit calculations
    ├── user_analytics.py             # Users, suppliers, clients
    └── transaction_analytics.py      # Sales count
```

## Full Documentation
See [ANALYTICS_API.md](./ANALYTICS_API.md) for complete documentation.
