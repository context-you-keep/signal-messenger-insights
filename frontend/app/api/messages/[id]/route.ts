/**
 * API Route: /api/messages/[id]
 * Get messages for a specific conversation
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (page < 1) {
      return NextResponse.json(
        { error: 'Page must be >= 1' },
        { status: 400 }
      );
    }

    if (pageSize < 1 || pageSize > 500) {
      return NextResponse.json(
        { error: 'Page size must be between 1 and 500' },
        { status: 400 }
      );
    }

    const result = await db.getMessages(conversationId, page, pageSize);

    // Transform messages to match frontend Message type
    const transformedResult = {
      ...result,
      messages: result.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.body || '',
        timestamp: new Date(msg.timestamp).toLocaleString(),
        sender: msg.senderId || 'Unknown',
        isSent: msg.isSent,
        status: msg.isSent ? 'sent' : undefined,
        hasAttachments: msg.hasAttachments,
      })),
    };

    return NextResponse.json(transformedResult);
  } catch (error) {
    console.error('Error fetching messages:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to fetch messages: ${errorMessage}` },
      { status: 500 }
    );
  }
}
