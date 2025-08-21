/**
 * Image Compression Utility
 * Compresses images client-side to prevent face swap API failures
 */

import { IMAGE_COMPRESSION_CONFIG, getCompressionLevel } from '@/config/imageSettings';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  maxSizeKB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  ...IMAGE_COMPRESSION_CONFIG.FACE_SWAP,
};

/**
 * Compresses an image file using canvas
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<File> - Compressed image file
 */
export async function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        const { width: newWidth, height: newHeight } = calculateDimensions(
          img.width, 
          img.height, 
          opts.maxWidth!, 
          opts.maxHeight!
        );
        
        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // Check if compressed size is acceptable
            const compressedSizeKB = blob.size / 1024;
            console.log(`Image compressed: ${file.size / 1024}KB → ${compressedSizeKB}KB`);
            
            // If still too large, try with lower quality
            if (compressedSizeKB > opts.maxSizeKB! && opts.quality! > 0.5) {
              const newOptions = { ...opts, quality: opts.quality! - 0.1 };
              compressImage(file, newOptions).then(resolve).catch(reject);
              return;
            }
            
            // Create new file with compressed data
            const compressedFile = new File([blob], file.name, {
              type: opts.format!,
              lastModified: Date.now()
            });
            
            resolve(compressedFile);
          },
          opts.format!,
          opts.quality!
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };
  
  // Scale down if necessary
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Get file size in KB
 */
export function getFileSizeKB(file: File): number {
  return file.size / 1024;
}

/**
 * Check if image needs compression
 */
export function needsCompression(
  file: File, 
  maxSizeKB: number = 800,
  maxDimension: number = 1024
): Promise<boolean> {
  return new Promise((resolve) => {
    // Check file size first
    if (getFileSizeKB(file) <= maxSizeKB) {
      // Still need to check dimensions
      const img = new Image();
      img.onload = () => {
        const needsResize = img.width > maxDimension || img.height > maxDimension;
        resolve(needsResize);
      };
      img.onerror = () => resolve(true); // Compress if we can't read it
      img.src = URL.createObjectURL(file);
    } else {
      resolve(true);
    }
  });
}

/**
 * Validates if file is a supported image type
 */
export function isValidImageFile(file: File): boolean {
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return supportedTypes.includes(file.type.toLowerCase());
}

/**
 * Compress image with progress callback
 */
export async function compressImageWithProgress(
  file: File,
  options: CompressionOptions = {},
  onProgress?: (progress: number) => void
): Promise<File> {
  onProgress?.(10);
  
  const compressed = await compressImage(file, options);
  
  onProgress?.(100);
  return compressed;
}

/**
 * Smart compression that adapts settings based on file size
 */
export async function smartCompress(file: File): Promise<File> {
  const fileSizeKB = getFileSizeKB(file);
  const compressionLevel = getCompressionLevel(fileSizeKB);
  
  console.log(`Smart compression: ${fileSizeKB}KB file, using ${compressionLevel.quality} quality`);
  
  return compressImage(file, {
    ...DEFAULT_OPTIONS,
    quality: compressionLevel.quality,
    maxSizeKB: compressionLevel.maxSizeKB
  });
}

/**
 * Face swap optimized compression
 * Uses specific settings optimized for the Segmind FaceSwap API
 */
export async function compressForFaceSwap(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.85,
    format: 'image/jpeg',
    maxSizeKB: 800
  });
}
