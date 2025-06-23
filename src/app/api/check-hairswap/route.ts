import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '../../../lib/supabase';

const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, sessionId } = body;

    if (!jobId || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing jobId or sessionId' },
        { status: 400 }
      );
    }

    // Get job info from database
    const { data: jobData, error: jobError } = await supabase
      .from('hair_swap_jobs')
      .select('*')
      .eq('request_id', jobId)
      .eq('session_id', sessionId)
      .single();

    if (jobError || !jobData) {
      console.error('Job not found:', jobError);
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check current status with Segmind
    console.log(`Checking status for job ${jobId}...`);
    
    try {
      const pollResponse = await axios.get(jobData.poll_url, {
        headers: {
          'x-api-key': SEGMIND_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const currentStatus = pollResponse.data.status;
      const outputImage = pollResponse.data.output_image;

      // Update job status in database
      await supabase
        .from('hair_swap_jobs')
        .update({ 
          status: currentStatus,
          updated_at: new Date().toISOString(),
          ...(outputImage && { result_image_url: outputImage })
        })
        .eq('request_id', jobId);

      console.log(`Job ${jobId} status: ${currentStatus}`);

      if (currentStatus === 'COMPLETED' && outputImage) {
        return NextResponse.json({
          success: true,
          status: 'COMPLETED',
          imageUrl: outputImage,
          message: 'Hair swap completed successfully'
        });
      } else if (currentStatus === 'FAILED') {
        return NextResponse.json({
          success: false,
          status: 'FAILED',
          error: 'Hair swap processing failed'
        });
      } else {
        // Still processing
        return NextResponse.json({
          success: true,
          status: currentStatus,
          message: `Hair swap is ${currentStatus.toLowerCase()}`
        });
      }

    } catch (pollError) {
      console.error('Error polling job status:', pollError);
      
      // If polling fails, return current database status
      return NextResponse.json({
        success: true,
        status: jobData.status,
        message: 'Checking status...'
      });
    }

  } catch (error) {
    console.error('Error checking hair swap status:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check job status' 
      },
      { status: 500 }
    );
  }
} 