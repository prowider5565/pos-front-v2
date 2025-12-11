# Media API Quick Reference

## Image Upload Endpoints

### Pre-Upload Images
```bash
POST /api/media/upload/
Content-Type: multipart/form-data
images: [file1, file2, ...]

→ Returns: { product_uuid, images: [...] }
```

### Add Images to Product
```bash
POST /api/media/products/{product_id}/images/
Content-Type: multipart/form-data
images: [file1, file2, ...]

→ Returns: { product_id, images: [...] }
```

---

## Workflows

### Pre-Upload Workflow (Recommended)
1. POST `/api/media/upload/` → Get UUID
2. POST `/api/products/products/create/` with UUID
3. Images automatically migrated

### Post-Upload Workflow
1. POST `/api/products/products/create/`
2. POST `/api/media/products/{id}/images/`

---

## File Validation

### Allowed Extensions
✅ jpg, jpeg, png, webp, gif, svg, bmp

### Size Limit
✅ Maximum: 20 MB per file

---

## Response Structures

### Upload Response
```json
{
  "product_uuid": "550e8400-...",
  "images": [
    {
      "url": "/media/products/uuid/image.jpg",
      "is_main": false
    }
  ]
}
```

### Extend Response
```json
{
  "product_id": 1,
  "images": [
    {
      "id": 1,
      "url": "/media/products/1/image.jpg",
      "is_main": false
    }
  ]
}
```

---

## Common Errors

```json
// No images
{"error": "No images provided. Please upload at least one image."}

// File too large
{"images": ["File 'large.jpg' is too large. Maximum size is 20MB."]}

// Invalid extension
{"images": ["File 'doc.pdf' has an invalid extension. Allowed: jpg, jpeg, png, webp, gif, svg, bmp"]}

// Product not found
{"detail": "Not found."}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |

---

## Key Features

✅ Multi-file upload  
✅ UUID-based temp storage  
✅ Automatic migration  
✅ Format validation  
✅ Size validation  
✅ Duplicate filename handling  

---

**Quick Reference Version:** 1.0
