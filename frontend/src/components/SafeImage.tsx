import { useState, type ReactNode } from 'react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  /** Shown on top of the barber-stripe fallback when the image fails or is missing */
  fallback?: ReactNode;
  loading?: 'lazy' | 'eager';
}

/**
 * <img> that never shows a broken image: falls back to a dark barber-pole pattern.
 */
export default function SafeImage({ src, alt, className = '', fallback, loading = 'lazy' }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden bg-ink-700 ${className}`} role="img" aria-label={alt}>
        <div className="barber-stripes absolute inset-0 opacity-25" />
        <div className="absolute inset-0 bg-linear-to-br from-ink-900/70 via-ink-900/40 to-ink-900/80" />
        {fallback && <div className="relative">{fallback}</div>}
      </div>
    );
  }

  return <img src={src} alt={alt} loading={loading} onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}
