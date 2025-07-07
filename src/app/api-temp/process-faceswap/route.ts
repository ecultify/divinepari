import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-static';

const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY;

console.log('FaceSwap v4 API initialized');
if (!SEGMIND_API_KEY) {
  console.error('SEGMIND_API_KEY is not configured');
}

// Determine target side based on poster name
function getTargetSide(posterName: string): 'left' | 'right' {
  // Option 2 uses left side, Option 3M uses left side, others use right side
  if (posterName.includes('Option2') || posterName.includes('Option3M')) {
    return 'left';
  }
  return 'right';
}

// Convert image URL to base64
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const imageData = await response.arrayBuffer();
  return Buffer.from(imageData).toString('base64');
}

// Convert image file/blob to base64
async function imageToBase64(imageBuffer: Buffer): Promise<string> {
  return imageBuffer.toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    console.log('FaceSwap v4 API called');

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
    const sessionId = formData.get('sessionId') as string;

    console.log('Request parameters:', { 
      userImageProvided: !!userImageFile,
      posterName,
      sessionId
    });

    if (!userImageFile || !posterName || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Convert user image to buffer
    const userImageBuffer = Buffer.from(await userImageFile.arrayBuffer());
    
    // Resize user image to optimal size for FaceSwap v4
    const resizedUserImage = await sharp(userImageBuffer)
      .resize(1024, 1024, { 
        fit: 'inside',
        withoutEnlargement: false 
      })
      .jpeg({ quality: 95 })
      .toBuffer();

    // Convert user image to base64
    const userImageBase64 = await imageToBase64(resizedUserImage);

    // Get poster image and extract the correct side
    const posterImageUrl = `/images/posters/${posterName}`;
    const fullPosterUrl = `${request.nextUrl.origin}${posterImageUrl}`;
    
    console.log('Loading poster image from:', fullPosterUrl);
    
    // Determine which side to extract and process
    const targetSide = getTargetSide(posterName);
    console.log('Target side for', posterName, ':', targetSide, '(Option2 & Option3M use left, others use right)');
    
    // Load and process poster to extract the target side
    const posterResponse = await fetch(fullPosterUrl);
    const posterBuffer = Buffer.from(await posterResponse.arrayBuffer());
    
    // Extract the target side (left or right half)
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

    const targetSideBuffer = await posterImage
      .extract(extractOptions)
      .png({ quality: 95 })
      .toBuffer();

    console.log('Target side extracted, size:', targetSideBuffer.length);
    
    // Convert extracted side to base64
    const targetSideBase64 = await imageToBase64(targetSideBuffer);

    // Prepare FaceSwap v4 API request
    const faceSwapData = {
      source_image: userImageBase64,  // User's image (source face)
      target_image: targetSideBase64,  // Extracted poster side (target)
      model_type: "quality",  // Use quality model as requested
      swap_type: "head",  // Swap entire head (face + hair)
      style_type: "normal",
      seed: Math.floor(Math.random() * 1000000),
      image_format: "png",
      image_quality: 95,
      hardware: "fast",
      base64: true  // Return result as base64
    };

    console.log('Calling Segmind FaceSwap v4 API...');
    console.log('Request config:', {
      model_type: faceSwapData.model_type,
      swap_type: faceSwapData.swap_type,
      style_type: faceSwapData.style_type,
      image_format: faceSwapData.image_format,
      image_quality: faceSwapData.image_quality
    });

    const faceSwapResponse = await fetch('https://api.segmind.com/v1/faceswap-v4', {
      method: 'POST',
      headers: {
        'x-api-key': SEGMIND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(faceSwapData)
    });

    console.log('FaceSwap v4 API response status:', faceSwapResponse.status);

    if (!faceSwapResponse.ok) {
      const errorText = await faceSwapResponse.text();
      console.error('FaceSwap v4 API error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Face swap processing failed. Please try again.' },
        { status: 500 }
      );
    }

    // Get the result (should be base64 if base64: true)
    const responseData = await faceSwapResponse.json();
    
    let resultImageBase64: string;
    if (responseData.image) {
      // Response contains base64 image
      resultImageBase64 = responseData.image;
    } else {
      // Response might be direct base64 or buffer
      const responseBuffer = await faceSwapResponse.arrayBuffer();
      resultImageBase64 = Buffer.from(responseBuffer).toString('base64');
    }

    console.log('FaceSwap v4 completed, result length:', resultImageBase64.length);

    // Composite the face-swapped result back onto the original poster
    console.log('Compositing result back onto original poster...');
    
    const swappedSideBuffer = Buffer.from(resultImageBase64, 'base64');
    
    // Resize the swapped result to match the extracted dimensions
    const resizedSwappedBuffer = await sharp(swappedSideBuffer)
      .resize(halfWidth, height)
      .png({ quality: 95 })
      .toBuffer();

    // Create the final composite image
    const overlayOptions = targetSide === 'left'
      ? { left: 0, top: 0 }
      : { left: halfWidth, top: 0 };

    const finalImageBuffer = await sharp(posterBuffer)
      .composite([{
        input: resizedSwappedBuffer,
        ...overlayOptions
      }])
      .png({ quality: 95 })
      .toBuffer();

    console.log('Final composite image created, size:', finalImageBuffer.length);
    
    // Convert final result to base64 data URL
    const finalImageBase64 = finalImageBuffer.toString('base64');
    const imageDataUrl = `data:image/png;base64,${finalImageBase64}`;
    
    console.log('Final result ready as data URL');

    return NextResponse.json({
      success: true,
      imageUrl: imageDataUrl,
      hasImage: true,
      message: 'Face and hair swap completed successfully'
    });

  } catch (error) {
    console.error('FaceSwap v4 API error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during face swap processing.' },
      { status: 500 }
    );
  }
} 