# Media API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [Image Upload Endpoints](#image-upload-endpoints)
5. [Data Models](#data-models)
6. [File Validation](#file-validation)
7. [Error Handling](#error-handling)
8. [Examples](#examples)

---

## Overview

The Media API handles product image uploads with two distinct workflows:

1. **Pre-upload workflow**: Upload images before product creation (recommended)
2. **Post-upload workflow**: Add images to existing products

**Key Features:**
- Multi-file upload support
- Image validation (size, format)
- UUID-based temporary storage
- Automatic file migration to product directories
- Support for multiple image formats
- Duplicate filename handling
- Main image designation

**Base URL:** `/api/media/`

**Authentication:** All endpoints require JWT Bearer token authentication.

---

## Base URL

```
/api/media/
```

All media endpoints are prefixed with this base URL.

---

## Authentication

All endpoints require JWT authentication:

```
Authorization: Bearer <access_token>
```

**Permission Level:** IsAuthenticated

---

## Image Upload Endpoints

### 1. Upload Images (Pre-Product Creation)

Upload product images before creating the product. Returns UUID to use in product creation.

**Endpoint:** `POST /api/media/upload/`

**Permissions:** IsAuthenticated

**Content-Type:** `multipart/form-data`

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `images` | file[] | Yes | Array of image files |

**Response:** `201 Created`

```json
{
  "product_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "images": [
    {
      "url": "/media/products/550e8400-e29b-41d4-a716-446655440000/image1.jpg",
      "is_main": false
    },
    {
      "url": "/media/products/550e8400-e29b-41d4-a716-446655440000/image2.jpg",
      "is_main": false
    }
  ]
}
```

**Workflow:**

1. **Upload Images**: POST to `/api/media/upload/`
2. **Receive UUID**: Get `product_uuid` from response
3. **Create Product**: POST to `/api/products/products/create/` with `product_uuid`
4. **Automatic Migration**: Images moved from UUID directory to product ID directory

**Storage Structure:**

```
media/
  products/
    550e8400-e29b-41d4-a716-446655440000/  (temporary UUID directory)
      image1.jpg
      image2.jpg
    
    → After product creation (ID: 1) →
    
    1/  (permanent product directory)
      image1.jpg
      image2.jpg
```

**File Processing:**
- Generates UUID for upload session
- Creates temporary directory: `media/products/{uuid}/`
- Saves files with original names
- Handles duplicate filenames (appends counter)
- Returns URLs with UUID in path

**Notes:**
- UUID directory created temporarily
- Images migrated when product created with UUID
- UUID directory deleted after migration
- Main image must be set later (via product creation)

**Error Responses:**

- `400 Bad Request`: No images provided
  ```json
  {
    "error": "No images provided. Please upload at least one image."
  }
  ```

- `400 Bad Request`: File too large
  ```json
  {
    "images": ["File 'large_image.jpg' is too large. Maximum size is 20MB."]
  }
  ```

- `400 Bad Request`: Invalid extension
  ```json
  {
    "images": ["File 'document.pdf' has an invalid extension. Allowed extensions: jpg, jpeg, png, webp, gif, svg, bmp"]
  }
  ```

---

### 2. Add Images to Existing Product

Add additional images to an existing product.

**Endpoint:** `POST /api/media/products/{product_id}/images/`

**Permissions:** IsAuthenticated

**Content-Type:** `multipart/form-data`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `product_id` | integer | Yes | Product ID |

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `images` | file[] | Yes | Array of image files |

**Response:** `201 Created`

```json
{
  "product_id": 1,
  "images": [
    {
      "id": 3,
      "url": "/media/products/1/image3.jpg",
      "is_main": false
    },
    {
      "id": 4,
      "url": "/media/products/1/image4.jpg",
      "is_main": false
    }
  ]
}
```

**Workflow:**

1. **Product Exists**: Product must be created first
2. **Upload Images**: POST to `/api/media/products/{id}/images/`
3. **Direct Storage**: Images saved directly to product directory
4. **Database Records**: ProductImage records created immediately

**Storage Structure:**

```
media/
  products/
    1/  (product directory)
      existing_image1.jpg
      existing_image2.jpg
      image3.jpg  (newly added)
      image4.jpg  (newly added)
```

**File Processing:**
- Saves directly to product directory: `media/products/{product_id}/`
- Creates ProductImage database records
- Handles duplicate filenames
- Returns created image IDs and URLs

**Notes:**
- Product must exist and not be deleted
- Images saved immediately (no migration needed)
- Can be called multiple times to add more images
- Default `is_main=false` for all added images

**Error Responses:**

- `404 Not Found`: Product not found
  ```json
  {
    "detail": "Not found."
  }
  ```

- `400 Bad Request`: No images provided
  ```json
  {
    "error": "No images provided. Please upload at least one image."
  }
  ```

---

## Data Models

### ProductImage Model

**Database Table:** `product_images`

**Fields:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | integer | Primary Key | Image ID |
| `url` | string (800) | Required | Image URL path |
| `is_main` | boolean | Default: false | Is main product image? |
| `product` | foreign key | CASCADE | Reference to Product |
| `deleted` | boolean | Default: false | Soft delete flag |
| `created_at` | datetime | Auto-set | Upload timestamp |

**Relationships:**
- Belongs to Product (foreign key)

**URL Format:**
- Pre-upload: `/media/products/{uuid}/{filename}`
- Post-creation: `/media/products/{product_id}/{filename}`

**Notes:**
- Multiple images per product
- Only one should have `is_main=true`
- Soft delete supported
- URL stores relative path

---

## File Validation

### Allowed File Extensions

The following image formats are supported:

| Extension | Description |
|-----------|-------------|
| `.jpg`, `.jpeg` | JPEG images |
| `.png` | PNG images |
| `.webp` | WebP images |
| `.gif` | GIF images |
| `.svg` | SVG vector images |
| `.bmp` | Bitmap images |

### File Size Limits

- **Maximum file size**: 20 MB per file
- **No limit on number of files** in single upload

### Validation Rules

1. **Extension Check**: File must have allowed extension (case-insensitive)
2. **Size Check**: File must not exceed 20 MB
3. **Format Check**: File must be valid image (validated by Django ImageField)

### Filename Handling

**Duplicate Prevention:**
```
Original: image.jpg
If exists: image_1.jpg
If exists: image_2.jpg
...and so on
```

**Sanitization:**
- Uses original filename
- Counter appended for duplicates
- No special characters removed (handled by filesystem)

---

## Error Handling

### Standard Error Responses

| Code | Meaning |
|------|---------|
| 201 | Created - Upload successful |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Missing/invalid token |
| 404 | Not Found - Product not found |

### Common Errors

**No Images Provided:**
```json
{
  "error": "No images provided. Please upload at least one image."
}
```

**File Too Large:**
```json
{
  "images": ["File 'large_image.jpg' is too large. Maximum size is 20MB."]
}
```

**Invalid Extension:**
```json
{
  "images": ["File 'document.pdf' has an invalid extension. Allowed extensions: jpg, jpeg, png, webp, gif, svg, bmp"]
}
```

**Product Not Found:**
```json
{
  "detail": "Not found."
}
```

**UUID Directory Not Found:**
```json
{
  "non_field_errors": ["Image directory for UUID {uuid} not found. Please upload images first."]
}
```

---

## Examples

### Example 1: Pre-Upload Workflow (Recommended)

**Step 1: Upload Images**

```bash
curl -X POST https://api.example.com/api/media/upload/ \
  -H "Authorization: Bearer <token>" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

**Response:**

```json
{
  "product_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "images": [
    {
      "url": "/media/products/550e8400-e29b-41d4-a716-446655440000/image1.jpg",
      "is_main": false
    },
    {
      "url": "/media/products/550e8400-e29b-41d4-a716-446655440000/image2.jpg",
      "is_main": false
    }
  ]
}
```

**Step 2: Create Product with UUID**

```bash
curl -X POST https://api.example.com/api/products/products/create/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Rice",
    "product_type": "KG",
    "supplier": 1,
    "product_uuid": "550e8400-e29b-41d4-a716-446655440000",
    "images": [
      {
        "url": "/media/products/550e8400-e29b-41d4-a716-446655440000/image1.jpg",
        "is_main": true
      },
      {
        "url": "/media/products/550e8400-e29b-41d4-a716-446655440000/image2.jpg",
        "is_main": false
      }
    ]
  }'
```

**Result:**
- Images migrated from UUID directory to product directory
- URLs updated to use product ID
- ProductImage records created with correct product reference

---

### Example 2: Post-Upload Workflow

**Step 1: Create Product**

```bash
curl -X POST https://api.example.com/api/products/products/create/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Rice",
    "product_type": "KG",
    "supplier": 1
  }'
```

**Response:**

```json
{
  "id": 1,
  "name": "Premium Rice",
  ...
}
```

**Step 2: Add Images**

```bash
curl -X POST https://api.example.com/api/media/products/1/images/ \
  -H "Authorization: Bearer <token>" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

**Response:**

```json
{
  "product_id": 1,
  "images": [
    {
      "id": 1,
      "url": "/media/products/1/image1.jpg",
      "is_main": false
    },
    {
      "id": 2,
      "url": "/media/products/1/image2.jpg",
      "is_main": false
    }
  ]
}
```

---

### Example 3: Multiple Files Upload

```bash
curl -X POST https://api.example.com/api/media/upload/ \
  -H "Authorization: Bearer <token>" \
  -F "images=@image1.jpg" \
  -F "images=@image2.png" \
  -F "images=@image3.webp" \
  -F "images=@image4.gif"
```

---

## Best Practices

### For API Consumers

**Image Upload:**
- Use pre-upload workflow for better UX
- Upload images before showing product form
- Show upload progress to users
- Validate files client-side before upload

**File Management:**
- Compress images before upload when possible
- Use appropriate formats (JPEG for photos, PNG for graphics)
- Consider WebP for better compression
- Limit file sizes client-side

**Error Handling:**
- Validate file size before upload
- Check file extensions before upload
- Handle network errors gracefully
- Retry failed uploads

**Performance:**
- Upload multiple images in single request
- Show thumbnails while uploading
- Cache uploaded image URLs
- Lazy load images in product lists

---

## Related Documentation

- **Products API**: For creating products with images
- **Users API**: For authentication

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**API Base URL:** `/api/media/`
