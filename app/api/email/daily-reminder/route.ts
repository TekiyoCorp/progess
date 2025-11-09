import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { tasks, currentAmount, monthlyGoal, folders } = body;

    // Tâches non complétées
    const pendingTasks = tasks.filter((t: any) => !t.completed);
    const criticalTasks = pendingTasks
      .filter((t: any) => t.percentage >= 4)
      .sort((a: any, b: any) => b.percentage - a.percentage)
      .slice(0, 5);

    // Calcul CA
    const caProgress = ((currentAmount / monthlyGoal) * 100).toFixed(1);
    const caGap = monthlyGoal - currentAmount;

    // Dossiers en cours
    const activeFolders = folders.filter((f: any) => {
      const folderTasks = tasks.filter((t: any) => t.folder_id === f.id);
      return folderTasks.some((t: any) => !t.completed);
    });

    // Message d'encouragement
    let encouragement = '';
    if (caGap <= 0) {
      encouragement = '🎉 Félicitations ! Tu as atteint ton objectif mensuel ! Continue comme ça !';
    } else if (caGap < 10000) {
      encouragement = `💪 Tu es à ${caGap.toLocaleString()}€ de ton objectif ! Tu y es presque, continue !`;
    } else if (criticalTasks.length > 0) {
      encouragement = `🔥 ${criticalTasks.length} tâches critiques t'attendent. Focus sur l'essentiel et avance !`;
    } else {
      encouragement = '🚀 Une nouvelle journée pour progresser ! Chaque action compte.';
    }

    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              background: #ffffff;
              color: rgba(0, 0, 0, 0.8);
              line-height: 1.6;
              font-size: 12px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 40px 20px;
              background: #ffffff;
            }
            .header { 
              padding: 30px 0;
              text-align: center;
              border-bottom: 1px solid rgba(0, 0, 0, 0.1);
              margin-bottom: 30px;
            }
            .header h1 { 
              background: linear-gradient(to right, rgb(244, 114, 182), rgb(168, 85, 247), rgb(96, 165, 250));
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin: 0; 
              font-size: 28px;
              font-weight: normal;
            }
            .content { 
              padding: 0;
            }
            .greeting {
              color: rgba(0, 0, 0, 0.8);
              font-size: 14px;
              margin-bottom: 24px;
            }
            .stat { 
              background: rgba(0, 0, 0, 0.03);
              border: 1px solid rgba(0, 0, 0, 0.1);
              padding: 16px;
              margin: 12px 0;
              border-radius: 8px;
            }
            .stat-title {
              color: rgba(0, 0, 0, 0.7);
              font-size: 11px;
              font-weight: 500;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .stat-content {
              color: rgba(0, 0, 0, 0.8);
              font-size: 13px;
            }
            .progress-container {
              margin-top: 12px;
            }
            .progress-bar { 
              background: rgba(0, 0, 0, 0.05);
              height: 2px;
              border-radius: 1px;
              overflow: hidden;
              margin: 8px 0;
            }
            .progress-fill { 
              background: linear-gradient(to right, rgb(244, 114, 182), rgb(168, 85, 247), rgb(96, 165, 250));
              height: 100%;
              border-radius: 1px;
            }
            .progress-text {
              color: rgba(0, 0, 0, 0.6);
              font-size: 11px;
              text-align: center;
              margin-top: 4px;
            }
            .task-item { 
              padding: 8px 0;
              border-bottom: 1px solid rgba(0, 0, 0, 0.05);
              color: rgba(0, 0, 0, 0.7);
              font-size: 12px;
            }
            .task-item:last-child { 
              border-bottom: none;
            }
            .percentage { 
              background: linear-gradient(to right, rgb(244, 114, 182), rgb(168, 85, 247), rgb(96, 165, 250));
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              font-weight: 500;
            }
            .encouragement { 
              background: rgba(0, 0, 0, 0.03);
              border: 1px solid rgba(0, 0, 0, 0.1);
              padding: 16px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
              color: rgba(0, 0, 0, 0.8);
              font-size: 13px;
            }
            .summary {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid rgba(0, 0, 0, 0.1);
              color: rgba(0, 0, 0, 0.6);
              font-size: 11px;
              line-height: 1.8;
            }
            .link {
              display: inline-block;
              margin-top: 12px;
              padding: 8px 16px;
              background: rgba(0, 0, 0, 0.05);
              border: 1px solid rgba(0, 0, 0, 0.1);
              border-radius: 6px;
              color: rgba(0, 0, 0, 0.8);
              text-decoration: none;
              font-size: 12px;
            }
            .ca-amount {
              font-size: 20px;
              font-weight: 500;
              color: rgba(0, 0, 0, 0.9);
              margin: 8px 0;
            }
            .ca-goal {
              color: rgba(0, 0, 0, 0.4);
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Hello Zak!</h1>
            </div>
            <div class="content">
              <p class="greeting">Salut Zak,</p>
              
              <div class="stat">
                <div class="stat-title">💰 Chiffre d'Affaires</div>
                <div class="stat-content">
                  <div class="ca-amount">${currentAmount.toLocaleString()}€</div>
                  <div class="ca-goal">sur ${monthlyGoal.toLocaleString()}€ (${caProgress}%)</div>
                  ${caGap > 0 ? `<div class="ca-goal" style="margin-top: 4px;">Gap: ${caGap.toLocaleString()}€ à combler</div>` : ''}
                  <div class="progress-container">
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${Math.min(parseFloat(caProgress), 100)}%"></div>
                    </div>
                    <div class="progress-text">${caProgress}%</div>
                  </div>
                </div>
              </div>

              ${criticalTasks.length > 0 ? `
                <div class="stat">
                  <div class="stat-title">🔥 Tâches Critiques (${criticalTasks.length})</div>
                  <div class="stat-content">
                    ${criticalTasks.map((t: any) => `
                      <div class="task-item">
                        • ${t.title} <span class="percentage">(${t.percentage}%)</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              ${activeFolders.length > 0 ? `
                <div class="stat">
                  <div class="stat-title">📁 Dossiers Actifs (${activeFolders.length})</div>
                  <div class="stat-content">
                    ${activeFolders.map((f: any) => {
                      const folderTasks = tasks.filter((t: any) => t.folder_id === f.id);
                      const completedCount = folderTasks.filter((t: any) => t.completed).length;
                      const totalCount = folderTasks.length;
                      const completion = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                      return `
                        <div style="padding: 10px; background: rgba(0, 0, 0, 0.02); border: 1px solid rgba(0, 0, 0, 0.05); border-radius: 6px; margin: 6px 0;">
                          <div style="color: rgba(0, 0, 0, 0.8); font-size: 12px; font-weight: 500;">
                            ${f.name}
                            ${f.price ? `<span style="background: linear-gradient(to right, rgb(244, 114, 182), rgb(168, 85, 247), rgb(96, 165, 250)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 600;"> - ${f.price.toLocaleString()}€</span>` : ''}
                          </div>
                          <div style="color: rgba(0, 0, 0, 0.4); font-size: 10px; margin-top: 4px;">${completedCount}/${totalCount} tâches complétées (${completion}%)</div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              ` : ''}

              <div class="encouragement">
                ${encouragement}
              </div>

              <div class="summary">
                Total tâches restantes: ${pendingTasks.length}<br>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://progess-azure.vercel.app/'}" class="link">→ Ouvrir le dashboard</a>
              </div>
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
      subject: `📊 Daily Brief - ${new Date().toLocaleDateString('fr-FR')}`,
      html: emailContent,
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
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Error sending daily reminder email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// GET pour permettre l'appel depuis un cron externe
export async function GET(request: NextRequest) {
  try {
    // Récupérer les données depuis Supabase ou localStorage
    // Pour l'instant, on retourne une erreur car on a besoin des données
    return NextResponse.json(
      { error: 'POST method required with tasks data' },
      { status: 405 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}


