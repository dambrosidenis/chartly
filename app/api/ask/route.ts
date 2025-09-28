import { NextRequest, NextResponse } from 'next/server';
import { runQuestion } from '@/server/core';
import { askRequestSchema } from '@/server/validator';
import { validateConfig } from '@/server/config';

export async function POST(request: NextRequest) {
  try {
    // Validate configuration on startup
    validateConfig();
    
    // Parse and validate request body
    const body = await request.json();
    const validation = askRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request', 
          details: validation.error.errors.map(e => e.message).join(', ')
        },
        { status: 400 }
      );
    }
    
    const { query } = validation.data;
    
    console.log(`Processing query: "${query}"`);
    
    // Run the main orchestration
    const result = await runQuestion(query);
    
    // Return success or error response
    if ('error' in result) {
      console.log(`Query failed: ${result.error}`);
      return NextResponse.json(result, { status: 400 });
    } else {
      console.log(`Query succeeded with ${result.rows.length} rows`);
      return NextResponse.json(result);
    }
    
  } catch (error: any) {
    console.error('API route error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
