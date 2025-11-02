import { NextRequest, NextResponse } from 'next/server';
import { scoreTask } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required and must be a string' },
        { status: 400 }
      );
    }

    if (title.length > 500) {
      return NextResponse.json(
        { error: 'Title is too long (max 500 characters)' },
        { status: 400 }
      );
    }

    const result = await scoreTask(title);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in score-task API:', error);
    return NextResponse.json(
      { error: 'Failed to score task' },
      { status: 500 }
    );
  }
}


