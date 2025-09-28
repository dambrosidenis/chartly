import { NextRequest, NextResponse } from 'next/server';
import { runSchemaInvestigation } from '@/server/core';
import { validateConfig } from '@/server/config';

export async function GET(request: NextRequest) {
  try {
    // Validate configuration on startup
    validateConfig();
    
    console.log('Starting schema investigation...');
    
    // Run the schema investigation
    const result = await runSchemaInvestigation();
    
    console.log(`Schema investigation completed with ${result.examplePrompts.length} example prompts`);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Schema investigation API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Schema investigation failed',
        message: error.message,
        // Provide fallback data
        summary: 'Schema investigation failed',
        examplePrompts: [
          "Show data structure",
          "List tables",
          "Sample query"
        ],
        investigationSteps: [],
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
