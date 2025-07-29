import { NextRequest, NextResponse } from 'next/server';
import { sendPosterEmail } from '@/lib/sendEmail';

export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const { to, userName, posterUrl, sessionId } = await request.json();

    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log('Sending email to:', to, 'for session:', sessionId);

    const result = await sendPosterEmail({
      to,
      userName,
      posterUrl,
      sessionId
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 