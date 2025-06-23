import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Segmind Hair Swap API Configuration  
const SEGMIND_HAIRSWAP_URL = 'https://api.segmind.com/workflows/678bb66b872192d0c9beabb4-v3';
const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY;

// Check if API key is available
if (!SEGMIND_API_KEY) {
  console.error('SEGMIND_API_KEY is not configured');
}

// Helper function to poll for hair swap result
async function pollHairSwapResult(pollUrl: string, requestId: string, maxAttempts = 30): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`Polling attempt ${attempt + 1}/${maxAttempts} for request ${requestId}`);
      
      const response = await axios.get(pollUrl, {
        headers: {
          'x-api-key': SEGMIND_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      console.log('Poll response status:', response.data.status);

      if (response.data.status === 'COMPLETED' && response.data.output_image) {
        console.log('Hair swap completed successfully');
        return response.data.output_image;
      } else if (response.data.status === 'FAILED') {
        throw new Error('Hair swap processing failed');
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Poll attempt ${attempt + 1} failed:`, error);
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('Hair swap processing timed out');
}

export async function POST(request: NextRequest) {
  try {
    console.log('Hair swap API called');
    
    // Check if API key is available
    if (!SEGMIND_API_KEY) {
      console.error('Segmind API key not configured');
      return NextResponse.json(
        { success: false, error: 'API configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { faceSwappedImageUrl, userOriginalImageUrl } = body;

    console.log('Request parameters:', { 
      faceSwappedImageProvided: !!faceSwappedImageUrl, 
      userOriginalImageProvided: !!userOriginalImageUrl 
    });

    if (!faceSwappedImageUrl || !userOriginalImageUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required image URLs' },
        { status: 400 }
      );
    }

    // Step 1: Submit hair swap request to Segmind API
    console.log('Submitting hair swap request to Segmind API...');
    console.log('Hair will be taken from user original image and applied to face-swapped result');

    const hairSwapData = {
      reference_character_image: userOriginalImageUrl,  // User's original photo (source of hair)
      character_image: faceSwappedImageUrl              // Face-swapped result (target for hair)
    };

    let initResponse;
    try {
      initResponse = await axios.post(SEGMIND_HAIRSWAP_URL, hairSwapData, {
        headers: { 
          'x-api-key': SEGMIND_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout for initial request
      });

      console.log('Segmind Hair Swap API initial response:', initResponse.data);
    } catch (error) {
      console.error('Segmind Hair Swap API error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('API Error Response:', error.response.data);
          return NextResponse.json(
            { success: false, error: `Hair swap API error: ${error.response.status}` },
            { status: 500 }
          );
        } else if (error.code === 'ECONNABORTED') {
          return NextResponse.json(
            { success: false, error: 'Hair swap request timed out. Please try again.' },
            { status: 408 }
          );
        }
      }
      
      return NextResponse.json(
        { success: false, error: 'Hair swap service unavailable' },
        { status: 503 }
      );
    }

    if (!initResponse.data || !initResponse.data.poll_url || !initResponse.data.request_id) {
      console.error('Invalid Segmind Hair Swap API response:', initResponse.data);
      return NextResponse.json(
        { success: false, error: 'Hair swap processing failed - invalid response' },
        { status: 500 }
      );
    }

    // Step 2: Poll for result
    console.log('Polling for hair swap result...');
    const { poll_url, request_id } = initResponse.data;

    let resultImageUrl;
    try {
      resultImageUrl = await pollHairSwapResult(poll_url, request_id);
    } catch (error) {
      console.error('Hair swap polling error:', error);
      return NextResponse.json(
        { success: false, error: 'Hair swap processing failed or timed out' },
        { status: 500 }
      );
    }

    console.log('Hair swap completed successfully');

    return NextResponse.json({
      success: true,
      imageUrl: resultImageUrl,
      metadata: {
        requestId: request_id,
        processedAt: new Date().toISOString(),
        type: 'hair_swap'
      }
    });

  } catch (error) {
    console.error('Hair swap processing error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
} 