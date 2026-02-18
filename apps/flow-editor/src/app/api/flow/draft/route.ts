import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Flow, FlowDraft } from '@/lib/flow-types';

const DRAFT_FILE = path.join(process.cwd(), 'flow-draft.json');

/**
 * GET /api/flow/draft
 * Returns the saved draft flow if it exists
 */
export async function GET() {
  try {
    const exists = await fs.access(DRAFT_FILE).then(() => true).catch(() => false);
    
    if (!exists) {
      return NextResponse.json(null);
    }

    const content = await fs.readFile(DRAFT_FILE, 'utf-8');
    const draft: FlowDraft = JSON.parse(content);
    return NextResponse.json(draft);
  } catch (error) {
    console.error('Error reading draft:', error);
    return NextResponse.json(
      { error: 'Failed to read draft' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/flow/draft
 * Saves a draft flow to the filesystem
 */
export async function POST(request: NextRequest) {
  try {
    const flow: Flow = await request.json();
    
    const draft: FlowDraft = {
      ...flow,
      lastModified: new Date().toISOString(),
      basedOnVersion: flow.metadata.version,
    };

    await fs.writeFile(DRAFT_FILE, JSON.stringify(draft, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true, path: DRAFT_FILE });
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/flow/draft
 * Deletes the draft file
 */
export async function DELETE() {
  try {
    await fs.unlink(DRAFT_FILE);
    return NextResponse.json({ success: true });
  } catch (error) {
    // File might not exist, that's okay
    return NextResponse.json({ success: true });
  }
}
