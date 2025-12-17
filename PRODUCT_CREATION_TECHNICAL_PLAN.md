# Product Creation Feature - Technical Plan

## Overview
Implement a "Create New Product" feature with modal dialog, image upload, batch creation, and optional payment handling.

## Current Status
- ✅ API methods added to `src/services/products.service.ts`
  - `getCategories()` - Fetch categories list
  - `uploadImages(images: File[])` - Upload images to `/media/upload/`
  - `createProduct(data)` - Create product at `/products/products/create/`
- ✅ TypeScript interfaces defined: `Category`, `CategoriesListResponse`, `ImageUploadResponse`

## Implementation Requirements

### 1. Button Placement
**Two locations:**

#### Location A: Suppliers List Page (`src/app/products/page.tsx`)
- Add "Create New Product" button next to search bar
- When clicked: Show supplier selectbox in modal (user must choose supplier)

#### Location B: Products By Supplier Page (`src/app/products/[supplierId]/page.tsx`)
- Add "Create New Product" button next to "Mijoz qo'shish" button
- When clicked: Auto-populate supplier ID from URL params (hide supplier selectbox)

### 2. Modal Form Fields

#### Basic Information Section
```typescript
{
  name: string              // Required, text input
  description: string       // Optional, textarea
  product_type: "KG" | "PIECE" | "WEIGHT"  // Required, select dropdown
  category: number          // Required, select dropdown (fetch from API)
  supplier: number          // Required (auto-filled on products page, selectbox on suppliers page)
}
```

#### Images Section
```typescript
{
  images: File[]           // Optional, max 15 files
}
```
- Multiple file input (`accept="image/*"`)
- Show image previews with thumbnails
- First image automatically becomes `is_main: true`
- Display: "0/15 images selected"
- Remove button for each preview

#### Batch Information Section
```typescript
{
  batch: {
    quantity: number       // Required, number input
    buy_price: string      // Required, number input with decimals
    sell_price: string     // Required, number input with decimals
  }
}
```

#### Finance Section (Optional - Collapsible)
```typescript
{
  finance: {
    currency: "UZS" | "USD"    // Required if finance provided, default "UZS"
    exchange_rate: string      // Required if finance, default from localStorage
    amount: string             // Optional, payment amount
    method: "CASH" | "CARD" | "TRANSFER"  // Optional, default "CASH"
  }
}
```
- Checkbox: "Add Payment" (collapsed by default)
- When checked, show all finance fields
- **Implement overpayment validation** (same as batch creation)

### 3. Image Upload Flow

#### Step 1: User Selects Images
```typescript
const [selectedImages, setSelectedImages] = useState<File[]>([])
const [imagePreviews, setImagePreviews] = useState<string[]>([])
```
- Validate max 15 images
- Show previews using `URL.createObjectURL(file)`
- Allow removal of individual images

#### Step 2: On Form Submit
```typescript
// 1. Upload images first (if any)
let product_uuid: string | undefined
let imageUrls: { url: string; is_main: boolean }[] = []

if (selectedImages.length > 0) {
  const uploadResponse = await productsService.uploadImages(selectedImages)
  product_uuid = uploadResponse.product_uuid
  imageUrls = uploadResponse.images.map((img, index) => ({
    url: img.url,
    is_main: index === 0  // First image is main
  }))
}

// 2. Create product with batch
const payload = {
  name: data.name,
  description: data.description,
  product_type: data.product_type,
  category: data.category,
  supplier: data.supplier,
  images: imageUrls,
  batch: {
    quantity: parseInt(data.quantity),
    buy_price: data.buy_price,
    sell_price: data.sell_price,
  },
  product_uuid: product_uuid,
}

// 3. Add finance if payment provided
if (data.has_payment && data.amount && parseFloat(data.amount) > 0) {
  payload.finance = {
    currency: data.currency || "UZS",
    exchange_rate: data.exchange_rate,
    amount: data.amount,
    method: data.method,
  }
}

// 4. Submit
await productsService.createProduct(payload)
```

### 4. Form Validation Schema

```typescript
const productCreateSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  product_type: z.enum(["KG", "PIECE", "WEIGHT"]),
  category: z.string().min(1, "Category is required"),
  supplier: z.string().min(1, "Supplier is required"),
  
  // Batch
  quantity: z.string().min(1, "Quantity is required"),
  buy_price: z.string().min(1, "Buy price is required"),
  sell_price: z.string().min(1, "Sell price is required"),
  
  // Finance (optional)
  has_payment: z.boolean().default(false),
  currency: z.enum(["UZS", "USD"]).optional(),
  exchange_rate: z.string().optional(),
  amount: z.string().optional(),
  method: z.string().optional(),
})
```

### 5. Overpayment Validation

**Reuse existing logic from batch creation:**

```typescript
const calculations = useMemo(() => {
  const qty = parseFloat(quantity) || 0
  const price = parseFloat(buy_price) || 0
  const payment = parseFloat(amount) || 0
  const rate = parseFloat(exchange_rate) || 1

  const totalCost = qty * price
  const paidInUZS = currency === "USD" ? payment * rate : payment
  const remainingUZS = totalCost - paidInUZS
  const remainingUSD = remainingUZS / rate
  const isOverpayment = paidInUZS > totalCost && totalCost > 0

  return {
    totalCost,
    paidInUZS,
    remainingUZS,
    remainingUSD: remainingUSD > 0 ? remainingUSD : 0,
    isOverpayment,
  }
}, [quantity, buy_price, amount, currency, exchange_rate])
```

**Visual Indicators:**
- Red border on payment amount field
- Warning text: "Overpayment! Please decrease the amount" (translated)
- Disable submit button when `isOverpayment === true`
- Show overpayment amount in payment summary

### 6. State Management

```typescript
const [isCreateProductDialogOpen, setIsCreateProductDialogOpen] = useState(false)
const [categories, setCategories] = useState<Category[]>([])
const [selectedImages, setSelectedImages] = useState<File[]>([])
const [imagePreviews, setImagePreviews] = useState<string[]>([])
const [isUploading, setIsUploading] = useState(false)

// Fetch categories on component mount
useEffect(() => {
  const fetchCategories = async () => {
    try {
      const response = await productsService.getCategories()
      setCategories(response.results)
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }
  fetchCategories()
}, [])
```

### 7. Success Handling

After successful product creation:
1. Show success toast
2. Close modal
3. Reset form
4. Clear image previews
5. **Navigate to the newly created product's page** (if possible, or refresh current list)

### 8. Error Handling

**Image Upload Errors:**
- File size too large
- Invalid file type
- Network errors
- Show specific error messages

**Product Creation Errors:**
- Validation errors from backend
- Overpayment errors (parse and display)
- Network errors
- Show error toast with details

### 9. Translations Needed

Add to `src/locales/{lang}/products.json`:

```json
{
  "createProduct": "Create New Product",
  "productName": "Product Name",
  "productDescription": "Description",
  "productType": "Product Type",
  "selectCategory": "Select Category",
  "selectSupplier": "Select Supplier",
  "uploadImages": "Upload Images",
  "maxImages": "Maximum 15 images",
  "imagesSelected": "{count}/15 images selected",
  "removeImage": "Remove",
  "batchInformation": "Batch Information",
  "addPayment": "Add Payment",
  "productCreatedSuccessfully": "Product created successfully",
  "failedToCreateProduct": "Failed to create product",
  "failedToUploadImages": "Failed to upload images"
}
```

### 10. File Locations

**Files to create/modify:**

1. `src/app/products/page.tsx`
   - Add "Create New Product" button
   - Add product creation modal component

2. `src/app/products/[supplierId]/page.tsx`
   - Add "Create New Product" button
   - Add product creation modal component

3. `src/app/products/components/product-create-dialog.tsx` (NEW)
   - Create reusable product creation modal component
   - Accept props: `open`, `onOpenChange`, `supplierId` (optional)
   - Handle all form logic, validation, image upload, submission

### 11. Component Structure

```typescript
interface ProductCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierId?: number  // If provided, hide supplier selectbox
  onSuccess?: () => void
}

export function ProductCreateDialog({ 
  open, 
  onOpenChange, 
  supplierId,
  onSuccess 
}: ProductCreateDialogProps) {
  // Form logic
  // Image upload logic
  // Overpayment validation
  // Submit handler
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        {/* Form fields */}
      </DialogContent>
    </Dialog>
  )
}
```

## API Endpoints Reference

### Get Categories
```
GET /api/products/categories/
Response: {
  "count": 9,
  "results": [
    {
      "id": 1,
      "name": "Pachkalik",
      "created_at": "2025-11-26T17:27:51.160924+05:00"
    }
  ]
}
```

### Upload Images
```
POST /media/upload/
Content-Type: multipart/form-data
Body: FormData with 'images' field (multiple files)

Response: {
  "product_uuid": "166fba4f-14df-4086-bd8c-b0daa8e1e1ff",
  "images": [
    {
      "url": "/media/products/166fba4f-14df-4086-bd8c-b0daa8e1e1ff/image.png",
      "is_main": false
    }
  ]
}
```

### Create Product
```
POST /api/products/products/create/
Body: {
  "name": "string",
  "description": "string",
  "product_type": "KG",
  "category": 0,
  "supplier": 0,
  "images": [
    {
      "url": "string",
      "is_main": true
    }
  ],
  "batch": {
    "quantity": 0,
    "buy_price": "string",
    "sell_price": "string"
  },
  "finance": {
    "currency": "UZS",
    "exchange_rate": "string",
    "amount": "string",
    "method": "CASH"
  },
  "product_uuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

## Implementation Notes

1. **Reuse existing patterns** from batch creation modal for consistency
2. **Image previews** should show thumbnails in a grid layout
3. **Loading states** during image upload and product creation
4. **Form is large** - use scrollable dialog content
5. **Payment calculations** should update in real-time
6. **First image** in array is always marked as `is_main: true`
7. **Supplier selectbox** only shown when creating from suppliers page
8. **Categories** fetched once on mount and cached
9. **Clean up** image preview URLs using `URL.revokeObjectURL()` on unmount

## Testing Checklist

- [ ] Create product without images
- [ ] Create product with 1 image
- [ ] Create product with 15 images (max)
- [ ] Try uploading 16 images (should show error)
- [ ] Create product without payment
- [ ] Create product with payment (valid amount)
- [ ] Try overpayment (should show warning and disable submit)
- [ ] Create from suppliers page (with supplier selectbox)
- [ ] Create from products page (supplier auto-filled)
- [ ] Test all product types (KG, PIECE, WEIGHT)
- [ ] Test all payment methods (CASH, CARD, TRANSFER)
- [ ] Test currency conversion (USD to UZS)
- [ ] Test form validation (required fields)
- [ ] Test backend error handling
- [ ] Test success flow (product created, navigated to new product)
- [ ] Test translations in all 3 languages

## Current Progress
- ✅ API methods implemented
- ✅ TypeScript interfaces defined
- ⏳ Modal component not created yet
- ⏳ Form fields not implemented yet
- ⏳ Image upload UI not implemented yet
- ⏳ Button placement not done yet
- ⏳ Translations not added yet

---

**Next Session Instructions:**
1. Read this plan
2. Implement `src/app/products/components/product-create-dialog.tsx`
3. Add buttons to both pages
4. Add translations
5. Test thoroughly
