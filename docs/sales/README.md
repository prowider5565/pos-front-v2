# Sales API Documentation

Sales transaction management with FIFO inventory.

## 📚 Documentation Files

- **[SALES_API.md](SALES_API.md)** - Complete API reference
- **[SALES_QUICK_REFERENCE.md](SALES_QUICK_REFERENCE.md)** - Quick reference guide

## 🎯 Overview

Complete sales management with FIFO inventory deduction, multi-product support, and client debt tracking.

**Total Endpoints:** 3

## 📋 Endpoints

### Sales (3)
- Create sale (with items & payments)
- List sales
- Get sale details

## 🔑 Key Features

✅ Multi-product sales  
✅ FIFO inventory management  
✅ Optional payments at sale time  
✅ Client debt tracking  
✅ Discount support  
✅ Automatic status updates  

## 📊 Sale Status

- **PENDING**: No payments made
- **PARTIALLY_PAID**: Some payment made
- **PAID**: Fully paid

## 🔄 FIFO Inventory

Oldest batches used first:
1. Order batches by created_at
2. Deduct from oldest first
3. Move to next if needed
4. Update quantities automatically

## 🔗 Related APIs

- **Products API**: Inventory management
- **Payments API**: Additional payments
- **Users API**: Client management

---

**Documentation Version:** 1.0
