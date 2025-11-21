/**
 * API Route: /api/conversations
 * Get list of all conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/global-db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();

    if (!db) {
      return NextResponse.json(
        { error: 'Database not initialized. Upload files first.' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const conversations = await db.getConversations(limit);

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to fetch conversations: ${errorMessage}` },
      { status: 500 }
    );
  }
}
