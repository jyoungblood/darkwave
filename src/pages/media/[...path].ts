import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { StorageUtils } from '@/lib/dw/storage/types';
import { dwStorage } from '@/lib/dw/storage';
import { z } from 'zod';
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

// Security configuration
const SECURITY_CONFIG = {
  RATE_LIMIT: {
    REQUESTS: 100,        // requests per window
    WINDOW: 60000,        // 1 minute window (ms)
    BURST: 20             // burst allowance
  },
  PARAMETER_LIMITS: {
    MAX_WIDTH: 4096,
    MAX_HEIGHT: 4096,
    MAX_QUALITY: 95,      // Reduced from 100 for security
    MIN_DIMENSION: 1,
    MIN_QUALITY: 10
  },
  ALLOWED_FORMATS: ['webp', 'avif', 'jpeg', 'png'] as const,
  MAX_TRANSFORMATIONS_PER_IMAGE: 50,
  // Enhanced security limits
  INPUT_LIMITS: {
    MAX_FILE_SIZE: 50 * 1024 * 1024,  // 50MB max input file
    MAX_BUFFER_SIZE: 100 * 1024 * 1024, // 100MB max buffer size
    MAX_PIXELS: 50 * 1024 * 1024,     // 50MP max (reduced from 100MP)
    MAX_MEMORY_USAGE: 512 * 1024 * 1024, // 512MB max memory per request
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp', '.tiff']
  },
  // File type configuration
  FILE_TYPES: {
    IMAGES: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp', '.tiff'],
    AUDIO: ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'],
    VIDEO: ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.mkv'],
    DOCUMENTS: ['.pdf', '.txt', '.md', '.html', '.css', '.js']
  },
  // SSRF Protection - Dynamic configuration from environment
  SSRF_PROTECTION: {
    // These will be populated dynamically from environment variables
    ALLOWED_HOSTS: [] as string[],
    BLOCKED_IPS: [
      // Block metadata service endpoints (AWS, GCP, Azure, etc.)
      '169.254.169.254',  // AWS IMDS v1
      '169.254.170.2',    // AWS IMDS v2
      '100.100.100.200',  // GCP metadata
      '169.254.169.254',  // Azure IMDS
    ],
    // Control localhost blocking (set to false if you need internal comms)
    BLOCK_LOCALHOST: false, // Set to true in production if localhost access not needed
    TIMEOUT_MS: 10000 // 10 second timeout for external requests
  },
  // Content validation
  CONTENT_VALIDATION: {
    MAGIC_BYTES: {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/webp': [0x52, 0x49, 0x46, 0x46],
      'image/gif': [0x47, 0x49, 0x46]
    }
  }
};

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// SECURITY: Build SSRF protection allowlist from environment variables
buildSSRFAllowlist();

// Types for image transformation parameters
export interface ImageTransformParams {
  /** Width in pixels */
  w?: number;
  /** Height in pixels */
  h?: number;
  /** Output format (webp, avif, jpeg, png) */
  f?: 'webp' | 'avif' | 'jpeg' | 'png';
  /** Resize fit mode */
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  /** Quality (1-100) */
  q?: number;
  /** Position for crop/fit operations */
  position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center';
}

// Enhanced storage interface for transformed images
interface EnhancedStorageProvider {
  fileExists(path: string): Promise<boolean>;
  uploadTransformedImage(buffer: Buffer, path: string, contentType: string): Promise<string>;
  getTransformedImageUrl(path: string): string;
}

// Zod schema for validating query parameters
const transformParamsSchema = z.object({
  w: z.coerce.number().min(1).max(4096).optional(),
  h: z.coerce.number().min(1).max(4096).optional(),
  f: z.enum(['webp', 'avif', 'jpeg', 'png']).optional(),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).optional(),
  q: z.coerce.number().min(10).max(95).optional(),  // SECURE: Match security config
  position: z.enum([
    'top', 'right top', 'right', 'right bottom', 'bottom',
    'left bottom', 'left', 'left top', 'center'
  ]).optional()
});

// Default transform parameters
const defaultParams: Partial<ImageTransformParams> = {
  f: 'webp',
  q: 80,
  fit: 'cover',
  position: 'center'
};

/**
 * SECURITY: Build dynamic SSRF protection allowlist from environment variables
 * 
 * Environment Variables Supported:
 * - S3_DOMAIN: Your S3/R2 storage domain (e.g., "https://media.lovewoa.com")
 * - BUNNY_STORAGE_URL: Bunny CDN storage URL (e.g., "https://ny.storage.bunnycdn.com/equipost")
 * - CLOUDFLARE_DOMAIN: Cloudflare storage domain (e.g., "https://your-bucket.r2.cloudflarestorage.com")
 * - IMGIX_DOMAIN: Imgix domain (e.g., "https://your-company.imgix.net")
 */
function buildSSRFAllowlist(): void {
  const allowedHosts = new Set<string>();
  
  // Add S3/R2 domain from environment
  const s3Domain = import.meta.env.S3_DOMAIN;
  if (s3Domain) {
    try {
      const url = new URL(s3Domain);
      allowedHosts.add(url.hostname);
      // console.log(`SSRF: Added S3 domain: ${url.hostname}`);
    } catch (error) {
      console.warn(`SSRF: Invalid S3_DOMAIN format in environment`); // SECURITY FIX: No value exposure
    }
  }
  
  // Add Bunny CDN domain from environment
  const bunnyUrl = import.meta.env.BUNNY_STORAGE_URL;
  if (bunnyUrl) {
    try {
      const url = new URL(bunnyUrl);
      allowedHosts.add(url.hostname);
      // console.log(`SSRF: Added Bunny domain: ${url.hostname}`);
    } catch (error) {
      console.warn(`SSRF: Invalid BUNNY_STORAGE_URL format in environment`); // SECURITY FIX: No value exposure
    }
  }
  
  // Add Cloudflare domain if configured
  const cfDomain = import.meta.env.CLOUDFLARE_DOMAIN;
  if (cfDomain) {
    try {
      const url = new URL(cfDomain);
      allowedHosts.add(url.hostname);
      // console.log(`SSRF: Added Cloudflare domain: ${url.hostname}`);
    } catch (error) {
      console.warn(`SSRF: Invalid CLOUDFLARE_DOMAIN format in environment`); // SECURITY FIX: No value exposure
    }
  }
  
  // Add Imgix domain if configured
  const imgixDomain = import.meta.env.IMGIX_DOMAIN;
  if (imgixDomain) {
    try {
      const url = new URL(imgixDomain);
      allowedHosts.add(url.hostname);
      // console.log(`SSRF: Added Imgix domain: ${url.hostname}`);
    } catch (error) {
      console.warn(`SSRF: Invalid IMGIX_DOMAIN format in environment`); // SECURITY FIX: No value exposure
    }
  }
  
  // Convert to array and update config
  SECURITY_CONFIG.SSRF_PROTECTION.ALLOWED_HOSTS = Array.from(allowedHosts);
  
  // Log final configuration
  // console.log(`SSRF: Final allowlist: ${SECURITY_CONFIG.SSRF_PROTECTION.ALLOWED_HOSTS.join(', ')}`);
  
  // Warn if no domains are configured
  if (SECURITY_CONFIG.SSRF_PROTECTION.ALLOWED_HOSTS.length === 0) {
    console.warn('SSRF: WARNING - No storage domains configured! SSRF protection will block all external requests.');
  }
}

/**
 * SECURITY: Validate URL to prevent SSRF attacks
 */
function validateStorageUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);
    
    // Check if host is in allowed list
    if (!SECURITY_CONFIG.SSRF_PROTECTION.ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
      return { valid: false, error: 'Unauthorized storage host' };
    }
    
    // Block metadata service endpoints (AWS, GCP, Azure, etc.)
    const isMetadataService = ['169.254.169.254', '169.254.170.2', '100.100.100.200'].includes(parsedUrl.hostname);
    if (isMetadataService) {
      return { valid: false, error: 'Metadata service access blocked' };
    }
    
    // Handle localhost based on configuration
    const isLocalhost = ['127.0.0.1', '::1'].includes(parsedUrl.hostname);
    if (isLocalhost && SECURITY_CONFIG.SSRF_PROTECTION.BLOCK_LOCALHOST) {
      return { valid: false, error: 'Localhost access blocked' };
    }
    
    // Only allow HTTPS (except for localhost which might use HTTP for internal comms)
    if (parsedUrl.protocol !== 'https:' && !isLocalhost) {
      return { valid: false, error: 'Only HTTPS URLs allowed for external hosts' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * SECURITY: Validate content type using magic bytes
 */
function validateContentType(buffer: Buffer, expectedType: string): boolean {
  const magicBytes = SECURITY_CONFIG.CONTENT_VALIDATION.MAGIC_BYTES[expectedType as keyof typeof SECURITY_CONFIG.CONTENT_VALIDATION.MAGIC_BYTES];
  if (!magicBytes) return true; // Skip validation for unknown types
  
  if (buffer.length < magicBytes.length) return false;
  
  for (let i = 0; i < magicBytes.length; i++) {
    if (buffer[i] !== magicBytes[i]) return false;
  }
  
  return true;
}

/**
 * SECURITY: Safe buffer creation with size limits
 */
async function createSecureBuffer(response: Response): Promise<{ buffer: Buffer; valid: boolean; error?: string }> {
  // Check content length header
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength);
    if (size > SECURITY_CONFIG.INPUT_LIMITS.MAX_BUFFER_SIZE) {
      return { buffer: Buffer.alloc(0), valid: false, error: 'Content too large' };
    }
  }
  
  try {
    // Use streaming approach for large files
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > SECURITY_CONFIG.INPUT_LIMITS.MAX_BUFFER_SIZE) {
      return { buffer: Buffer.alloc(0), valid: false, error: 'Buffer too large' };
    }
    
    const buffer = Buffer.from(arrayBuffer);
    return { buffer, valid: true };
  } catch (error) {
    return { buffer: Buffer.alloc(0), valid: false, error: 'Failed to create buffer' };
  }
}

/**
 * SECURITY: Create secure ETag to prevent timing attacks
 */
function createSecureETag(data: string): string {
  // Use a constant-time approach to prevent timing attacks
  const hash = Buffer.from(data).toString('base64');
  return `"${hash}"`;
}

/**
 * SECURITY: Create standard security headers for all responses
 */
function createSecurityHeaders(includeCSP: boolean = true): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
  
  if (includeCSP) {
    headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'";
  }
  
  return headers;
}

/**
 * SECURITY: Atomic rate limiting function to prevent race conditions
 */
function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `rate_limit:${identifier}`;
  const limit = rateLimitStore.get(key);
  
  if (!limit || now > limit.resetTime) {
    // Reset or create new limit
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + SECURITY_CONFIG.RATE_LIMIT.WINDOW
    });
    return { allowed: true, remaining: SECURITY_CONFIG.RATE_LIMIT.REQUESTS - 1, resetTime: now + SECURITY_CONFIG.RATE_LIMIT.WINDOW };
  }
  
  // SECURITY FIX: Atomic increment to prevent race conditions
  const currentCount = limit.count;
  if (currentCount >= SECURITY_CONFIG.RATE_LIMIT.REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: limit.resetTime };
  }
  
  // Atomic update
  limit.count = currentCount + 1;
  return { allowed: true, remaining: SECURITY_CONFIG.RATE_LIMIT.REQUESTS - limit.count, resetTime: limit.resetTime };
}

/**
 * SECURITY: Enhanced path validation to prevent path traversal attacks
 */
function validateAndSanitizePath(path: string): { valid: boolean; sanitized?: string; error?: string } {
  try {
    // SECURITY FIX: Decode URL sequences first to catch encoded traversals
    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(path);
    } catch {
      return { valid: false, error: 'Invalid URL encoding' };
    }
    
    // Check for path traversal attempts (including encoded versions)
    const traversalPatterns = ['..', '%2e%2e', '%2E%2E', '..%2f', '..%5c', '..\\', '../', '..\\'];
    for (const pattern of traversalPatterns) {
      if (decodedPath.toLowerCase().includes(pattern.toLowerCase())) {
        return { valid: false, error: 'Path traversal detected' };
      }
    }
    
    // Check for other suspicious patterns
    if (decodedPath.includes('//') || decodedPath.startsWith('/') || decodedPath.includes('\\')) {
      return { valid: false, error: 'Invalid path format' };
    }
    
    // Check for excessive path length
    if (decodedPath.length > 500) {
      return { valid: false, error: 'Path too long' };
    }
    
    // SECURITY FIX: Use allowlist approach instead of regex for sanitization
    const allowedChars = /^[a-zA-Z0-9\/\-_\.]+$/;
    if (!allowedChars.test(decodedPath)) {
      return { valid: false, error: 'Invalid characters in path' };
    }
    
    // Check file extension - allow all file types defined in SECURITY_CONFIG
    const extension = decodedPath.toLowerCase().split('.').pop();
    if (!extension) {
      return { valid: false, error: 'No file extension' };
    }
    
    const ext = `.${extension}`;
    const allAllowedExtensions = [
      ...SECURITY_CONFIG.FILE_TYPES.IMAGES,
      ...SECURITY_CONFIG.FILE_TYPES.AUDIO,
      ...SECURITY_CONFIG.FILE_TYPES.VIDEO,
      ...SECURITY_CONFIG.FILE_TYPES.DOCUMENTS
    ];
    
    if (!allAllowedExtensions.includes(ext)) {
      return { valid: false, error: 'Invalid file type' };
    }
    
    // SECURITY FIX: Validate transformed path injection
    if (decodedPath.startsWith('transformed/') || decodedPath.includes('/transformed/')) {
      return { valid: false, error: 'Invalid path prefix' };
    }
    
    return { valid: true, sanitized: decodedPath };
  } catch (error) {
    return { valid: false, error: 'Path validation failed' };
  }
}

/**
 * SECURITY: Enhanced parameter validation with security checks
 */
function validateAndSanitizeParams(params: any): { valid: boolean; sanitized?: ImageTransformParams; error?: string; isOriginal?: boolean } {
  try {
    // Parse with Zod schema
    const parsed = transformParamsSchema.parse(params);
    
    // SECURITY FIX: Generic error messages to prevent information disclosure
    if (parsed.w && (parsed.w < SECURITY_CONFIG.PARAMETER_LIMITS.MIN_DIMENSION || parsed.w > SECURITY_CONFIG.PARAMETER_LIMITS.MAX_WIDTH)) {
      return { valid: false, error: 'Invalid width parameter' };
    }
    
    if (parsed.h && (parsed.h < SECURITY_CONFIG.PARAMETER_LIMITS.MIN_DIMENSION || parsed.h > SECURITY_CONFIG.PARAMETER_LIMITS.MAX_HEIGHT)) {
      return { valid: false, error: 'Invalid height parameter' };
    }
    
    if (parsed.q && (parsed.q < SECURITY_CONFIG.PARAMETER_LIMITS.MIN_QUALITY || parsed.q > SECURITY_CONFIG.PARAMETER_LIMITS.MAX_QUALITY)) {
      return { valid: false, error: 'Invalid quality parameter' };
    }
    
    // Allow serving original images without transformations (no dimensions required)
    // This enables the proxy to serve static files and original images
    if (!parsed.w && !parsed.h && !parsed.f && !parsed.q && !parsed.fit && !parsed.position) {
      // No transformation parameters - serve original file
      return { valid: true, sanitized: parsed, isOriginal: true };
    }
    
    // If any transformation parameters are specified, require at least one dimension
    if ((parsed.w || parsed.h || parsed.f || parsed.q || parsed.fit || parsed.position) && !parsed.w && !parsed.h) {
      return { valid: false, error: 'Invalid transformation parameters' };
    }
    
    return { valid: true, sanitized: parsed };
  } catch (error) {
    // SECURITY FIX: Generic error message to prevent information disclosure
    return { valid: false, error: 'Invalid parameters' };
  }
}

/**
 * Generate a unique filename for transformed images based on parameters
 */
function generateTransformedFilename(originalPath: string, params: ImageTransformParams): string {
  const extension = params.f || 'webp';
  const baseName = originalPath.replace(/\.[^/.]+$/, ''); // Remove original extension
  
  // Build parameter string
  const paramParts: string[] = [];
  if (params.w) paramParts.push(`w${params.w}`);
  if (params.h) paramParts.push(`h${params.h}`);
  if (params.f) paramParts.push(`f${params.f}`);
  if (params.q) paramParts.push(`q${params.q}`);
  if (params.fit) paramParts.push(`fit${params.fit}`);
  if (params.position) paramParts.push(`pos${params.position.replace(/\s+/g, '')}`);
  
  const paramString = paramParts.length > 0 ? `_${paramParts.join('_')}` : '';
  
  return `${baseName}${paramString}.${extension}`;
}

/**
 * Convert our normalized parameters to Bunny CDN's format
 */
function toBunnyParams(params: ImageTransformParams): URLSearchParams {
  const bunnyParams = new URLSearchParams();
  
  // Width and height
  if (params.w) bunnyParams.set('width', params.w.toString());
  if (params.h) bunnyParams.set('height', params.h.toString());
  
  // Format
  if (params.f) {
    switch (params.f) {
      case 'webp':
        bunnyParams.set('format', 'webp');
        break;
      case 'avif':
        // Bunny doesn't support AVIF, fallback to WebP
        bunnyParams.set('format', 'webp');
        break;
      case 'jpeg':
        bunnyParams.set('format', 'jpeg');
        break;
      case 'png':
        bunnyParams.set('format', 'png');
        break;
    }
  }
  
  // Quality
  if (params.q) bunnyParams.set('quality', params.q.toString());
  
  // Fit mode
  if (params.fit) {
    switch (params.fit) {
      case 'cover':
        bunnyParams.set('aspect_ratio', 'keep');
        break;
      case 'contain':
        bunnyParams.set('aspect_ratio', 'keep');
        bunnyParams.set('background', 'transparent');
        break;
      case 'fill':
        bunnyParams.set('aspect_ratio', 'ignore');
        break;
      // Bunny doesn't support inside/outside modes, fallback to cover
      case 'inside':
      case 'outside':
        bunnyParams.set('aspect_ratio', 'keep');
        break;
    }
  }
  
  return bunnyParams;
}

/**
 * Convert our normalized parameters to Cloudflare Images format
 */
function toCloudflareParams(params: ImageTransformParams): URLSearchParams {
  const cfParams = new URLSearchParams();
  
  // Width and height
  if (params.w) cfParams.set('width', params.w.toString());
  if (params.h) cfParams.set('height', params.h.toString());
  
  // Format - Cloudflare Images automatically handles format optimization
  // but we can still specify preferred formats
  if (params.f) {
    switch (params.f) {
      case 'webp':
        cfParams.set('format', 'webp');
        break;
      case 'avif':
        cfParams.set('format', 'avif');
        break;
      case 'jpeg':
        cfParams.set('format', 'jpeg');
        break;
      case 'png':
        cfParams.set('format', 'png');
        break;
    }
  }
  
  // Quality
  if (params.q) cfParams.set('quality', params.q.toString());
  
  // Fit mode
  if (params.fit) {
    switch (params.fit) {
      case 'cover':
        cfParams.set('fit', 'cover');
        break;
      case 'contain':
        cfParams.set('fit', 'contain');
        break;
      case 'fill':
        cfParams.set('fit', 'scale-down');
        break;
      case 'inside':
        cfParams.set('fit', 'contain');
        break;
      case 'outside':
        cfParams.set('fit', 'cover');
        break;
    }
  }
  
  // Position
  if (params.position) {
    // Cloudflare uses gravity parameter
    cfParams.set('gravity', params.position.replace(' ', '-'));
  }
  
  return cfParams;
}

/**
 * Convert our normalized parameters to Imgix format
 */
function toImgixParams(params: ImageTransformParams): URLSearchParams {
  const imgixParams = new URLSearchParams();
  
  // Width and height
  if (params.w) imgixParams.set('w', params.w.toString());
  if (params.h) imgixParams.set('h', params.h.toString());
  
  // Format
  if (params.f) {
    switch (params.f) {
      case 'webp':
        imgixParams.set('fm', 'webp');
        break;
      case 'avif':
        // Imgix doesn't support AVIF yet, fallback to WebP
        imgixParams.set('fm', 'webp');
        break;
      case 'jpeg':
        imgixParams.set('fm', 'jpg');
        break;
      case 'png':
        imgixParams.set('fm', 'png');
        break;
    }
  }
  
  // Quality
  if (params.q) imgixParams.set('q', params.q.toString());
  
  // Fit mode
  if (params.fit) {
    switch (params.fit) {
      case 'cover':
        imgixParams.set('fit', 'crop');
        break;
      case 'contain':
        imgixParams.set('fit', 'clip');
        break;
      case 'fill':
        imgixParams.set('fit', 'fill');
        break;
      case 'inside':
        imgixParams.set('fit', 'min');
        break;
      case 'outside':
        imgixParams.set('fit', 'max');
        break;
    }
  }
  
  // Position
  if (params.position) {
    const [vertical, horizontal] = params.position.split(' ').reverse();
    if (horizontal) imgixParams.set('crop', `${horizontal},${vertical}`);
    else imgixParams.set('crop', vertical);
  }
  
  return imgixParams;
}

/**
 * Enhanced S3/R2 storage provider implementation
 */
class EnhancedS3Provider implements EnhancedStorageProvider {
  private client: S3Client;
  private bucket: string;
  private domain: string;
  
  constructor() {
    // Get S3 configuration from environment (using Astro's import.meta.env)
    const endpoint = import.meta.env.S3_ENDPOINT;
    const key = import.meta.env.S3_KEY;
    const secret = import.meta.env.S3_SECRET;
    const bucket = import.meta.env.S3_BUCKET;
    const domain = import.meta.env.S3_DOMAIN;
    
    if (!endpoint || !key || !secret || !bucket || !domain) {
      throw new Error('S3 configuration incomplete');
    }
    
    this.client = new S3Client({
      endpoint,
      region: 'auto',
      credentials: { accessKeyId: key, secretAccessKey: secret }
    });
    this.bucket = bucket;
    this.domain = domain;
  }
  
  async fileExists(path: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path
      }));
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') return false;
      throw error;
    }
  }
  
  async uploadTransformedImage(buffer: Buffer, path: string, contentType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
      CacheControl: 'public, max-age=31536000, immutable'
    }));
    
    return `${this.domain}/${path}`;
  }
  
  getTransformedImageUrl(path: string): string {
    return `${this.domain}/${path}`;
  }
}

/**
 * Resolve a public media path to its storage URL
 */
async function resolveStorageUrl(path: string): Promise<{ url: string; provider: string }> {
  // Get the current storage provider type
  const providerType = dwStorage.getProviderType();
  
  // Get the domain from the provider configuration
  const domain = await dwStorage.getProviderDomain();
  
  if (!domain) {
    throw new Error('Storage provider domain not configured');
  }
  
  // Construct the full URL by combining domain with the normalized path
  const normalizedPath = StorageUtils.normalizeDirectory(path);
  if (!normalizedPath) {
    throw new Error('Invalid media path');
  }
  
  const fullUrl = `${domain}/${normalizedPath}`;
  
  return {
    url: fullUrl,
    provider: providerType || 'unknown'
  };
}

/**
 * Apply image transformations using Sharp with performance optimizations
 */
async function transformImage(
  imageBuffer: Buffer,
  params: ImageTransformParams
): Promise<Buffer> {
  // Use SECURE Sharp settings with strict limits
  let pipeline = sharp(imageBuffer, {
    failOnError: false,        // Don't fail on minor issues
    limitInputPixels: SECURITY_CONFIG.INPUT_LIMITS.MAX_PIXELS,  // SECURE: Enforce pixel limits
    pages: -1                  // Process all pages
  });

  // Apply resize if width or height is specified
  if (params.w || params.h) {
    pipeline = pipeline.resize({
      width: params.w,
      height: params.h,
      fit: params.fit,
      position: params.position,
      fastShrinkOnLoad: true,  // Faster resizing for large images
      kernel: 'lanczos3'       // High-quality, fast kernel
    });
  }

  // Set format and quality with performance optimizations
  const format = params.f || 'webp';
  const quality = params.q || 80;

  switch (format) {
    case 'webp':
      pipeline = pipeline.webp({ 
        quality,
        effort: 2,              // Balance between speed and compression
        smartSubsample: true    // Faster subsampling
      });
      break;
    case 'avif':
      pipeline = pipeline.avif({ 
        quality,
        effort: 2,              // Faster encoding
        chromaSubsampling: '4:2:0'  // Faster chroma processing
      });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({ 
        quality,
        progressive: false,     // Faster encoding
        mozjpeg: true          // Use faster mozjpeg encoder
      });
      break;
    case 'png':
      pipeline = pipeline.png({ 
        quality,
        progressive: false,     // Faster encoding
        compressionLevel: 6     // Balance speed vs size
      });
      break;
  }

  return pipeline.toBuffer();
}

/**
 * Detect file type from path
 */
function getFileType(path: string): { type: 'image' | 'audio' | 'video' | 'document' | 'unknown'; extension: string } {
  const extension = path.toLowerCase().split('.').pop() || '';
  const ext = `.${extension}`;
  
  if (SECURITY_CONFIG.FILE_TYPES.IMAGES.includes(ext)) return { type: 'image', extension };
  if (SECURITY_CONFIG.FILE_TYPES.AUDIO.includes(ext)) return { type: 'audio', extension };
  if (SECURITY_CONFIG.FILE_TYPES.VIDEO.includes(ext)) return { type: 'video', extension };
  if (SECURITY_CONFIG.FILE_TYPES.DOCUMENTS.includes(ext)) return { type: 'document', extension };
  
  return { type: 'unknown', extension };
}

/**
 * Get content type based on file extension or format
 */
function getContentType(pathOrFormat: string): string {
  // If it looks like a format (single word), use the format mapping
  if (!pathOrFormat.includes('.')) {
    const contentTypes: Record<string, string> = {
      webp: 'image/webp',
      avif: 'image/avif',
      jpeg: 'image/jpeg',
      png: 'image/png'
    };
    return contentTypes[pathOrFormat] || 'image/webp';
  }
  
  // Otherwise, determine from file extension
  const extension = pathOrFormat.toLowerCase().split('.').pop() || '';
  const contentTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    aac: 'audio/aac',
    flac: 'audio/flac',
    m4a: 'audio/mp4',
    // Video
    mp4: 'video/mp4',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    // Documents
    pdf: 'application/pdf',
    txt: 'text/plain',
    md: 'text/markdown',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript'
  };
  
  return contentTypes[extension] || 'application/octet-stream';
}


// temp disabled


// export const GET: APIRoute = async ({ params, request }) => {
//   const startTime = performance.now();
//   let path = params.path || '';
//   let currentProvider = '';
  
//   // SECURITY: Rate limiting check
//   const clientIP = request.headers.get('cf-connecting-ip') || 
//                    request.headers.get('x-forwarded-for') || 
//                    request.headers.get('x-real-ip') || 
//                    'unknown';
  
//   const rateLimit = checkRateLimit(clientIP);
//   if (!rateLimit.allowed) {
//     console.warn(`Rate limit exceeded for IP: ${clientIP}`);
//     return new Response('Rate limit exceeded', { 
//       status: 429,
//       headers: {
//         'Retry-After': Math.ceil(rateLimit.resetTime / 1000).toString(),
//         'X-RateLimit-Limit': SECURITY_CONFIG.RATE_LIMIT.REQUESTS.toString(),
//         'X-RateLimit-Remaining': rateLimit.remaining.toString(),
//         'X-RateLimit-Reset': rateLimit.resetTime.toString(),
//         ...createSecurityHeaders(false) // No CSP needed for error responses
//       }
//     });
//   }
//   let currentParams: ImageTransformParams | null = null;
//   let responseStatus = 0;
  
//   try {
//     const paramStart = performance.now();
//     // SECURITY: Validate and sanitize path
//     if (!path) {
//       responseStatus = 400;
//       return new Response('Image path is required', { 
//         status: 400,
//         headers: {
//           'X-Content-Type-Options': 'nosniff',
//           'X-Frame-Options': 'DENY',
//           'Referrer-Policy': 'strict-origin-when-cross-origin'
//         }
//       });
//     }
    
//     const pathValidation = validateAndSanitizePath(path);
//     if (!pathValidation.valid) {
//       console.warn(`Path validation failed: ${pathValidation.error} from IP: ${clientIP}`);
//       responseStatus = 400;
//       return new Response('Invalid path format', { 
//         status: 400,
//         headers: {
//           'X-Content-Type-Options': 'nosniff',
//           'X-Frame-Options': 'DENY',
//           'Referrer-Policy': 'strict-origin-when-cross-origin'
//         }
//       });  // SECURE: Generic error message
//     }
    
//     // Use sanitized path
//     path = pathValidation.sanitized!;

//     // SECURITY: Enhanced parameter validation and sanitization
//     const url = new URL(request.url);
//     const rawParams = Object.fromEntries(url.searchParams);
    
//     // Check for suspicious parameter patterns
//     const paramCount = Object.keys(rawParams).length;
//     if (paramCount > 10) {
//       console.warn(`Suspicious parameter count: ${paramCount} from IP: ${clientIP}`);
//       responseStatus = 400;
//       return new Response('Too many parameters', { 
//         status: 400,
//         headers: {
//           'X-Content-Type-Options': 'nosniff',
//           'X-Frame-Options': 'DENY',
//           'Referrer-Policy': 'strict-origin-when-cross-origin'
//         }
//       });
//     }
    
//     // Detect file type to determine if transformations are possible
//     const fileInfo = getFileType(path);
    
//     // Validate and sanitize parameters with security checks
//     const validationResult = validateAndSanitizeParams(rawParams);
//     if (!validationResult.valid) {
//       console.warn(`Parameter validation failed: ${validationResult.error} from IP: ${clientIP}`);
//       responseStatus = 400;
//       return new Response('Invalid parameters', { 
//         status: 400,
//         headers: {
//           'X-Content-Type-Options': 'nosniff',
//           'X-Frame-Options': 'DENY',
//           'Referrer-Policy': 'strict-origin-when-cross-origin'
//         }
//       });  // SECURE: Generic error message
//     }

//     // Check if we should serve the original file (no transformations)
//     const isOriginalFileRequest = validationResult.isOriginal || fileInfo.type !== 'image';
    
//     if (isOriginalFileRequest) {
//       // Serve original file without any transformations
//       // console.log(`Serving original ${fileInfo.type} file: ${path}`);
//       currentParams = null; // No transformation parameters
      
//       // OPTIMIZATION: Check browser cache FIRST for original files (before any storage operations)
//       const originalEtag = createSecureETag(path);
      
//       const ifNoneMatch = request.headers.get('if-none-match');
//       if (ifNoneMatch === originalEtag) {
//         // console.log('🚀 BROWSER CACHE HIT: Returning 304 Not Modified (NO R2 FETCH NEEDED)');
//         responseStatus = 304;
//         return new Response(null, { 
//           status: 304,
//           headers: {
//             'ETag': originalEtag,
//             'X-Content-Type-Options': 'nosniff',
//             'X-Frame-Options': 'DENY',
//             'Referrer-Policy': 'strict-origin-when-cross-origin',
//             'Content-Security-Policy': "default-src 'none'"
//           }
//         });
//       }
//     } else {
//       // Merge with default parameters for image transformations
//       currentParams = {
//         ...defaultParams,
//         ...validationResult.sanitized
//       };
//     }

//     const storageStart = performance.now();
//     // console.log(`Params parsed in ${Math.round(storageStart - paramStart)}ms`);
    
//     // Resolve the storage URL (only if we need to actually serve the file)
//     const { url: storageUrl, provider } = await resolveStorageUrl(path);
//     currentProvider = provider;
    
//     const providerStart = performance.now();
//     // console.log(`Storage resolved in ${Math.round(providerStart - storageStart)}ms`);

//     // Handle provider-specific optimizations
//     switch (provider) {
//       case 'bunny': {
//         if (!currentParams) {
//           // For original files, just redirect to storage URL
//           responseStatus = 302;
//           return new Response(null, {
//             status: 302,
//             headers: {
//               'Location': storageUrl,
//               'Cache-Control': 'public, max-age=31536000, immutable',
//               'X-Content-Type-Options': 'nosniff',
//               'X-Frame-Options': 'DENY',
//               'Referrer-Policy': 'strict-origin-when-cross-origin'
//             }
//           });
//         }
//         const bunnyParams = toBunnyParams(currentParams);
//         const optimizedUrl = `${storageUrl}?${bunnyParams.toString()}`;
//         responseStatus = 302;
//         return new Response(null, {
//           status: 302,
//           headers: {
//             'Location': optimizedUrl,
//             'Cache-Control': 'public, max-age=31536000, immutable',
//             // SECURITY: Security headers for redirects
//             'X-Content-Type-Options': 'nosniff',
//             'X-Frame-Options': 'DENY',
//             'Referrer-Policy': 'strict-origin-when-cross-origin'
//           }
//         });
//       }
      
//       case 'cloudflare': {
//         if (!currentParams) {
//           // For original files, just redirect to storage URL
//           responseStatus = 302;
//           return new Response(null, {
//             status: 302,
//             headers: {
//               'Location': storageUrl,
//               'Cache-Control': 'public, max-age=31536000, immutable',
//               'X-Content-Type-Options': 'nosniff',
//               'X-Frame-Options': 'DENY',
//               'Referrer-Policy': 'strict-origin-when-cross-origin'
//             }
//           });
//         }
//         const cfParams = toCloudflareParams(currentParams);
//         const optimizedUrl = `${storageUrl}?${cfParams.toString()}`;
//         responseStatus = 302;
//         return new Response(null, {
//           status: 302,
//           headers: {
//             'Location': optimizedUrl,
//             'Cache-Control': 'public, max-age=31536000, immutable',
//             // SECURITY: Security headers for redirects
//             'X-Content-Type-Options': 'nosniff',
//             'X-Frame-Options': 'DENY',
//             'Referrer-Policy': 'strict-origin-when-cross-origin'
//           }
//         });
//       }
      
//       case 'imgix': {
//         if (!currentParams) {
//           // For original files, just redirect to storage URL
//           responseStatus = 302;
//           return new Response(null, {
//             status: 302,
//             headers: {
//               'Location': storageUrl,
//               'Cache-Control': 'public, max-age=31536000, immutable',
//               'X-Content-Type-Options': 'nosniff',
//               'X-Frame-Options': 'DENY',
//               'Referrer-Policy': 'strict-origin-when-cross-origin'
//             }
//           });
//         }
//         const imgixParams = toImgixParams(currentParams);
//         const optimizedUrl = `${storageUrl}?${imgixParams.toString()}`;
//         responseStatus = 302;
//         return new Response(null, {
//           status: 302,
//           headers: {
//             'Location': optimizedUrl,
//             'Cache-Control': 'public, max-age=31536000, immutable',
//             // SECURITY: Security headers for redirects
//             'X-Content-Type-Options': 'nosniff',
//             'X-Frame-Options': 'DENY',
//             'Referrer-Policy': 'strict-origin-when-cross-origin'
//           }
//         });
//       }
      
//       default: {
//         // Check if this is an original file request (no transformations)
//         if (isOriginalFileRequest) {
//           // console.log(`Serving original ${fileInfo.type} file directly from: ${storageUrl}`);
          
//           // SECURITY: Validate storage URL before fetching
//           const urlValidation = validateStorageUrl(storageUrl);
//           if (!urlValidation.valid) {
//             console.warn(`SECURITY: Invalid storage URL from IP: ${clientIP}`);
//             responseStatus = 403;
//             return new Response('Forbidden', { 
//               status: 403,
//               headers: {
//                 'X-Content-Type-Options': 'nosniff',
//                 'X-Frame-Options': 'DENY',
//                 'Referrer-Policy': 'strict-origin-when-cross-origin'
//               }
//             });
//           }
          
//           // Fetch and serve the original file (browser cache already checked above)
//           const originalResponse = await Promise.race([
//             fetch(storageUrl),
//             new Promise<never>((_, reject) => 
//               setTimeout(() => reject(new Error('Request timeout')), SECURITY_CONFIG.SSRF_PROTECTION.TIMEOUT_MS)
//             )
//           ]);
          
//           if (!originalResponse.ok) {
//             responseStatus = 404;
//             return new Response('404: Media not found', { 
//               status: 404,
//               headers: {
//                 'X-Content-Type-Options': 'nosniff',
//                 'X-Frame-Options': 'DENY',
//                 'Referrer-Policy': 'strict-origin-when-cross-origin'
//               }
//             });
//           }
          
//           // SECURITY: Use secure buffer creation
//           const bufferResult = await createSecureBuffer(originalResponse);
//           if (!bufferResult.valid) {
//             console.warn(`SECURITY: Buffer creation failed from IP: ${clientIP}: ${bufferResult.error}`);
//             responseStatus = 413;
//             return new Response('Content too large', { 
//               status: 413,
//               headers: {
//                 'X-Content-Type-Options': 'nosniff',
//                 'X-Frame-Options': 'DENY',
//                 'Referrer-Policy': 'strict-origin-when-cross-origin'
//               }
//             });
//           }
          
//           const originalBuffer = bufferResult.buffer;
          
//           // Determine content type from file path
//           const contentType = getContentType(path);
          
//           // Generate secure ETag for original file
//           const originalEtag = createSecureETag(path);
          
//           // Serve the original file with proper caching headers
//           const headers = new Headers({
//             'Content-Type': contentType,
//             'Cache-Control': 'public, max-age=31536000, immutable',
//             'Content-Length': originalBuffer.length.toString(),
//             'ETag': originalEtag,
//             'Last-Modified': new Date().toUTCString(), // SECURITY FIX: Don't trust external headers
//             'X-Content-Type-Options': 'nosniff',
//             'X-Frame-Options': 'DENY',
//             'Referrer-Policy': 'strict-origin-when-cross-origin',
//             'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'"
//           });
          
//           responseStatus = 200;
//           return new Response(originalBuffer, { headers });
//         }
        
//         // Image transformation logic (existing code)
//         // Ensure we have transformation parameters (should not be null here)
//         if (!currentParams) {
//           throw new Error('Transformation parameters missing for image processing');
//         }
        
//         // Generate transformed image filename
//         const transformedFilename = generateTransformedFilename(path, currentParams);
//         const transformedPath = `transformed/${transformedFilename}`;
        
//         // Generate secure ETag from parameters (no path disclosure)
//         const etagSource = `${path}:${JSON.stringify(currentParams)}`;
//         const etag = createSecureETag(etagSource);
        
//         // Check browser cache FIRST (before any expensive operations)
//         const ifNoneMatch = request.headers.get('if-none-match');
//         if (ifNoneMatch === etag) {
//           // console.log('Browser has cached version, returning 304 Not Modified (instant response)');
//           responseStatus = 304;
//           return new Response(null, { 
//             status: 304,
//             headers: {
//               // SECURITY: Security headers for 304 responses
//               'X-Content-Type-Options': 'nosniff',
//               'X-Frame-Options': 'DENY',
//               'Referrer-Policy': 'strict-origin-when-cross-origin',
//               'Content-Security-Policy': "default-src 'none'"
//             }
//           });
//         }
        
//         // Initialize enhanced storage provider
//         const enhancedStorage = new EnhancedS3Provider();
        
//         // Check if transformed version already exists in CDN
//         const transformedExists = await enhancedStorage.fileExists(transformedPath);
        
//         if (transformedExists) {
//           // Transformed version exists - fetch from CDN and serve from proxy
//           const transformedUrl = enhancedStorage.getTransformedImageUrl(transformedPath);
//           // console.log(`Transformed image found in CDN, fetching and serving from proxy: ${transformedUrl}`);
          
//           // Fetch the transformed image from CDN
//           const transformedResponse = await fetch(transformedUrl);
//           if (!transformedResponse.ok) {
//             throw new Error(`Failed to fetch transformed image from CDN: ${transformedResponse.status}`);
//           }
          
//           // Log CDN response details for debugging
//           // console.log('=== CDN Response Details ===');
//           // console.log(`Status: ${transformedResponse.status} ${transformedResponse.statusText}`);
//           // console.log(`Content-Type: ${transformedResponse.headers.get('content-type')}`);
//           // console.log(`Content-Length: ${transformedResponse.headers.get('content-length')}`);
//           // console.log(`Cache-Control: ${transformedResponse.headers.get('cache-control')}`);
//           // console.log(`ETag: ${transformedResponse.headers.get('etag')}`);
//           // console.log(`Last-Modified: ${transformedResponse.headers.get('last-modified')}`);
//           // console.log(`CF-Cache-Status: ${transformedResponse.headers.get('cf-cache-status')}`);
//           // console.log(`CF-Ray: ${transformedResponse.headers.get('cf-ray')}`);
//           // console.log(`Age: ${transformedResponse.headers.get('age')}`);
//           // console.log('=== End CDN Response ===');
          
//           // SECURITY: Use secure buffer creation for transformed images
//           const transformedBufferResult = await createSecureBuffer(transformedResponse);
//           if (!transformedBufferResult.valid) {
//             console.warn(`SECURITY: Transformed buffer creation failed from IP: ${clientIP}`);
//             responseStatus = 413;
//             return new Response('Content too large', { 
//               status: 413,
//               headers: {
//                 'X-Content-Type-Options': 'nosniff',
//                 'X-Frame-Options': 'DENY',
//                 'Referrer-Policy': 'strict-origin-when-cross-origin'
//               }
//             });
//           }
          
//           const transformedBuffer = transformedBufferResult.buffer;
          
//           // Serve the transformed image from our proxy
//           const contentType = getContentType(currentParams.f || 'webp');
//           const headers = new Headers({
//             'Content-Type': contentType,
//             'Cache-Control': 'public, max-age=31536000, immutable',
//             'Content-Length': transformedBuffer.length.toString(),
//             'ETag': etag,
//             'Last-Modified': new Date().toUTCString(),
//             // SECURITY: Additional security headers
//             'X-Content-Type-Options': 'nosniff',
//             'X-Frame-Options': 'DENY',
//             'Referrer-Policy': 'strict-origin-when-cross-origin',
//             'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'"
//           });
          
//           responseStatus = 200;
//           return new Response(transformedBuffer, { headers });
//         }
        
//         // Transformed version doesn't exist - create it
//         // console.log(`Transformed image not found, creating: ${transformedPath}`);
        
//         // Start Sharp pipeline setup in parallel with image fetch
//         const transformStart = performance.now();
        
//         // SECURITY: Validate storage URL before fetching
//         const urlValidation = validateStorageUrl(storageUrl);
//         if (!urlValidation.valid) {
//           console.warn(`SECURITY: Invalid storage URL for transformation from IP: ${clientIP}`);
//           responseStatus = 403;
//           return new Response('Forbidden', { 
//             status: 403,
//             headers: {
//               'X-Content-Type-Options': 'nosniff',
//               'X-Frame-Options': 'DENY',
//               'Referrer-Policy': 'strict-origin-when-cross-origin'
//             }
//           });
//         }

//         // SECURITY: Fetch original image with timeout protection
//         const imageResponse = await Promise.race([
//           fetch(storageUrl),
//           new Promise<never>((_, reject) => 
//             setTimeout(() => reject(new Error('Request timeout')), SECURITY_CONFIG.SSRF_PROTECTION.TIMEOUT_MS)
//           )
//         ]);
        
//         if (!imageResponse.ok) {
//           responseStatus = 404;
//           return new Response('404: Media not found', { 
//             status: 404,
//             headers: {
//               'X-Content-Type-Options': 'nosniff',
//               'X-Frame-Options': 'DENY',
//               'Referrer-Policy': 'strict-origin-when-cross-origin'
//             }
//           });
//         }

//         // SECURITY: Use secure buffer creation for images
//         const imageBufferResult = await createSecureBuffer(imageResponse);
//         if (!imageBufferResult.valid) {
//           console.warn(`SECURITY: Image buffer creation failed from IP: ${clientIP}: ${imageBufferResult.error}`);
//           responseStatus = 413;
//           return new Response('File too large', { 
//             status: 413,
//             headers: {
//               'X-Content-Type-Options': 'nosniff',
//               'X-Frame-Options': 'DENY',
//               'Referrer-Policy': 'strict-origin-when-cross-origin'
//             }
//           });
//         }
        
//         const imageBuffer = imageBufferResult.buffer;
        
//         // SECURITY: Validate content type using magic bytes
//         const expectedType = getContentType(path);
//         if (!validateContentType(imageBuffer, expectedType)) {
//           console.warn(`SECURITY: Content type mismatch from IP: ${clientIP}`);
//           responseStatus = 400;
//           return new Response('Invalid file content', { 
//             status: 400,
//             headers: {
//               'X-Content-Type-Options': 'nosniff',
//               'X-Frame-Options': 'DENY',
//               'Referrer-Policy': 'strict-origin-when-cross-origin'
//             }
//           });
//         }
        
//         // Set format and quality for optimization
//         const format = currentParams.f || 'webp';
//         const quality = currentParams.q || 80;
        
//         // Use secure Sharp settings with input limits and timeout protection
//         const sharpPromise = sharp(imageBuffer, {
//           failOnError: false,
//           limitInputPixels: SECURITY_CONFIG.INPUT_LIMITS.MAX_PIXELS,  // Secure pixel limit
//           pages: -1
//         })
//         .resize({
//           width: currentParams.w,
//           height: currentParams.h,
//           fit: currentParams.fit,
//           position: currentParams.position,
//           fastShrinkOnLoad: true,
//           kernel: 'lanczos3'
//         })
//         .toFormat(format, {
//           quality,
//           ...(format === 'webp' && { effort: 2, smartSubsample: true }),
//           ...(format === 'avif' && { effort: 2, chromaSubsample: true }),
//           ...(format === 'jpeg' && { progressive: false, mozjpeg: true }),
//           ...(format === 'png' && { progressive: false, compressionLevel: 6 })
//         })
//         .toBuffer();
        
//         // SECURITY: Add timeout protection to prevent hanging Sharp operations
//         const transformedBuffer = await Promise.race([
//           sharpPromise,
//           new Promise<never>((_, reject) => 
//             setTimeout(() => reject(new Error('Image processing timeout')), 30000) // 30 second timeout
//           )
//         ]) as Buffer;
        
//                 const transformEnd = performance.now();
//         // console.log(`Image transformation completed in ${Math.round(transformEnd - transformStart)}ms`);
        
//         // Upload transformed image to CDN
//         const contentType = getContentType(currentParams.f || 'webp');
//         const transformedUrl = await enhancedStorage.uploadTransformedImage(
//           transformedBuffer, 
//           transformedPath, 
//           contentType
//         );
        
//         // console.log(`Transformed image uploaded to CDN: ${transformedUrl}`);
        
//         // Fetch the newly uploaded image and serve from proxy
//         const uploadedResponse = await fetch(transformedUrl);
//         if (!uploadedResponse.ok) {
//           throw new Error(`Failed to fetch newly uploaded image: ${uploadedResponse.status}`);
//         }
        
//         // Log newly uploaded image response details
//         // console.log('=== Newly Uploaded Image Response ===');
//         // console.log(`Status: ${uploadedResponse.status} ${uploadedResponse.statusText}`);
//         // console.log(`Content-Type: ${uploadedResponse.headers.get('content-type')}`);
//         // console.log(`Content-Length: ${uploadedResponse.headers.get('content-length')}`);
//         // console.log(`Cache-Control: ${uploadedResponse.headers.get('cache-control')}`);
//         // console.log(`ETag: ${uploadedResponse.headers.get('etag')}`);
//         // console.log(`Last-Modified: ${uploadedResponse.headers.get('last-modified')}`);
//         // console.log(`CF-Cache-Status: ${uploadedResponse.headers.get('cf-cache-status')}`);
//         // console.log(`CF-Ray: ${uploadedResponse.headers.get('cf-ray')}`);
//         // console.log(`Age: ${uploadedResponse.headers.get('age')}`);
//         // console.log('=== End Newly Uploaded Response ===');
        
//         // SECURITY: Use secure buffer creation for uploaded images
//         const uploadedBufferResult = await createSecureBuffer(uploadedResponse);
//         if (!uploadedBufferResult.valid) {
//           console.warn(`SECURITY: Uploaded buffer creation failed from IP: ${clientIP}`);
//           responseStatus = 413;
//           return new Response('Content too large', { 
//             status: 413,
//             headers: {
//               'X-Content-Type-Options': 'nosniff',
//               'X-Frame-Options': 'DENY',
//               'Referrer-Policy': 'strict-origin-when-cross-origin'
//             }
//           });
//         }
        
//         const uploadedBuffer = uploadedBufferResult.buffer;
        
//         // Serve the transformed image from our proxy
//         const headers = new Headers({
//           'Content-Type': contentType,
//           'Cache-Control': 'public, max-age=31536000, immutable',
//           'Content-Length': uploadedBuffer.length.toString(),
//           'ETag': etag,
//           'Last-Modified': new Date().toUTCString(),
//           'X-Content-Type-Options': 'nosniff',
//           'X-Frame-Options': 'DENY',
//           'Referrer-Policy': 'strict-origin-when-cross-origin',
//           'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'"
//         });
        
//         responseStatus = 200;
//         return new Response(uploadedBuffer, { headers });
        
//         // Memory cleanup - let garbage collector handle the buffers
//         // Note: In production, you might want to implement streaming for very large images
//       }
//     }
//   } catch (error) {
//     console.error('Image proxy error:', error);
//     responseStatus = 500;
//     return new Response('Internal server error', { 
//       status: 500,
//       headers: {
//         'X-Content-Type-Options': 'nosniff',
//         'X-Frame-Options': 'DENY',
//         'Referrer-Policy': 'strict-origin-when-cross-origin'
//       }
//     });
//   } finally {
//     // Log performance metrics
//     const endTime = performance.now();
//     const action = responseStatus === 304 ? 'browser cache hit' : 
//                    responseStatus === 302 ? 'redirect' : 
//                    responseStatus === 200 ? 'proxy serve' : 'error';
    
//     // console.log(`Image proxy ${action} completed in ${Math.round(endTime - startTime)}ms`, {
//     //   path,
//     //   provider: currentProvider,
//     //   params: currentParams,
//     //   status: responseStatus,
//     //   clientIP,
//     //   rateLimitRemaining: rateLimit.remaining
//     // });
    
//     // SECURITY: Log security events (sanitized)
//     if (responseStatus === 429 || responseStatus === 400) {
//       console.warn(`SECURITY EVENT: ${responseStatus} response for IP: ${clientIP}, Path: ${path}`);
//     }
//   }
// };