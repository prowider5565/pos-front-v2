# Debts API Documentation

Legacy debt tracking for suppliers and clients.

## 📚 Documentation Files

- **[DEBTS_API.md](DEBTS_API.md)** - Complete API reference
- **[DEBTS_QUICK_REFERENCE.md](DEBTS_QUICK_REFERENCE.md)** - Quick reference guide

## 🎯 Overview

Manages legacy debts from before system implementation ("old debts") and automatically created debts from batch imports ("new debts").

**Total Endpoints:** 6

## 📋 Endpoints

### Old Seller Debts (3)
- Create old seller debt
- List old seller debts
- Get old seller debt details

### Old Client Debts (3)
- Create old client debt
- List old client debts  
- Get old client debt details

## 🔑 Key Features

✅ Legacy debt tracking  
✅ Multi-currency support (UZS, USD)  
✅ Exchange rate tracking  
✅ Automatic status calculation  
✅ Debt amount computations  

## 📊 Debt Status

- **PENDING**: No payments made
- **PARTIALLY_PAID**: Some payments made
- **PAID**: Fully paid

## 🔗 Related APIs

- **Payments API**: Make payments against debts
- **Users API**: Manage suppliers and clients
- **Products API**: New seller debt creation

---

**Documentation Version:** 1.0
