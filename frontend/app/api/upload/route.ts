/**
 * API Route: /api/upload
 * Handle upload of config.json and db.sqlite files
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { SignalDatabase } from '@/lib/signal-db';
import { setDatabase, clearDatabase } from '@/lib/global-db';

// Force this route to be dynamic (not pre-rendered at build time)
export const dynamic = 'force-dynamic';

// Suppress SQLITE_CORRUPT errors from corrupted triggers globally
// These are async errors that don't affect functionality since we don't use triggers
// This matches the Python implementation's behavior where pysqlcipher3 ignores trigger corruption
if (typeof process !== 'undefined' && process.listenerCount && !process.listenerCount('uncaughtException')) {
  process.on('uncaughtException', (error: Error) => {
    if (error.message?.includes('SQLITE_CORRUPT') &&
        error.message?.includes('messages_on_insert')) {
      // Silently ignore - this is expected with corrupted Signal Desktop databases
      // The corruption is in triggers we don't use, not in the actual data
      console.log('Suppressed expected SQLITE_CORRUPT error from malformed trigger');
      return;
    }
    // Log and continue for other errors (don't crash the server)
    console.error('Uncaught exception:', error);
  });
}

export async function POST(request: NextRequest) {
  try {
    // Clear any existing database
    clearDatabase();

    // Get form data
    const formData = await request.formData();
    const configFile = formData.get('config') as File | null;
    const dbFile = formData.get('database') as File | null;
    const extractedKey = formData.get('extractedKey') as string | null;

    if (!configFile || !dbFile) {
      return NextResponse.json(
        { error: 'Both config and database files are required' },
        { status: 400 }
      );
    }

    // Create temporary directory
    const tempDir = join(tmpdir(), `signal_upload_${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    const configPath = join(tempDir, 'config.json');
    const dbPath = join(tempDir, 'db.sqlite');

    // Write files to disk
    const configBuffer = Buffer.from(await configFile.arrayBuffer());
    const dbBuffer = Buffer.from(await dbFile.arrayBuffer());

    await writeFile(configPath, configBuffer);
    await writeFile(dbPath, dbBuffer);

    // Initialize Signal database
    const db = new SignalDatabase();

    // Load config and extract encryption key
    // If extractedKey is provided (user pasted from clipboard), it takes priority
    const configContent = configBuffer.toString('utf-8');
    await db.loadConfig(configContent, extractedKey || undefined);

    // Decrypt and open database
    await db.openDatabase(dbPath);

    // Get conversation count
    const conversationCount = await db.getConversationCount();

    // Store in global state
    setDatabase(db, 'upload');

    console.log(`Successfully initialized from uploaded files. Found ${conversationCount} conversations.`);

    return NextResponse.json({
      success: true,
      message: `Successfully loaded Signal database with ${conversationCount} conversations`,
      conversationCount,
    });
  } catch (error) {
    console.error('Upload failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: `Failed to process uploaded files: ${errorMessage}`,
      },
      { status: 400 }
    );
  }
}
