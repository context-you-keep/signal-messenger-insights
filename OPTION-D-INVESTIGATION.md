# Option D Investigation: better-sqlite3-multiple-ciphers

## Date: 2025-11-20

## Objective
Replace @journeyapps/sqlcipher with better-sqlite3-multiple-ciphers to gain synchronous API similar to Python's pysqlcipher3, hoping this would handle malformed triggers more gracefully.

## Implementation Progress

### ✅ Completed
1. **Package Installation**: Successfully installed better-sqlite3-multiple-ciphers@12.4.1
2. **API Migration**: Fully migrated from callback-based to synchronous API
3. **Next.js Configuration**: Fixed native binding loading by adding to serverExternalPackages
4. **Code Refactoring**: All database methods (getConversations, getMessages, etc.) converted to synchronous API

### ❌ Blocking Issue
**"file is not a database" error** - Unable to decrypt Signal Desktop database despite correct key

## Configuration Attempts

### Attempt 1: Direct pragma approach (Python-style)
```javascript
db.pragma(`cipher='sqlcipher'`);
db.pragma(`legacy=4`);
db.pragma(`key="x'${keyHex}'"`);
db.pragma('cipher_page_size = 4096');
db.pragma('kdf_iter = 64000');
db.pragma('cipher_hmac_algorithm = 2');  // SHA512
db.pragma('cipher_kdf_algorithm = 2');   // SHA512
```
**Result**: ❌ file is not a database

### Attempt 2: Parameters before key (per docs)
```javascript
db.pragma(`cipher='sqlcipher'`);
db.pragma(`legacy=4`);
db.pragma('cipher_page_size = 4096');
db.pragma('kdf_iter = 64000');
db.pragma('cipher_hmac_algorithm = 2');
db.pragma('cipher_kdf_algorithm = 2');
db.pragma(`key="x'${keyHex}'"`);
```
**Result**: ❌ file is not a database

### Attempt 3: Simple key without x' prefix
```javascript
db.pragma(`cipher='sqlcipher'`);
db.pragma(`key='${keyHex}'`);
```
**Result**: ❌ file is not a database

### Attempt 4: Without legacy=4
```javascript
db.pragma(`cipher='sqlcipher'`);
db.pragma(`key='${keyHex}'`);
```
**Result**: ❌ file is not a database

## Key Learnings

1. **SQLite3MultipleCiphers uses NUMERIC hash algorithm values**:
   - 0 = SHA1
   - 1 = SHA256
   - 2 = SHA512
   - NOT string values like 'HMAC_SHA512'

2. **Pragma order matters** according to docs:
   - Select cipher scheme
   - Set configuration parameters
   - Apply encryption key

3. **Python's pysqlcipher3 works** with same database/key, proving:
   - Database file is valid
   - Key is correct
   - Issue is library/configuration specific

## Root Cause Analysis

The issue appears to be one of:

1. **Cipher scheme mismatch**: Signal Desktop may use a specific SQLCipher variant that better-sqlite3-multiple-ciphers doesn't support in the same way
2. **Parameter incompatibility**: The exact cipher configuration Signal uses may not map 1:1 to better-sqlite3-multiple-ciphers pragmas
3. **Key format issue**: Despite various attempts, the key format/encoding may still be incorrect for this library
4. **Legacy mode incompatibility**: Signal's specific SQLCipher 4.x implementation may differ from standard SQLCipher 4

## Why Python Works

Python's `pysqlcipher3` likely:
- Has different default settings that match Signal's defaults
- Handles legacy SQLCipher formats differently
- Has more lenient configuration matching
- Uses different underlying SQLCipher bindings

## Time Investment

- Research: ~1 hour
- Implementation: ~2 hours
- Debugging: ~2 hours
- **Total: ~5 hours**

## Recommendation: Switch to Option A

### Option A: Trigger Stripping
**Approach**: Keep existing library, strip malformed triggers on database open

**Advantages**:
- Works with proven @journeyapps/sqlcipher library
- Surgical fix for the actual problem (malformed triggers)
- Lower complexity
- Predictable outcome

**Implementation**:
```typescript
async openDatabase(dbPath: string): Promise<void> {
  // Open and decrypt as normal
  await this.decryptDatabase(dbPath);

  // Query for triggers with >> operator
  const triggers = await this.db.all(
    `SELECT name FROM sqlite_master WHERE type='trigger' AND sql LIKE '%>>%'`
  );

  // Drop malformed triggers
  for (const trigger of triggers) {
    await this.db.exec(`DROP TRIGGER IF EXISTS ${trigger.name}`);
  }
}
```

**Trade-offs**:
- Modifies database schema (drops triggers)
- Triggers may serve a purpose (need to verify)
- But: Triggers with `>>` are likely malformed/unused

### Alternative: Hybrid Approach

If we still want to pursue better-sqlite3-multiple-ciphers:
1. Implement Option A as primary solution
2. Keep better-sqlite3-multiple-ciphers code for future investigation
3. Create feature flag to test both approaches

## Files Modified (Option D)

```
frontend/lib/signal-db.ts - Complete refactor to synchronous API
frontend/package.json - Added better-sqlite3-multiple-ciphers
frontend/next.config.ts - Added serverExternalPackages
frontend/components/signal-chat-archive.tsx - TypeScript fixes
```

## Rollback Plan

If Option A also fails:
1. Keep @journeyapps/sqlcipher
2. Implement error handling for SQLITE_CORRUPT
3. Use try/catch around schema introspection
4. Query tables directly without introspection

## Conclusion

Option D (better-sqlite3-multiple-ciphers) was a reasonable approach based on:
- Synchronous API matching Python
- Better SQLite3MultipleCiphers support
- Active maintenance

However, **cryptographic configuration incompatibility** proved to be an insurmountable obstacle within reasonable time constraints.

**RECOMMENDATION**: Proceed with Option A (Trigger Stripping)

This provides:
- ✅ Surgical fix for the actual problem
- ✅ Works with proven library (@journeyapps/sqlcipher)
- ✅ Minimal code changes
- ✅ Predictable outcome
- ✅ Can be implemented in <1 hour

The malformed triggers are the root cause, not the library choice. Removing them directly solves the problem without fighting library configuration incompatibilities.
