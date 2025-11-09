import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI instance will be created in POST handler

export async function POST(request: NextRequest) {
  try {
        // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

const { folders, goal, tasks = [] } = await request.json();

    console.log('💰 [API] Received folders:', JSON.stringify(folders, null, 2));

    // Calculer le CA basé sur les prix des dossiers et leur complétion
    const { calculateRevenueFromFolders } = await import('@/lib/revenue');
    
    // Calculer le CA réel depuis les dossiers et tâches
    const totalRevenue = calculateRevenueFromFolders(folders, tasks);
    
    console.log('💰 [API] Total revenue calculated from folders:', totalRevenue);

    // Calculer le CA confirmé (dossiers 100% complétés) vs potentiel
    const confirmedRevenue = folders
      .filter((f: any) => f.completed_percentage === 100)
      .reduce((sum: number, f: any) => sum + (f.price || 0), 0);

    const potentialRevenue = folders
      .filter((f: any) => f.completed_percentage < 100 && f.completed_percentage > 0)
      .reduce((sum: number, f: any) => sum + (f.price || 0), 0);

    const unstarted = folders
      .filter((f: any) => f.completed_percentage === 0)
      .reduce((sum: number, f: any) => sum + (f.price || 0), 0);

    // Calculer la confiance basée sur le % moyen de complétion
    const avgCompletion = folders.length > 0
      ? folders.reduce((sum: number, f: any) => sum + (f.completed_percentage || 0), 0) / folders.length
      : 0;

    const confidence = Math.min(95, Math.round(
      (confirmedRevenue / totalRevenue) * 100 + avgCompletion * 0.5
    ));

    // SIMPLE: Addition des prix de tous les dossiers
    // Pas de coefficients, juste la SOMME
    const forecast = totalRevenue;

    console.log('💰 [API] Calcul simple:');
    console.log('  - Total des prix:', totalRevenue, '€');
    console.log('  - FORECAST:', forecast, '€');

    // Calculer la confiance basée sur la complétion moyenne
    const finalConfidence = Math.min(95, Math.round(avgCompletion));

    return NextResponse.json({
      forecast: Math.round(forecast),
      confidence: finalConfidence || 10,
      breakdown: {
        confirmed: confirmedRevenue,
        likely: potentialRevenue,
        potential: unstarted,
      },
      gap: goal - Math.round(forecast),
      actions: [
        totalRevenue < goal ? `Ajouter ${Math.round((goal - totalRevenue) / 5000)} projets à 5k€` : 'Continue comme ça',
        avgCompletion < 50 ? 'Finis les projets en cours' : 'Bon rythme !',
      ],
    });
  } catch (error) {
    console.error('Error forecasting revenue:', error);
    const goal = 50000;
    return NextResponse.json({ 
      forecast: 0, 
      confidence: 0,
      breakdown: { confirmed: 0, likely: 0, potential: 0 },
      gap: goal,
      actions: ['Ajoute des projets avec des prix'],
    });
  }
}

