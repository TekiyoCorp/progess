import { NextRequest, NextResponse } from 'next/server';
import { solveProblem, scoreTask } from '@/lib/claude';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received solve-problem request');
    console.log('   OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
    console.log('   OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
    
    const body = await request.json();
    const { title, problemId, createTask = true } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required and must be a string' },
        { status: 400 }
      );
    }

    if (title.length > 1000) {
      return NextResponse.json(
        { error: 'Title is too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    console.log('   Problem title:', title);
    const solution = await solveProblem(title);
    console.log('   Solution received, length:', solution.length);

    // Créer automatiquement une tâche pour appliquer la solution
    let taskCreated = false;
    if (createTask && problemId) {
      try {
        console.log('📝 Creating task to apply solution...');
        
        // Extraire un titre court de la solution (première action)
        const cleanSolution = solution
          .replace(/\*\*Action\*\*:\s*/gi, '')
          .replace(/\*\*[^*]+\*\*:\s*/gi, '')
          .replace(/\d+\.\s*/g, '')
          .split('\n')
          .filter(line => line.trim().length > 0)[0] || title;
        
        const taskTitle = cleanSolution.length > 80 
          ? `${cleanSolution.substring(0, 77)}...`
          : cleanSolution;

        // Scorer la tâche avec l'IA
        const { percentage, type } = await scoreTask(taskTitle);
        
        // Insérer la tâche dans Supabase
        if (supabase) {
          const { data: taskData, error: taskError } = await supabase
            .from('tasks')
            .insert({
              title: taskTitle,
              percentage: percentage || 1,
              type: type || 'other',
              completed: false,
            })
            .select()
            .single();

          if (!taskError && taskData) {
            console.log('✅ Task created successfully:', taskData.id);
            taskCreated = true;
          } else {
            console.error('❌ Failed to insert task in Supabase:', taskError);
          }
        } else {
          // Si pas de Supabase, la tâche sera créée côté client via l'événement
          console.log('⚠️ No Supabase connection, task will be created client-side');
        }
      } catch (taskError) {
        console.error('⚠️ Failed to create task (non-critical):', taskError);
        // Ne pas bloquer la résolution du problème si la création de tâche échoue
      }
    }

    return NextResponse.json({ 
      solution,
      taskCreated,
    });
  } catch (error) {
    console.error('❌ Error in solve-problem API:', error);
    console.error('   Error details:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to solve problem' },
      { status: 500 }
    );
  }
}

