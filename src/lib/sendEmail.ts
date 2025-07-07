import mailchimp from '@mailchimp/mailchimp_transactional';

const MANDRILL_API_KEY = process.env.MANDRILL_API_KEY || 'md-uHR1LFMjBFB7Yn6aBnl7uA';
const mandrill = mailchimp(MANDRILL_API_KEY);

export interface EmailData {
  to: string;
  userName?: string;
  posterUrl?: string;
  sessionId?: string;
}

export async function sendPosterEmail(emailData: EmailData) {
  const { to, userName, posterUrl, sessionId } = emailData;
  
  const message = {
    from_email: 'support@posewithdivine.com',
    from_name: 'Divine x Parimatch',
    subject: 'Your Divine Poster is Ready! 🎤✨',
    to: [{ email: to, type: 'to' as const }],
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Divine Poster is Ready!</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            max-width: 200px;
            margin-bottom: 20px;
          }
          .title {
            color: #F8FF13;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          }
          .subtitle {
            color: #666;
            font-size: 16px;
          }
          .content {
            margin: 20px 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(45deg, #F8FF13, #E6E600);
            color: black;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 18px;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 3px 6px rgba(0,0,0,0.2);
            transition: transform 0.2s;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .instructions {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #F8FF13;
          }
          .instructions h3 {
            color: #333;
            margin-top: 0;
          }
          .instructions ol {
            margin: 10px 0;
            padding-left: 20px;
          }
          .instructions li {
            margin: 8px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .social-links {
            margin: 20px 0;
          }
          .social-links a {
            color: #F8FF13;
            text-decoration: none;
            margin: 0 10px;
            font-weight: bold;
          }
          .highlight {
            color: #F8FF13;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">🎤 Your Divine Poster is Ready! ✨</h1>
            <p class="subtitle">Time to shine with DIVINE x Parimatch!</p>
          </div>
          
          <div class="content">
            <p>Hey ${userName || 'there'}! 👋</p>
            
            <p>Your epic poster featuring you and India's rap king <strong>DIVINE</strong> is ready to download! 🔥</p>
            
            ${posterUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${posterUrl}" class="cta-button">
                📥 DOWNLOAD YOUR POSTER
              </a>
            </div>
            ` : ''}
            
            <div class="instructions">
              <h3>🏆 Want to Win Limited-Edition Merch?</h3>
              <p>Follow these steps to enter our weekly giveaway:</p>
              <ol>
                <li><strong>Upload</strong> your poster to your Instagram feed</li>
                <li><strong>Use the hashtag</strong> <span class="highlight">#DIVINExparimatch</span></li>
                <li><strong>Tag</strong> <span class="highlight">@playwithparimatch</span> in your post</li>
              </ol>
              <p><strong>Parimatch selects 3 lucky winners each week!</strong> Your name could be on that list—drop your poster and let fate decide! 🎯</p>
            </div>
            
            <p>Share your poster and show the world your star power! ⭐</p>
          </div>
          
          <div class="footer">
            <div class="social-links">
              <a href="https://instagram.com/playwithparimatch" target="_blank">@playwithparimatch</a>
              <span>•</span>
              <a href="https://posewithdivine.com" target="_blank">posewithdivine.com</a>
            </div>
            <p>© 2024 Divine x Parimatch. All rights reserved.</p>
            <p style="font-size: 12px; color: #999;">
              This email was sent because you generated a poster on our platform.
              ${sessionId ? `Session ID: ${sessionId}` : ''}
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Your Divine Poster is Ready! 🎤✨

Hey ${userName || 'there'}!

Your epic poster featuring you and India's rap king DIVINE is ready to download!

${posterUrl ? `Download your poster: ${posterUrl}` : ''}

Want to Win Limited-Edition Merch?
Follow these steps to enter our weekly giveaway:

1. Upload your poster to your Instagram feed
2. Use the hashtag #DIVINExparimatch
3. Tag @playwithparimatch in your post

Parimatch selects 3 lucky winners each week! Your name could be on that list—drop your poster and let fate decide!

Share your poster and show the world your star power!

Follow us: @playwithparimatch
Visit: posewithdivine.com

© 2024 Divine x Parimatch. All rights reserved.
${sessionId ? `Session ID: ${sessionId}` : ''}
    `,
    important: false,
    track_opens: true,
    track_clicks: true,
    auto_text: false,
    auto_html: false,
    inline_css: false,
    url_strip_qs: false,
    preserve_recipients: false,
    view_content_link: false,
    bcc_address: undefined,
    tracking_domain: undefined,
    signing_domain: undefined,
    return_path_domain: undefined,
    merge: true,
    merge_language: 'mailchimp' as const,
    tags: ['poster-generated', 'divine-parimatch'],
    subaccount: undefined
  };

  try {
    console.log('Sending email to:', to);
    const response = await mandrill.messages.send({ message });
    console.log('Email sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Mandrill send error:', error);
    throw error;
  }
}

export async function sendTestEmail(to: string) {
  try {
    const testResponse = await sendPosterEmail({
      to,
      userName: 'Test User',
      posterUrl: 'https://posewithdivine.com/test-poster.jpg',
      sessionId: 'test-session-123'
    });
    return testResponse;
  } catch (error) {
    console.error('Test email failed:', error);
    throw error;
  }
} 