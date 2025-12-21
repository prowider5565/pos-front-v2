"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallback?: React.ReactNode
  aspectRatio?: string
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down"
}

export function LazyImage({
  src,
  alt,
  fallback,
  aspectRatio = "square",
  objectFit = "cover",
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: "50px", // Start loading 50px before image enters viewport
      }
    )

    observer.observe(imgRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
    setIsLoaded(true)
  }

  return (
    <div
      ref={imgRef}
      className={cn("relative overflow-hidden bg-muted", className)}
      style={{
        aspectRatio: aspectRatio === "square" ? "1/1" : aspectRatio,
      }}
    >
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}

      {/* Image */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            objectFit === "cover" && "object-cover",
            objectFit === "contain" && "object-contain",
            objectFit === "fill" && "object-fill",
            objectFit === "none" && "object-none",
            objectFit === "scale-down" && "object-scale-down"
          )}
          {...props}
        />
      )}

      {/* Fallback */}
      {hasError && fallback && (
        <div className="absolute inset-0 flex items-center justify-center">
          {fallback}
        </div>
      )}
    </div>
  )
}
