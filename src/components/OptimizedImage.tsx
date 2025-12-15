import React, { useState } from 'react';

const R2_PUBLIC_URL = 'https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  size?: 'thumb' | 'medium' | 'large' | 'auto';
  loading?: 'lazy' | 'eager';
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLImageElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLImageElement>) => void;
}

/**
 * OptimizedImage component that:
 * - Uses WebP format with JPEG fallback
 * - Supports responsive image sizes (thumb, medium, large)
 * - Lazy loads by default
 * - Falls back gracefully if optimized versions don't exist
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  style,
  size = 'auto',
  loading = 'lazy',
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [imgError, setImgError] = useState(false);

  // Get the public URL for a file key
  const getPublicUrl = (fileKey: string) => {
    if (!fileKey) return '';
    // If it's already a full URL, return as-is
    if (fileKey.startsWith('http')) return fileKey;
    // Extract filename and build R2 URL
    const filename = fileKey.split('/').pop();
    return `${R2_PUBLIC_URL}/${filename}`;
  };

  // Generate optimized image URL based on size
  const getOptimizedUrl = (originalUrl: string, targetSize: string) => {
    if (!originalUrl || imgError) return getPublicUrl(originalUrl);
    
    // Remove extension and add size suffix
    const urlWithoutExt = originalUrl.replace(/\.[^/.]+$/, '');
    const suffix = targetSize === 'thumb' ? '-thumb' : targetSize === 'medium' ? '-medium' : '-large';
    
    return getPublicUrl(`${urlWithoutExt}${suffix}.webp`);
  };

  // Generate srcset for responsive images
  const generateSrcSet = (originalUrl: string) => {
    if (!originalUrl || imgError) return undefined;
    
    const urlWithoutExt = originalUrl.replace(/\.[^/.]+$/, '');
    const baseUrl = getPublicUrl(urlWithoutExt);
    
    return `${baseUrl}-thumb.webp 200w, ${baseUrl}-medium.webp 600w, ${baseUrl}-large.webp 1200w`;
  };

  // Generate sizes attribute based on size prop
  const getSizes = () => {
    switch (size) {
      case 'thumb':
        return '200px';
      case 'medium':
        return '600px';
      case 'large':
        return '1200px';
      case 'auto':
      default:
        return '(max-width: 640px) 200px, (max-width: 1024px) 600px, 1200px';
    }
  };

  // Determine the primary src based on size
  const getPrimarySrc = () => {
    if (imgError) return getPublicUrl(src);
    
    if (size === 'auto') {
      // For auto, use the large version as default
      return getOptimizedUrl(src, 'large');
    }
    return getOptimizedUrl(src, size);
  };

  const handleError = () => {
    // Fall back to original image if optimized version fails
    setImgError(true);
  };

  return (
    <img
      src={imgError ? getPublicUrl(src) : getPrimarySrc()}
      srcSet={!imgError && size === 'auto' ? generateSrcSet(src) : undefined}
      sizes={!imgError && size === 'auto' ? getSizes() : undefined}
      alt={alt}
      loading={loading}
      className={className}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onError={handleError}
    />
  );
};

export default OptimizedImage;
