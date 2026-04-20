import React, { useState } from 'react'

// Inline SVG fallback — no extra network request, no CLS
const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

/**
 * Extended props — adds performance-oriented attributes on top of native <img>.
 *
 * • loading    — "lazy" (default) defers off-screen images, "eager" for above-the-fold
 * • decoding   — "async" lets the browser decode off the main thread (improves INP)
 * • fetchPriority — "high" for LCP images (hero), "low" for decorative images
 * • width/height  — always provide to prevent CLS (layout shift while loading)
 * • srcSet/sizes  — responsive images: browser picks the best size for the viewport
 */
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** "lazy" (default) for below-the-fold images. Use "eager" for the LCP hero image. */
  loading?: 'lazy' | 'eager'
  /** Hint to the browser fetch priority. Use "high" for the main hero image. */
  fetchPriority?: 'high' | 'low' | 'auto'
  /**
   * WebP source URL — if provided, the component renders a <picture> element
   * with WebP as the preferred format and the original src as fallback.
   * Example: webpSrc="/images/hero.webp" src="/images/hero.jpg"
   */
  webpSrc?: string
  /**
   * AVIF source URL — highest priority format (smallest size).
   * Browsers that support AVIF will use this; others fall back to WebP or src.
   */
  avifSrc?: string
}

export function ImageWithFallback({
  src,
  alt,
  style,
  className,
  loading = 'lazy',          // default: lazy — defers off-screen images
  decoding = 'async',        // default: async — decode off main thread
  fetchPriority = 'auto',
  width,
  height,
  webpSrc,
  avifSrc,
  ...rest
}: OptimizedImageProps) {
  const [didError, setDidError] = useState(false)

  // ── Error state: show inline SVG placeholder ──────────────────────────────
  if (didError) {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
        style={style}
        // Reserve the same space as the image to prevent CLS
        aria-hidden="true"
      >
        <div className="flex items-center justify-center w-full h-full">
          <img
            src={ERROR_IMG_SRC}
            alt="Image non disponible"
            width={width}
            height={height}
            data-original-url={src}
          />
        </div>
      </div>
    )
  }

  // ── Modern formats via <picture> (WebP / AVIF) ────────────────────────────
  // <picture> lets the browser pick the best supported format automatically.
  // Order matters: AVIF first (best compression), then WebP, then original.
  if (avifSrc || webpSrc) {
    return (
      <picture>
        {avifSrc && <source srcSet={avifSrc} type="image/avif" />}
        {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
        <img
          src={src}
          alt={alt ?? ''}
          className={className}
          style={style}
          loading={loading}
          decoding={decoding}
          // @ts-expect-error — fetchpriority is valid HTML but not yet in React types
          fetchpriority={fetchPriority}
          width={width}
          height={height}
          onError={() => setDidError(true)}
          {...rest}
        />
      </picture>
    )
  }

  // ── Standard <img> with performance attributes ────────────────────────────
  return (
    <img
      src={src}
      alt={alt ?? ''}
      className={className}
      style={style}
      loading={loading}
      decoding={decoding}
      // @ts-expect-error — fetchpriority is valid HTML but not yet in React types
      fetchpriority={fetchPriority}
      width={width}
      height={height}
      onError={() => setDidError(true)}
      {...rest}
    />
  )
}
