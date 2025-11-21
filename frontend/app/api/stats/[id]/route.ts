/**
 * API Route: /api/stats/[id]
 * Get conversation statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/global-db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const db = getDatabase();

    if (!db) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 503 }
      );
    }

    const { id: conversationId } = await params;
    const stats = await db.getConversationStats(conversationId);

    if (!stats) {
      return NextResponse.json(
        { error: 'No messages found for this conversation' },
        { status: 404 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching conversation stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to fetch stats: ${errorMessage}` },
      { status: 500 }
    );
  }
}
