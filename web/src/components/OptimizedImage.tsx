import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from './classNames';

interface OptimizedImageProps {
  /** Full-resolution image URL. */
  src: string;
  /** Optional low-res placeholder shown (blurred) while `src` loads. */
  thumbnailSrc?: string;
  alt: string;
  /** Intrinsic width/height — used to reserve layout space (prevents CLS). */
  width: number;
  height: number;
  /** Eager + high fetch priority for above-the-fold / current images. */
  priority?: boolean;
  /** Applied to the wrapper (sizing, rounding, etc.). */
  className?: string;
  /** Shown when `src` fails to load. */
  fallbackSrc?: string;
}

/**
 * Drop-in <img> replacement that reserves space, shows a skeleton while
 * loading, fades in on load, and degrades to a fallback on error.
 *
 * Reserving the box via aspect-ratio keeps the layout stable, so the wrapper
 * needs a dynamic inline style (Tailwind can't express an arbitrary ratio).
 */
export const OptimizedImage = ({
  src,
  thumbnailSrc,
  alt,
  width,
  height,
  priority = false,
  className,
  fallbackSrc,
}: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  // 'primary' → 'fallback' → 'icon' as sources fail in turn.
  const [stage, setStage] = useState<'primary' | 'fallback' | 'icon'>('primary');

  const showPlaceholderIcon = stage === 'icon';
  const displaySrc = stage === 'fallback' && fallbackSrc ? fallbackSrc : src;

  const handleError = () => {
    setLoaded(false);
    setStage((prev) => (prev === 'primary' && fallbackSrc ? 'fallback' : 'icon'));
  };

  return (
    <div
      className={cn('relative overflow-hidden bg-slate-100 dark:bg-slate-800', className)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {/* Skeleton — visible until the image paints */}
      {!loaded && !showPlaceholderIcon && (
        <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-700" />
      )}

      {/* Blurred low-res preview while the full image loads */}
      {thumbnailSrc && !loaded && !showPlaceholderIcon && (
        <img
          src={thumbnailSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-105 object-cover blur-md"
          decoding="async"
        />
      )}

      {showPlaceholderIcon ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageOff className="h-10 w-10 text-slate-300 dark:text-slate-600" />
        </div>
      ) : (
        <img
          // Re-mount on src swap (e.g. fallback) so onLoad fires reliably.
          key={displaySrc}
          src={displaySrc}
          alt={alt}
          width={width}
          height={height}
          decoding="async"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
