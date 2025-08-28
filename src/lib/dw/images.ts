import type { ImageTransformParams } from '@/pages/media/[...path]';

export interface SrcSetOptions {
  /** Base path to the image */
  path: string;
  /** Array of widths to generate srcset entries for */
  widths?: number[];
  /** Image format (defaults to webp) */
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  /** Fit mode for resizing */
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  /** Quality setting (1-100) */
  quality?: number;
  /** Position for crop/fit operations */
  position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center';
}

/**
 * Common width breakpoints for responsive images
 */
export const DEFAULT_WIDTHS = [320, 640, 768, 1024, 1280, 1536, 1920];

/**
 * Generate a srcset attribute string for responsive images
 */
export function generateSrcSet({
  path,
  widths = DEFAULT_WIDTHS,
  format = 'webp',
  fit = 'cover',
  quality = 80,
  position = 'center'
}: SrcSetOptions): string {
  // Sort widths in ascending order
  const sortedWidths = [...widths].sort((a, b) => a - b);
  
  // Generate srcset entries
  const entries = sortedWidths.map(width => {
    const params = new URLSearchParams({
      w: width.toString(),
      f: format,
      fit,
      q: quality.toString()
    });
    
    if (position !== 'center') {
      params.set('position', position);
    }
    
    return `/media/${path}?${params.toString()} ${width}w`;
  });
  
  return entries.join(', ');
}

/**
 * Generate a sizes attribute string based on common responsive breakpoints
 */
export function generateSizes(options: {
  /** Default width when no breakpoints match (e.g., '100vw', '300px') */
  defaultWidth?: string;
  /** Array of breakpoint configurations */
  breakpoints?: Array<{
    /** Media query min-width in pixels */
    minWidth: number;
    /** Width value (e.g., '50vw', '400px') */
    width: string;
  }>;
}): string {
  const { 
    defaultWidth = '100vw',
    breakpoints = [
      { minWidth: 1536, width: '33vw' },
      { minWidth: 1280, width: '50vw' },
      { minWidth: 1024, width: '66vw' },
      { minWidth: 768, width: '75vw' }
    ]
  } = options;
  
  // Sort breakpoints in descending order for correct media query priority
  const sortedBreakpoints = [...breakpoints].sort((a, b) => b.minWidth - a.minWidth);
  
  // Generate sizes entries
  const entries = sortedBreakpoints.map(({ minWidth, width }) => 
    `(min-width: ${minWidth}px) ${width}`
  );
  
  // Add default size
  entries.push(defaultWidth);
  
  return entries.join(', ');
}

/**
 * Generate both srcset and sizes attributes for an image
 */
export function generateResponsiveImageAttrs(
  srcSetOptions: SrcSetOptions,
  sizesOptions?: Parameters<typeof generateSizes>[0]
): {
  srcset: string;
  sizes: string;
} {
  return {
    srcset: generateSrcSet(srcSetOptions),
    sizes: generateSizes(sizesOptions || {})
  };
}

/**
 * Helper to generate a single image URL with transforms
 */
export function generateImageUrl(
  path: string,
  params: Partial<ImageTransformParams>
): string {
  const searchParams = new URLSearchParams();
  
  if (params.w) searchParams.set('w', params.w.toString());
  if (params.h) searchParams.set('h', params.h.toString());
  if (params.f) searchParams.set('f', params.f);
  if (params.fit) searchParams.set('fit', params.fit);
  if (params.q) searchParams.set('q', params.q.toString());
  if (params.position && params.position !== 'center') {
    searchParams.set('position', params.position);
  }
  
  const query = searchParams.toString();
  return `/media/${path}${query ? `?${query}` : ''}`;
}
