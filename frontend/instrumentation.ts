// Global instrumentation - runs once when the server starts
// See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Suppress SQLITE_CORRUPT errors from corrupted triggers
    // These are async errors that don't affect functionality since we don't use triggers
    // This matches the Python implementation's behavior where pysqlcipher3 ignores trigger corruption
    process.removeAllListeners('uncaughtException');

    process.on('uncaughtException', (error: Error) => {
      if (error.message?.includes('SQLITE_CORRUPT') &&
          error.message?.includes('messages_on_insert')) {
        // Silently ignore - this is expected with corrupted Signal Desktop databases
        // The corruption is in triggers we don't use, not in the actual data
        console.log('[instrumentation] Suppressed expected SQLITE_CORRUPT error from malformed trigger');
        return;
      }
      // Log other errors but don't crash the server
      console.error('[instrumentation] Uncaught exception:', error);
    });

    console.log('[instrumentation] Global error handlers registered');
  }
}
