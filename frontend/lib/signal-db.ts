/**
 * Signal Database Utilities - TypeScript port of Python backend
 * Handles decryption and querying of Signal Desktop databases
 */

// Use require for native module (server-side only)
const { Database } = require('@journeyapps/sqlcipher');
import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

// Type definition for SQLCipher Database
type DatabaseInstance = any;

export interface SignalConfig {
  key?: string;
  encryptedKey?: string;
  safeStorageBackend?: string;
}

export interface Conversation {
  id: string;
  name: string;
  type: string;
  lastMessage?: string;
  lastMessageTimestamp?: Date;
  messageCount: number;
  unreadCount: number;
  isGroup?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string | null;
  body: string | null;
  timestamp: Date;
  isSent: boolean;
  hasAttachments: boolean;
}

export class SignalDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SignalDatabaseError';
  }
}

export class SignalDatabase {
  private db: DatabaseInstance | null = null;
  private encryptionKey: Buffer | null = null;

  /**
   * Load encryption key from config.json content
   */
  async loadConfig(configContent: string): Promise<void> {
    try {
      const config: SignalConfig = JSON.parse(configContent);

      // Try plain key first (old format)
      if (config.key) {
        const keyHex = config.key.trim();

        // Validate hex format
        if (!/^[0-9a-fA-F]+$/.test(keyHex)) {
          throw new SignalDatabaseError(
            `Invalid key format: key must be hexadecimal (0-9, a-f). ` +
            `Found invalid character. Current length: ${keyHex.length}`
          );
        }

        // Validate length (should be 64 hex characters = 32 bytes)
        if (keyHex.length !== 64) {
          throw new SignalDatabaseError(
            `Invalid key length: expected 64 hex characters, got ${keyHex.length}`
          );
        }

        this.encryptionKey = Buffer.from(keyHex, 'hex');
        console.log('Successfully extracted encryption key from config.json');
        return;
      }

      // Check for encrypted key (new format)
      if (config.encryptedKey && config.safeStorageBackend) {
        throw new SignalDatabaseError(
          `Encrypted key format detected (${config.safeStorageBackend}). ` +
          `This requires system keyring access which is not available in browser/Node.js. ` +
          `Please extract the key on your Signal Desktop system and use plain 'key' format.`
        );
      }

      throw new SignalDatabaseError(
        `No 'key' field found in config.json. ` +
        `This may not be a valid Signal Desktop config file.`
      );
    } catch (error) {
      if (error instanceof SignalDatabaseError) {
        throw error;
      }
      if (error instanceof SyntaxError) {
        throw new SignalDatabaseError(`Invalid JSON in config.json: ${error.message}`);
      }
      throw new SignalDatabaseError(`Failed to load config: ${error}`);
    }
  }

  /**
   * Decrypt and open Signal database
   *
   * Option A: Strip malformed triggers after opening database
   * Signal Desktop databases contain triggers with >> operator that cause SQLITE_CORRUPT
   */
  async openDatabase(dbPath: string): Promise<void> {
    if (!this.encryptionKey) {
      throw new SignalDatabaseError('Encryption key not loaded. Call loadConfig() first.');
    }

    try {
      // Open database with SQLCipher
      console.log('Opening database with @journeyapps/sqlcipher...');
      this.db = new Database(dbPath);

      // Set encryption key and SQLCipher settings (Signal Desktop SQLCipher 4.x settings)
      const keyHex = this.encryptionKey.toString('hex');
      this.db.exec(`PRAGMA key = "x'${keyHex}'";`);
      this.db.exec('PRAGMA cipher_page_size = 4096;');
      this.db.exec('PRAGMA kdf_iter = 64000;');
      this.db.exec('PRAGMA cipher_hmac_algorithm = HMAC_SHA512;');
      this.db.exec('PRAGMA cipher_kdf_algorithm = PBKDF2_HMAC_SHA512;');

      // OPTION A: Strip malformed triggers BEFORE schema validation
      // Use writable_schema to bypass malformed trigger errors during schema loading
      console.log('Stripping malformed triggers...');
      await this.stripMalformedTriggers();

      // Now test if decryption worked (after trigger stripping)
      const tableCount = await new Promise<number>((resolve, reject) => {
        this.db!.get('SELECT count(*) as count FROM sqlite_master WHERE type="table"', [], (err, row: any) => {
          if (err) reject(err);
          else resolve(row?.count || 0);
        });
      });
      console.log(`Database decrypted successfully. Schema contains ${tableCount} tables.`);

      console.log('Database ready for queries');
    } catch (error) {
      throw new SignalDatabaseError(
        `Failed to decrypt database. Ensure the database and key are correct: ${error}`
      );
    }
  }

  /**
   * Strip malformed triggers that contain >> operator
   * These triggers cause SQLITE_CORRUPT errors in @journeyapps/sqlcipher
   *
   * Uses writable_schema pragma to bypass schema validation during trigger removal
   */
  private async stripMalformedTriggers(): Promise<void> {
    try {
      // Enable writable_schema to bypass malformed schema validation
      console.log('Enabling writable_schema mode...');
      this.db!.exec('PRAGMA writable_schema = ON;');

      // Query sqlite_master directly (raw table, bypasses schema validation)
      const triggers = await new Promise<any[]>((resolve, reject) => {
        this.db!.all(
          `SELECT name, sql FROM sqlite_master WHERE type='trigger'`,
          [],
          (err, rows) => {
            if (err) {
              console.warn('Could not list triggers:', err.message);
              resolve([]);
            } else {
              resolve(rows || []);
            }
          }
        );
      });

      if (triggers.length === 0) {
        console.log('No triggers found');
        this.db!.exec('PRAGMA writable_schema = OFF;');
        return;
      }

      console.log(`Found ${triggers.length} total triggers`);

      // Find triggers with >> operator (malformed)
      const malformedTriggers = triggers.filter(t => t.sql && t.sql.includes('>>'));

      if (malformedTriggers.length > 0) {
        console.log(`Found ${malformedTriggers.length} malformed triggers to remove:`);
        malformedTriggers.forEach(t => console.log(`  - ${t.name}`));

        // Delete malformed triggers directly from sqlite_master
        for (const trigger of malformedTriggers) {
          try {
            await new Promise<void>((resolve, reject) => {
              this.db!.run(
                `DELETE FROM sqlite_master WHERE type='trigger' AND name=?`,
                [trigger.name],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
            console.log(`  ✓ Removed trigger: ${trigger.name}`);
          } catch (err: any) {
            console.warn(`  ✗ Failed to remove trigger ${trigger.name}:`, err.message);
          }
        }

        console.log('Malformed triggers removed successfully');
      } else {
        console.log('No malformed triggers found');
      }

      // Disable writable_schema and integrity check
      this.db!.exec('PRAGMA writable_schema = OFF;');

      // Run integrity check to rebuild internal schema cache
      console.log('Running integrity check...');
      await new Promise<void>((resolve, reject) => {
        this.db!.get('PRAGMA integrity_check;', [], (err, row: any) => {
          if (err) {
            console.warn('Integrity check warning:', err.message);
          } else {
            console.log('Integrity check result:', row);
          }
          resolve(); // Continue even if integrity check has warnings
        });
      });

    } catch (error: any) {
      // Ensure writable_schema is disabled even if error occurs
      try {
        this.db!.exec('PRAGMA writable_schema = OFF;');
      } catch (e) {
        // Ignore
      }
      console.warn('Error during trigger stripping:', error.message);
      // Don't throw - continue with database operations
    }
  }

  /**
   * Get list of conversations
   */
  async getConversations(limit: number = 100): Promise<Conversation[]> {
    if (!this.db) {
      throw new SignalDatabaseError('Database not open');
    }

    try {
      // Schema introspection like Python implementation - callback API
      console.log('Introspecting conversations table schema...');
      const columns = await new Promise<any[]>((resolve, reject) => {
        this.db!.all(`PRAGMA table_info(conversations)`, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
      const columnNames = columns.map((col: any) => col.name);
      console.log(`Conversations columns: ${columnNames.join(', ')}`);

      const query = `
        SELECT
          c.*,
          (SELECT COUNT(*) FROM messages m WHERE m.conversationId = c.id) as actual_message_count
        FROM conversations c
        ORDER BY c.active_at DESC
        LIMIT ?
      `;

      // Use callback API
      const rows = await new Promise<any[]>((resolve, reject) => {
        this.db!.all(query, [limit], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
      console.log(`getConversations: Found ${rows.length} conversations`);

      // Log first row to see what data we have (like Python implementation)
      if (rows.length > 0) {
        const firstRow = rows[0];
        console.log(`First conversation row keys: ${Object.keys(firstRow).join(', ')}`);
        const sampleEntries = Object.entries(firstRow).slice(0, 5);
        const sampleObj = Object.fromEntries(sampleEntries);
        console.log(`First conversation sample:`, JSON.stringify(sampleObj, null, 2));
      }

      return rows.map((row: any, index: number) => {
        // Parse JSON blob to extract unread count and last message
        let unreadCount = 0;
        let lastMessage: string | undefined;

        if (row.json) {
          try {
            const jsonData = JSON.parse(row.json);
            unreadCount = jsonData.unreadCount || 0;
            lastMessage = jsonData.lastMessage;
          } catch (e) {
            console.warn(`Failed to parse JSON for conversation ${row.id}`);
          }
        }

        // Debug: log the count for this conversation (like Python implementation)
        const convId = row.id || 'unknown';
        const convName = row.name || row.profileName || 'Unknown';
        const messageCount = row.actual_message_count || 0;
        if (index === 0) {
          console.log(`Conversation ${convName} (${convId}): message_count = ${messageCount}`);
        }

        return {
          id: convId,
          name: convName,
          type: row.type || 'private',
          lastMessage,
          lastMessageTimestamp: row.active_at
            ? new Date(row.active_at)
            : undefined,
          messageCount,
          unreadCount,
          isGroup: row.type === 'group',
        };
      });
    } catch (error: any) {
      console.error('Error in getConversations:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, page: number = 1, pageSize: number = 50) {
    if (!this.db) {
      throw new SignalDatabaseError('Database not open');
    }

    const offset = (page - 1) * pageSize;

    // Get total count using callback API
    const totalResult = await new Promise<any>((resolve, reject) => {
      this.db!.get('SELECT COUNT(*) as total FROM messages WHERE conversationId = ?', [conversationId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    const total = totalResult?.total || 0;

    // Get messages using callback API
    const query = `
      SELECT *
      FROM messages
      WHERE conversationId = ?
      ORDER BY sent_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await new Promise<any[]>((resolve, reject) => {
      this.db!.all(query, [conversationId, pageSize, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const messages: Message[] = rows.map((row: any) => ({
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.sourceServiceId || row.source || null,
      body: row.body || null,
      timestamp: row.sent_at ? new Date(row.sent_at) : new Date(),
      isSent: row.type === 'outgoing',
      hasAttachments: Boolean(row.hasAttachments),
    }));

    const hasMore = offset + messages.length < total;

    return {
      messages,
      total,
      page,
      pageSize,
      hasMore,
    };
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(conversationId: string) {
    if (!this.db) {
      throw new SignalDatabaseError('Database not open');
    }

    const query = `
      SELECT
        COUNT(*) as total_messages,
        SUM(CASE WHEN type = 'outgoing' THEN 1 ELSE 0 END) as sent_messages,
        SUM(CASE WHEN type = 'incoming' THEN 1 ELSE 0 END) as received_messages,
        MIN(sent_at) as first_message_date,
        MAX(sent_at) as last_message_date
      FROM messages
      WHERE conversationId = ?
    `;

    const result = await new Promise<any>((resolve, reject) => {
      this.db!.get(query, [conversationId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!result || result.total_messages === 0) {
      return null;
    }

    const talkMorePercentage =
      result.total_messages > 0
        ? Math.round((result.sent_messages / result.total_messages) * 100)
        : 0;

    return {
      conversationId,
      totalMessages: result.total_messages,
      sentMessages: result.sent_messages,
      receivedMessages: result.received_messages,
      firstMessageDate: result.first_message_date
        ? new Date(result.first_message_date)
        : null,
      lastMessageDate: result.last_message_date
        ? new Date(result.last_message_date)
        : null,
      talkMorePercentage,
    };
  }

  /**
   * Get conversation count
   */
  async getConversationCount(): Promise<number> {
    if (!this.db) {
      throw new SignalDatabaseError('Database not open');
    }

    try {
      // Use callback API
      const result = await new Promise<any>((resolve, reject) => {
        this.db!.get('SELECT COUNT(*) as count FROM conversations', [], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      const count = result?.count || 0;
      console.log(`getConversationCount: ${count} conversations found`);
      return count;
    } catch (error: any) {
      console.error('Error in getConversationCount:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('Database connection closed');
    }
  }
}
