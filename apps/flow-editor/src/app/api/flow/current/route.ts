import { NextResponse } from 'next/server';
import { parseFlowFromCode } from '@/lib/flow-parser';

/**
 * GET /api/flow/current
 * Returns the current flow parsed from the codebase
 */
export async function GET() {
  try {
    const flow = parseFlowFromCode();
    return NextResponse.json(flow);
  } catch (error) {
    console.error('Error parsing flow:', error);
    return NextResponse.json(
      { error: 'Failed to parse flow from code' },
      { status: 500 }
    );
  }
}
