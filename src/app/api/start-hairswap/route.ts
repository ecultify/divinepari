import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '../../../lib/supabase';

const SEGMIND_HAIRSWAP_URL = 'https://api.segmind.com/workflows/678bb66b872192d0c9beabb4-v3';
const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY;

export async function POST(request: NextRequest) {
  try {
    console.log('Starting hair swap job...');
    
    if (!SEGMIND_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'API configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { faceSwappedImageUrl, userOriginalImageUrl, sessionId } = body;

    if (!faceSwappedImageUrl || !userOriginalImageUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required image URLs' },
        { status: 400 }
      );
    }

    // Start hair swap job with Segmind
    const hairSwapData = {
      reference_character_image: userOriginalImageUrl,
      character_image: faceSwappedImageUrl
    };

    console.log('Submitting hair swap request to Segmind...');
    const initResponse = await axios.post(SEGMIND_HAIRSWAP_URL, hairSwapData, {
      headers: { 
        'x-api-key': SEGMIND_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (!initResponse.data?.poll_url || !initResponse.data?.request_id) {
      throw new Error('Invalid response from hair swap service');
    }

    const { poll_url, request_id, status } = initResponse.data;
    
    // Store job info in Supabase for tracking
    const jobRecord = {
      session_id: sessionId,
      request_id: request_id,
      poll_url: poll_url,
      status: status || 'QUEUED',
      face_swapped_image_url: faceSwappedImageUrl,
      user_original_image_url: userOriginalImageUrl,
      created_at: new Date().toISOString()
    };

    // Create hair_swap_jobs table entry (if table exists)
    try {
      const { error: dbError } = await supabase
        .from('hair_swap_jobs')
        .insert([jobRecord]);

      if (dbError) {
        console.error('Failed to store job record:', dbError);
        // Continue anyway - job is still running
      }
    } catch (tableError) {
      console.warn('hair_swap_jobs table not found - continuing without database tracking');
      // Continue anyway - the core functionality still works
    }

    console.log(`Hair swap job started successfully: ${request_id}`);

    // Return immediately with job ID
    return NextResponse.json({
      success: true,
      jobId: request_id,
      pollUrl: poll_url,
      status: status,
      message: 'Hair swap job started successfully'
    });

  } catch (error) {
    console.error('Error starting hair swap job:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to start hair swap job' 
      },
      { status: 500 }
    );
  }
} 