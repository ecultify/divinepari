import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Segmind API Configuration
const SEGMIND_URL = 'https://api.segmind.com/v1/faceswap-v3';
const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY;

// Check if API key is available
if (!SEGMIND_API_KEY) {
  console.error('SEGMIND_API_KEY is not configured');
}

// Determine target side based on poster name
const getTargetSide = (posterName: string): 'left' | 'right' => {
  const upperName = posterName.toUpperCase();
  if (upperName.includes('3F') || upperName.includes('3M')) {
    return 'right';
  }
  return 'left';
};

// Convert buffer to base64
const bufferToBase64 = (buffer: Buffer): string => {
  return buffer.toString('base64');
};

export async function POST(request: NextRequest) {
  try {
    console.log('Face swap API called');
    
    // Check if API key is available
    if (!SEGMIND_API_KEY) {
      console.error('Segmind API key not configured');
      return NextResponse.json(
        { success: false, error: 'API configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const userImageFile = formData.get('userImage') as File;
    const posterName = formData.get('posterName') as string;
    const gender = formData.get('gender') as string;

    console.log('Request parameters:', { posterName, gender, userImageExists: !!userImageFile });
    console.log('Working directory:', process.cwd());

    if (!userImageFile || !posterName || !gender) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Convert user image to buffer
    const userImageBuffer = Buffer.from(await userImageFile.arrayBuffer());
    console.log('User image size:', userImageBuffer.length);

    // Get poster path and read poster image from file system
    const posterPath = path.join(process.cwd(), 'public', 'images', 'posters', posterName);
    console.log('Looking for poster at:', posterPath);
    
    let posterBuffer: Buffer;
    try {
      // Check if file exists
      if (!fs.existsSync(posterPath)) {
        console.error(`Poster file not found at: ${posterPath}`);
        // List available files for debugging
        const postersDir = path.join(process.cwd(), 'public', 'images', 'posters');
        if (fs.existsSync(postersDir)) {
          const availableFiles = fs.readdirSync(postersDir);
          console.log('Available poster files:', availableFiles);
        }
        throw new Error(`Poster file not found: ${posterName}`);
      }
      
      posterBuffer = fs.readFileSync(posterPath);
      console.log('Poster image loaded from file system, size:', posterBuffer.length);
    } catch (error) {
      console.error('Error loading poster from file system:', error);
      return NextResponse.json(
        { success: false, error: 'Poster not found' },
        { status: 404 }
      );
    }

    // Step 1: Image Extraction - Extract target side from poster
    const targetSide = getTargetSide(posterName);
    console.log('Target side:', targetSide);

    let targetImageBuffer: Buffer;
    try {
      const posterImage = sharp(posterBuffer);
      const metadata = await posterImage.metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        throw new Error('Unable to get poster dimensions');
      }

      console.log('Poster dimensions:', { width, height });

      // Extract left or right half based on targetSide
      const halfWidth = Math.floor(width / 2);
      const extractOptions = targetSide === 'left' 
        ? { left: 0, top: 0, width: halfWidth, height }
        : { left: halfWidth, top: 0, width: halfWidth, height };

      targetImageBuffer = await posterImage
        .extract(extractOptions)
        .jpeg({ quality: 95 })
        .toBuffer();

      console.log('Target image extracted, size:', targetImageBuffer.length);
    } catch (error) {
      console.error('Error processing poster image:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to process poster image' },
        { status: 500 }
      );
    }

    // Step 2: Convert images to base64 for Segmind API
    const sourceImageBase64 = bufferToBase64(userImageBuffer);
    const targetImageBase64 = bufferToBase64(targetImageBuffer);

    // Step 3: Segmind API Face Swap
    console.log('Calling Segmind API...');

    const faceSwapData = {
      source_img: sourceImageBase64,        // User's uploaded image
      target_img: targetImageBase64,        // Extracted poster half
      input_faces_index: 0,
      source_faces_index: 0,
      face_restore: "codeformer-v0.1.0.pth",
      interpolation: "Bilinear",
      detection_face_order: "large-small",
      facedetection: "retinaface_resnet50",
      detect_gender_input: "no",
      detect_gender_source: "no",
      face_restore_weight: 0.75,
      image_format: "jpeg",
      image_quality: 95,
      base64: true
    };

    let faceSwapResponse;
    try {
      faceSwapResponse = await axios.post(SEGMIND_URL, faceSwapData, {
        headers: { 
          'x-api-key': SEGMIND_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // Increased timeout to 60 seconds
      });

      console.log('Segmind API response status:', faceSwapResponse.status);
    } catch (error) {
      console.error('Segmind API error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('API Error Response:', error.response.data);
          return NextResponse.json(
            { success: false, error: `Face swap API error: ${error.response.status}` },
            { status: 500 }
          );
        } else if (error.code === 'ECONNABORTED') {
          return NextResponse.json(
            { success: false, error: 'Face swap processing timed out. Please try again.' },
            { status: 408 }
          );
        }
      }
      
      return NextResponse.json(
        { success: false, error: 'Face swap service unavailable' },
        { status: 503 }
      );
    }

    if (!faceSwapResponse.data || !faceSwapResponse.data.image) {
      console.error('Invalid Segmind API response:', faceSwapResponse.data);
      return NextResponse.json(
        { success: false, error: 'Face swap processing failed - no image returned' },
        { status: 500 }
      );
    }

    // Step 4: Image Composition
    let finalImageBuffer: Buffer;
    try {
      const swappedImageBuffer = Buffer.from(faceSwapResponse.data.image, 'base64');
      console.log('Swapped image size:', swappedImageBuffer.length);

      // Get original poster dimensions for composition
      const posterImage = sharp(posterBuffer);
      const metadata = await posterImage.metadata();
      const { width, height } = metadata;
      const halfWidth = Math.floor(width! / 2);

      // Resize swapped image to match the extracted dimensions
      const resizedSwappedBuffer = await sharp(swappedImageBuffer)
        .resize(halfWidth, height)
        .jpeg({ quality: 95 })
        .toBuffer();

      // Create the final composite image
      const overlayOptions = targetSide === 'left'
        ? { left: 0, top: 0 }
        : { left: halfWidth, top: 0 };

      finalImageBuffer = await sharp(posterBuffer)
        .composite([{
          input: resizedSwappedBuffer,
          ...overlayOptions
        }])
        .jpeg({ quality: 95 })
        .toBuffer();

      console.log('Final image composed, size:', finalImageBuffer.length);
    } catch (error) {
      console.error('Error composing final image:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to compose final image' },
        { status: 500 }
      );
    }

    // Convert final image to base64 for response
    const finalImageBase64 = bufferToBase64(finalImageBuffer);
    const finalImageDataUrl = `data:image/jpeg;base64,${finalImageBase64}`;

    console.log('Face swap completed successfully');

    return NextResponse.json({
      success: true,
      imageUrl: finalImageDataUrl,
      metadata: {
        posterName,
        targetSide,
        gender,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Face swap processing error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
} 