// Helpers for serving appropriately-sized images and warming the browser cache.
// Most practice images come from Unsplash, whose CDN resizes via query params.

/**
 * Rewrite an Unsplash image URL to request a specific rendered size.
 * Falls back to the original URL for any non-Unsplash source.
 */
export function resizeUnsplashUrl(url: string, width: number, height: number, quality = 60): string {
  if (!url || !url.includes('images.unsplash.com')) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('w', String(width));
    parsed.searchParams.set('h', String(height));
    parsed.searchParams.set('fit', 'crop');
    parsed.searchParams.set('q', String(quality));
    parsed.searchParams.set('auto', 'format'); // let Unsplash serve WebP/AVIF when supported
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Rewrite a LoremFlickr URL (`/{w}/{h}/{tags}?lock=…`) to a specific size while
 * preserving the tags and `lock`, so the thumbnail shows the *same* photo as the
 * full image. Falls back to the original URL for any non-LoremFlickr source.
 */
export function resizeLoremFlickrUrl(url: string, width: number, height: number): string {
  if (!url || !url.includes('loremflickr.com')) return url;
  return url.replace(/(loremflickr\.com\/)\d+\/\d+/, `$1${width}/${height}`);
}

/** Small thumbnail used by list cards (~320×180). */
export function thumbnailUrl(url: string): string {
  if (url.includes('loremflickr.com')) return resizeLoremFlickrUrl(url, 320, 180);
  return resizeUnsplashUrl(url, 320, 180);
}

const preloaded = new Set<string>();

/**
 * Warm the browser cache for a single image without rendering it.
 * No-ops if the URL was already requested this session.
 */
export function preloadImage(src?: string): void {
  if (!src || preloaded.has(src)) return;
  preloaded.add(src);
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
}
