import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/sendEmail';

export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    console.log('Testing email send to:', email);

    const result = await sendTestEmail(email);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint. Use POST with { "email": "test@example.com" } to test email functionality.'
  });
} 