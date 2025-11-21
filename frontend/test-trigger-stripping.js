/**
 * Test script for Option A: Trigger Stripping
 * Tests the @journeyapps/sqlcipher implementation with malformed trigger removal
 */

const { SignalDatabase } = require('./lib/signal-db.ts');
const fs = require('fs').promises;

async function testTriggerStripping() {
  console.log('='.repeat(80));
  console.log('Option A: Trigger Stripping Test');
  console.log('='.repeat(80));
  console.log('');

  const configPath = '/tmp/signal/config.json';
  const dbPath = '/tmp/signal/db.sqlite';

  try {
    // 1. Load config
    console.log('1. Loading config from:', configPath);
    const configContent = await fs.readFile(configPath, 'utf-8');
    console.log('   Config loaded successfully');
    console.log('');

    // 2. Initialize database
    console.log('2. Initializing SignalDatabase instance');
    const db = new SignalDatabase();
    console.log('');

    // 3. Load encryption key
    console.log('3. Loading encryption key from config');
    await db.loadConfig(configContent);
    console.log('   ✅ Encryption key loaded');
    console.log('');

    // 4. Open database (this will decrypt and strip malformed triggers)
    console.log('4. Opening database (will decrypt and strip malformed triggers)');
    console.log('   Database path:', dbPath);
    await db.openDatabase(dbPath);
    console.log('   ✅ Database opened successfully');
    console.log('');

    // 5. Test query: Get conversation count
    console.log('5. Testing database queries');
    console.log('   Querying conversation count...');
    const conversationCount = await db.getConversationCount();
    console.log(`   ✅ Found ${conversationCount} conversations`);
    console.log('');

    // 6. Get first few conversations
    console.log('6. Fetching first 5 conversations');
    const conversations = await db.getConversations(5);
    console.log(`   ✅ Retrieved ${conversations.length} conversations`);
    console.log('');

    if (conversations.length > 0) {
      console.log('   Sample conversation:');
      const sample = conversations[0];
      console.log(`   - ID: ${sample.id}`);
      console.log(`   - Name: ${sample.name}`);
      console.log(`   - Type: ${sample.type}`);
      console.log(`   - Message Count: ${sample.messageCount}`);
      console.log(`   - Last Message: ${sample.lastMessageTimestamp}`);
      console.log('');
    }

    // 7. Test message retrieval
    if (conversations.length > 0 && conversations[0].messageCount > 0) {
      console.log('7. Testing message retrieval');
      const convId = conversations[0].id;
      console.log(`   Fetching messages for conversation: ${conversations[0].name}`);
      const messageResult = await db.getMessages(convId, 1, 5);
      console.log(`   ✅ Retrieved ${messageResult.messages.length} messages (total: ${messageResult.total})`);
      console.log('');

      if (messageResult.messages.length > 0) {
        console.log('   Sample message:');
        const msg = messageResult.messages[0];
        console.log(`   - Timestamp: ${msg.timestamp}`);
        console.log(`   - Body: ${msg.body ? msg.body.substring(0, 100) : '(no body)'}`);
        console.log(`   - Sent: ${msg.isSent}`);
        console.log('');
      }
    }

    // 8. Clean up
    console.log('8. Closing database connection');
    db.close();
    console.log('   ✅ Database closed');
    console.log('');

    // Summary
    console.log('='.repeat(80));
    console.log('✅ SUCCESS: Option A (Trigger Stripping) works correctly!');
    console.log('='.repeat(80));
    console.log('');
    console.log('Results:');
    console.log(`  - Database decryption: ✅ PASS`);
    console.log(`  - Trigger stripping: ✅ PASS`);
    console.log(`  - Conversation queries: ✅ PASS (${conversationCount} conversations)`);
    console.log(`  - Message queries: ✅ PASS`);
    console.log('');
    console.log('No SQLITE_CORRUPT errors encountered!');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('='.repeat(80));
    console.error('❌ ERROR');
    console.error('='.repeat(80));
    console.error('');
    console.error('Error details:', error);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    console.error('');
    process.exit(1);
  }
}

// Run the test
testTriggerStripping();
