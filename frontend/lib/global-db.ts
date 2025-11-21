/**
 * Global database instance for Signal Archive Viewer
 * Used to maintain database state across API requests
 */

import { SignalDatabase } from './signal-db';

// Global state (similar to Python backend's global variables)
let globalDb: SignalDatabase | null = null;
let globalMode: 'upload' | 'volume' | null = null;

export function getDatabase(): SignalDatabase | null {
  return globalDb;
}

export function setDatabase(db: SignalDatabase, mode: 'upload' | 'volume'): void {
  if (globalDb) {
    globalDb.close();
  }
  globalDb = db;
  globalMode = mode;
}

export function getMode(): string | null {
  return globalMode;
}

export function clearDatabase(): void {
  if (globalDb) {
    globalDb.close();
  }
  globalDb = null;
  globalMode = null;
}

export function isInitialized(): boolean {
  return globalDb !== null;
}
