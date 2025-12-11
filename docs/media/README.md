# Media API Documentation

Product image upload and management.

## 📚 Documentation Files

- **[MEDIA_API.md](MEDIA_API.md)** - Complete API reference
- **[MEDIA_QUICK_REFERENCE.md](MEDIA_QUICK_REFERENCE.md)** - Quick reference guide

## 🎯 Overview

Two-workflow image upload system: pre-upload before product creation, or post-upload to existing products.

**Total Endpoints:** 2

## 📋 Endpoints

### Image Upload (2)
- Upload images (pre-product)
- Add images to product

## 🔑 Key Features

✅ Pre/post upload workflows  
✅ UUID-based temp storage  
✅ Auto file migration  
✅ Multi-file upload  
✅ Format validation  
✅ Size validation (20MB max)  

## 📁 Supported Formats

✅ jpg, jpeg, png, webp  
✅ gif, svg, bmp  

## 🔄 Workflows

### Pre-Upload (Recommended)
1. Upload images → Get UUID
2. Create product with UUID
3. Images auto-migrated

### Post-Upload
1. Create product
2. Add images to product

## 🔗 Related APIs

- **Products API**: Product creation

---

**Documentation Version:** 1.0
