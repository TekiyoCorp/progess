import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY not configured' },
        { status: 500 }
      );
    }

    const testEmailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f472b6, #a855f7, #60a5fa); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .success { background: #d1fae5; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; color: #065f46; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Test Email - Tekiyo</h1>
            </div>
            <div class="content">
              <p>Salut Zak,</p>
              
              <div class="success">
                🎉 L'email fonctionne parfaitement ! Resend est bien configuré.
              </div>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Ceci est un email de test envoyé depuis ton dashboard Tekiyo.<br>
                <a href="https://progression.vercel.app" style="color: #a855f7; text-decoration: none;">→ Ouvrir le dashboard</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Utiliser le domaine de test de Resend ou un domaine vérifié
    // Pour tester, utilisez: onboarding@resend.dev (domaine de test Resend)
    // Ou remplacez par votre domaine vérifié dans Resend
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    const { data, error } = await resend.emails.send({
      from: `Tekiyo Dashboard <${fromEmail}>`,
      to: 'tekiyocorp@gmail.com',
      subject: '✅ Test Email - Tekiyo Dashboard',
      html: testEmailContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      messageId: data?.id,
      message: 'Test email sent successfully to tekiyocorp@gmail.com'
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

