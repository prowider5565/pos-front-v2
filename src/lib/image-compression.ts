/**
 * Client-side image compression using Canvas API.
 * No external dependencies required.
 */

interface CompressionOptions {
  /** Max width in pixels */
  maxWidth: number
  /** Max height in pixels */
  maxHeight: number
  /** JPEG quality (0 to 1) */
  quality: number
  /** Output MIME type */
  mimeType: 'image/jpeg' | 'image/webp'
}

const CATEGORY_IMAGE_OPTIONS: CompressionOptions = {
  maxWidth: 256,
  maxHeight: 256,
  quality: 0.6,
  mimeType: 'image/jpeg',
}

const PRODUCT_IMAGE_OPTIONS: CompressionOptions = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.82,
  mimeType: 'image/jpeg',
}

/** Threshold in bytes — only compress if file exceeds this */
const CATEGORY_SIZE_THRESHOLD = 100 * 1024 // 100 KB
const PRODUCT_SIZE_THRESHOLD = 500 * 1024  // 500 KB

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

function compressWithCanvas(
  img: HTMLImageElement,
  options: CompressionOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const { maxWidth, maxHeight, quality, mimeType } = options

    let { width, height } = img

    // Scale down proportionally
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    ctx.drawImage(img, 0, 0, width, height)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Canvas toBlob failed'))
        }
      },
      mimeType,
      quality
    )
  })
}

async function compressImage(
  file: File,
  options: CompressionOptions,
  sizeThreshold: number
): Promise<File> {
  // Skip compression for small files
  if (file.size <= sizeThreshold) {
    return file
  }

  // Skip non-image files or SVGs (can't compress SVG with canvas)
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file
  }

  const img = await loadImage(file)

  try {
    const blob = await compressWithCanvas(img, options)

    // If compressed is somehow larger, return original
    if (blob.size >= file.size) {
      return file
    }

    // Build a new File with the same name but .jpg extension
    const extension = options.mimeType === 'image/webp' ? '.webp' : '.jpg'
    const baseName = file.name.replace(/\.[^.]+$/, '')
    const newName = `${baseName}${extension}`

    return new File([blob], newName, { type: options.mimeType })
  } finally {
    URL.revokeObjectURL(img.src)
  }
}

/**
 * Compress a category image aggressively (small thumbnail use).
 * Max 256x256, quality 60%.
 */
export async function compressCategoryImage(file: File): Promise<File> {
  return compressImage(file, CATEGORY_IMAGE_OPTIONS, CATEGORY_SIZE_THRESHOLD)
}

/**
 * Compress a product image moderately (preserves decent quality).
 * Max 1024x1024, quality 82%.
 */
export async function compressProductImage(file: File): Promise<File> {
  return compressImage(file, PRODUCT_IMAGE_OPTIONS, PRODUCT_SIZE_THRESHOLD)
}

/**
 * Compress multiple product images.
 */
export async function compressProductImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressProductImage))
}
