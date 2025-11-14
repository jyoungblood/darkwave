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

/**
 * Checks if a file is an image based on its MIME type or file extension
 */
export function isImageFile(file: File): boolean {
  if (!file) {
    return false;
  }
  
  // Check MIME type first
  if (file.type && file.type.startsWith('image/')) {
    return true;
  }
  
  // Fallback: check file extension (useful when MIME type is missing/incorrect)
  if (file.name) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'tiff', 'tif'];
    return imageExtensions.includes(extension || '');
  }
  
  return false;
}

/**
 * Compresses and resizes an image to the specified format
 * Resizes to max 2048px width (if wider) without enlarging smaller images
 * @param file The image file to compress (File or Buffer)
 * @param format Optional output format. If not provided, detects from file extension (default: 'webp')
 * @param maxWidth Maximum width in pixels (default: 2048)
 * @param quality Compression quality 1-100 (default: 85). Higher values = better quality but larger files. Quality 85 is often the sweet spot for WebP - excellent quality with optimal file size.
 * @param lossless Use lossless compression for WebP (default: false). When true, quality parameter is ignored.
 * @returns Promise resolving to object with compressed buffer and format used, or null if not an image or compression fails
 */
export async function compressImage(
  file: File | Buffer,
  format?: 'webp' | 'jpeg' | 'jpg' | 'png' | 'avif' | 'tiff' | 'gif',
  maxWidth: number = 2048,
  quality: number = 85,
  lossless: boolean = false
): Promise<{ buffer: Buffer; format: string } | null> {
  try {
    let buffer: Buffer;
    let fileName: string | undefined;
    
    // Convert File to Buffer
    if (file instanceof File || (file as any) instanceof Blob) {
      fileName = (file as File).name;
      const arrayBuffer = await (file as Blob).arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      
      if (!buffer || buffer.length === 0) {
        console.error('Invalid buffer: empty or null');
        return null;
      }
    } else {
      buffer = file;
    }

    // Detect format from file extension if not provided
    let detectedFormat: 'webp' | 'jpeg' | 'jpg' | 'png' | 'avif' | 'tiff' | 'gif' = format || 'webp';
    
    if (!format && fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase();
      if (extension) {
        // Map common extensions to formats
        const extensionMap: Record<string, 'webp' | 'jpeg' | 'jpg' | 'png' | 'avif' | 'tiff' | 'gif'> = {
          'jpg': 'jpeg',
          'jpeg': 'jpeg',
          'png': 'png',
          'webp': 'webp',
          'avif': 'avif',
          'tiff': 'tiff',
          'tif': 'tiff',
          'gif': 'gif',
        };
        
        if (extensionMap[extension]) {
          detectedFormat = extensionMap[extension];
        }
      }
    }

    // Normalize jpg to jpeg for internal processing
    const normalizedFormat = detectedFormat === 'jpg' ? 'jpeg' : detectedFormat;

    // Import sharp dynamically (Node.js only)
    const sharp = (await import('sharp')).default;

    // Get image metadata to check dimensions
    let metadata;
    try {
      metadata = await sharp(buffer, { failOnError: false }).metadata();
    } catch (error) {
      console.error('Error reading image metadata:', error);
      return null;
    }
    
    // Check if it's actually an image
    if (!metadata || !metadata.width || !metadata.height) {
      console.error('Invalid image metadata:', metadata);
      return null;
    }

    // Resize if wider than maxWidth, without enlarging smaller images
    let sharpInstance = sharp(buffer);
    
    if (metadata.width > maxWidth) {
      sharpInstance = sharpInstance.resize({
        width: maxWidth,
        withoutEnlargement: true,
        fit: 'inside',
      });
    }

    // Convert to specified format with quality settings
    let formatInstance = sharpInstance;
    
    switch (normalizedFormat) {
      case 'webp':
        if (lossless) {
          formatInstance = formatInstance.webp({ lossless: true, effort: 6 });
        } else {
          // Use high quality with maximum compression effort for optimal file size
          // effort: 6 is maximum (0-6), trades processing time for better compression
          // Keeping it simple - nearLossless can actually increase file size in some cases
          formatInstance = formatInstance.webp({ 
            quality, 
            effort: 6
          });
        }
        break;
      case 'jpeg':
        formatInstance = formatInstance.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        formatInstance = formatInstance.png({ quality, compressionLevel: 9 });
        break;
      case 'avif':
        formatInstance = formatInstance.avif({ quality, effort: 4 });
        break;
      case 'tiff':
        formatInstance = formatInstance.tiff({ quality, compression: 'lzw' });
        break;
      case 'gif':
        formatInstance = formatInstance.gif();
        break;
      default:
        formatInstance = formatInstance.webp({ quality, effort: 6 });
    }

    const compressedBuffer = await formatInstance.toBuffer();

    // Return format normalized for file extension (jpg/jpeg both become 'jpeg')
    const extensionFormat = normalizedFormat;

    return { buffer: compressedBuffer, format: extensionFormat };
  } catch (error) {
    console.error('Error compressing image:', error);
    return null;
  }
}








/**
 * Determines the MIME type of an image based on its file extension
 * @param url The image URL or file path to analyze
 * @returns The corresponding MIME type string (e.g., 'image/jpeg', 'image/png')
 *          Returns 'image/jpeg' as fallback for empty URLs or unknown extensions
 */
export function getImageMimeType(url: string): string {
  if (!url) return 'image/jpeg'; // fallback

  const extension = url.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'bmp':
      return 'image/bmp';
    case 'tiff':
    case 'tif':
      return 'image/tiff';
    case 'ico':
      return 'image/x-icon';
    default:
      return 'image/jpeg'; // fallback to most common format
  }
}










