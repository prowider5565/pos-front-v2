# API Documentation

Complete documentation for all API modules in the system.

## 📚 Available Documentation

### 1. Analytics API
**Location:** [`analytics/`](analytics/)

Analytics and reporting API with dashboard capabilities.

**Files:**
- [ANALYTICS_API.md](analytics/ANALYTICS_API.md) - Complete API reference
- [ANALYTICS_QUICK_REFERENCE.md](analytics/ANALYTICS_QUICK_REFERENCE.md) - Quick reference

**Endpoints:** 20+ analytics endpoints

---

### 2. Users API
**Location:** [`users/`](users/)

Authentication, authorization, and entity management.

**Files:**
- [README.md](users/README.md) - Overview
- [USERS_API.md](users/USERS_API.md) - Complete reference (1,959 lines)
- [USERS_QUICK_REFERENCE.md](users/USERS_QUICK_REFERENCE.md) - Quick reference

**Endpoints:** 17 endpoints (Auth, Users, Suppliers, Clients)

---

### 3. Debts API
**Location:** [`debts/`](debts/)

Legacy debt tracking for suppliers and clients.

**Files:**
- [DEBTS_API.md](debts/DEBTS_API.md) - Complete reference
- [DEBTS_QUICK_REFERENCE.md](debts/DEBTS_QUICK_REFERENCE.md) - Quick reference

**Endpoints:** 6 endpoints (Old Seller/Client Debts)

---

### 4. Payments API
**Location:** [`payments/`](payments/)

Payment processing for debts and sales.

**Files:**
- [PAYMENTS_API.md](payments/PAYMENTS_API.md) - Complete reference
- [PAYMENTS_QUICK_REFERENCE.md](payments/PAYMENTS_QUICK_REFERENCE.md) - Quick reference

**Endpoints:** 13 endpoints (Direct & Bulk Payments)

---

### 5. Products API
**Location:** [`products/`](products/)

Product catalog, inventory batches, and categories.

**Files:**
- [PRODUCTS_API.md](products/PRODUCTS_API.md) - Complete reference
- [PRODUCTS_QUICK_REFERENCE.md](products/PRODUCTS_QUICK_REFERENCE.md) - Quick reference

**Endpoints:** 14 endpoints (Products, Batches, Categories)

---

### 6. Sales API
**Location:** [`sales/`](sales/)

Sales transaction management with FIFO inventory.

**Files:**
- [SALES_API.md](sales/SALES_API.md) - Complete reference
- [SALES_QUICK_REFERENCE.md](sales/SALES_QUICK_REFERENCE.md) - Quick reference

**Endpoints:** 3 endpoints (Create, List, Details)

---

### 7. Media API
**Location:** [`media/`](media/)

Product image upload and management.

**Files:**
- [MEDIA_API.md](media/MEDIA_API.md) - Complete reference
- [MEDIA_QUICK_REFERENCE.md](media/MEDIA_QUICK_REFERENCE.md) - Quick reference

**Endpoints:** 2 endpoints (Pre-upload, Post-upload)

---

## 🚀 Quick Start

### Authentication
```bash
# Login
POST /api/users/auth/login/
{"login": "username", "password": "password"}

# Use token in requests
Authorization: Bearer <access_token>
```

### Common Patterns

**Pagination:**
- Default: 32 items per page (users, debts, payments, products)
- Sales: 20 items per page (configurable up to 100)

**Soft Delete:**
- All delete operations are logical (data retained)
- Use `?deleted=true` to view deleted records

**Multi-Currency:**
- Supported: UZS (Uzbekistan Sum), USD (US Dollar)
- Exchange rates tracked with transactions

---

## 📊 API Structure

### Base URLs

```
/api/analytics/  - Analytics and reporting
/api/users/      - Users, suppliers, clients, auth
/api/debts/      - Debt management
/api/payments/   - Payment processing
/api/products/   - Products, batches, categories
/api/sales/      - Sales transactions
/api/media/      - Media uploads
```

---

## 🔐 Authentication & Authorization

### Token-Based (JWT)
- **Access Token**: Short-lived for API requests
- **Refresh Token**: Long-lived for getting new access tokens

### Permission Levels
- **AllowAny**: No authentication required
- **IsAuthenticated**: Valid JWT token required
- **IsSuperUser**: Authenticated superuser required

---

## 💡 Key Features by Module

### Users
✅ JWT authentication  
✅ Dual login (username/phone)  
✅ Supplier/Client management  
✅ Soft delete  

### Debts
✅ Old debt tracking  
✅ New debt auto-creation  
✅ Multi-currency support  
✅ Status tracking  

### Payments
✅ Direct payments  
✅ Bulk payment distribution (FIFO)  
✅ Multiple payment methods  
✅ Overpayment prevention  

### Products
✅ Product catalog  
✅ Batch inventory tracking  
✅ Category management  
✅ Image management  
✅ Auto debt creation  

### Sales
✅ Multi-product sales  
✅ FIFO inventory deduction  
✅ Optional payments  
✅ Client debt tracking  

### Media
✅ Pre-upload workflow  
✅ Multiple file formats  
✅ Size validation  
✅ Auto file migration  

---

## 📖 Documentation Standards

Each API module includes:

✅ Complete endpoint reference  
✅ Request/response examples  
✅ Data models and fields  
✅ Validation rules  
✅ Error handling  
✅ Common patterns  
✅ Best practices  
✅ Quick reference guide  

---

## 🔧 Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🌐 Supported Features

### Multi-Currency
- **UZS** - Uzbekistan Sum (default)
- **USD** - US Dollar
- Exchange rate tracking

### Localization
- Uzbek language error messages
- Phone number format: +998
- Currency formatting

### Data Protection
- Soft delete for retention
- Audit trails with timestamps
- Password hashing (bcrypt)
- JWT token security

---

## 📝 Documentation Stats

| Module | Endpoints | Doc Lines | Status |
|--------|-----------|-----------|--------|
| Analytics | 20+ | ~2,000 | ✅ Complete |
| Users | 17 | 2,903 | ✅ Complete |
| Debts | 6 | ~1,500 | ✅ Complete |
| Payments | 13 | ~2,500 | ✅ Complete |
| Products | 14 | ~2,000 | ✅ Complete |
| Sales | 3 | ~1,800 | ✅ Complete |
| Media | 2 | ~1,000 | ✅ Complete |
| **Total** | **75+** | **~14,000** | ✅ Complete |

---

## 🎯 Quick Access

### By Use Case

**User Management:**
- [Authentication](users/USERS_API.md#authentication-endpoints)
- [Suppliers](users/USERS_API.md#supplier-management-endpoints)
- [Clients](users/USERS_API.md#client-management-endpoints)

**Financial Management:**
- [Old Debts](debts/DEBTS_API.md)
- [Payments](payments/PAYMENTS_API.md)
- [Analytics](analytics/ANALYTICS_API.md)

**Inventory Management:**
- [Products](products/PRODUCTS_API.md#product-endpoints)
- [Batches](products/PRODUCTS_API.md#product-batch-endpoints)
- [Categories](products/PRODUCTS_API.md#category-endpoints)

**Sales Operations:**
- [Create Sales](sales/SALES_API.md#create-sale)
- [Sale Payments](payments/PAYMENTS_API.md#sale-payment-endpoints)
- [Sales List](sales/SALES_API.md#list-sales)

**Reporting:**
- [Dashboard](analytics/ANALYTICS_API.md#dashboard-endpoint)
- [Income Analytics](analytics/ANALYTICS_API.md#income-analytics-endpoints)
- [Inventory Analytics](analytics/ANALYTICS_API.md#inventory-analytics-endpoints)

---

## 🆘 Getting Help

### Documentation Navigation
1. Start with module README
2. Use Quick Reference for daily work
3. Consult full API docs for details
4. Check examples for common scenarios

### Troubleshooting
1. Check error messages and status codes
2. Verify authentication token
3. Confirm permission levels
4. Review request format
5. Consult error handling section

---

## 📧 Support

For questions, issues, or feature requests:
1. Check documentation first
2. Review error messages
3. Consult code examples
4. Contact development team

---

**Documentation Version:** 1.0  
**Last Updated:** 2024  
**Total Documentation:** ~14,000 lines across 7 modules
