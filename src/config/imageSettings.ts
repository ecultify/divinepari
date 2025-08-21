/**
 * Image Processing Configuration
 * Settings for image compression and face swap optimization
 */

export const IMAGE_COMPRESSION_CONFIG = {
  // Face swap optimization settings
  FACE_SWAP: {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.85,
    format: 'image/jpeg' as const,
    maxSizeKB: 800,
  },
  
  // Camera capture settings
  CAMERA: {
    quality: 0.85,
    format: 'image/jpeg' as const,
  },
  
  // Upload validation
  VALIDATION: {
    maxFileSizeMB: 10,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    minDimensions: { width: 200, height: 200 },
    maxDimensions: { width: 4096, height: 4096 },
  },
  
  // Progressive compression levels
  COMPRESSION_LEVELS: {
    LOW: { quality: 0.95, maxSizeKB: 2000 },
    MEDIUM: { quality: 0.85, maxSizeKB: 800 },
    HIGH: { quality: 0.75, maxSizeKB: 500 },
    AGGRESSIVE: { quality: 0.65, maxSizeKB: 300 },
  }
} as const;

/**
 * Get compression settings based on file size
 */
export function getCompressionLevel(fileSizeKB: number) {
  if (fileSizeKB <= 800) return IMAGE_COMPRESSION_CONFIG.COMPRESSION_LEVELS.LOW;
  if (fileSizeKB <= 2000) return IMAGE_COMPRESSION_CONFIG.COMPRESSION_LEVELS.MEDIUM;
  if (fileSizeKB <= 5000) return IMAGE_COMPRESSION_CONFIG.COMPRESSION_LEVELS.HIGH;
  return IMAGE_COMPRESSION_CONFIG.COMPRESSION_LEVELS.AGGRESSIVE;
}

/**
 * Face swap API requirements
 */
export const FACE_SWAP_REQUIREMENTS = {
  // Based on your current PHP processor settings
  TARGET_DIMENSIONS: { width: 1024, height: 1024 },
  RECOMMENDED_MAX_SIZE_KB: 800,
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png'],
  
  // Quality settings that work well with Segmind API
  OPTIMAL_QUALITY: 0.85,
  MIN_QUALITY: 0.65,
} as const;
