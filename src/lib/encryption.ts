/**
 * Encryption service for securing sensitive data
 * Uses AES-256-GCM encryption
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // AES block size
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment variable
 * Key should be a 64-character hex string (32 bytes)
 * Generate with: openssl rand -hex 32
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.GOOGLE_OAUTH_ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error(
      'GOOGLE_OAUTH_ENCRYPTION_KEY is not set in environment variables. ' +
      'Generate one with: openssl rand -hex 32'
    );
  }

  if (keyHex.length !== 64) {
    throw new Error(
      'GOOGLE_OAUTH_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
      'Generate one with: openssl rand -hex 32'
    );
  }

  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt plaintext using AES-256-GCM
 * Returns encrypted string in format: [IV:AuthTag:Ciphertext] (hex-encoded)
 *
 * @param plaintext - The text to encrypt
 * @returns Encrypted string (hex-encoded)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string');
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: IV:AuthTag:Ciphertext (all hex-encoded)
    const encrypted = `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;

    return encrypted;
  } catch (error) {
    console.error('[Encryption] Error encrypting data:', error);
    throw new Error(`Encryption failed: ${(error as Error).message}`);
  }
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * Expects input in format: [IV:AuthTag:Ciphertext] (hex-encoded)
 *
 * @param encrypted - The encrypted string (hex-encoded)
 * @returns Decrypted plaintext
 */
export function decrypt(encrypted: string): string {
  if (!encrypted) {
    throw new Error('Cannot decrypt empty string');
  }

  try {
    const key = getEncryptionKey();

    // Parse encrypted string
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, ciphertext] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(`Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`);
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    console.error('[Encryption] Error decrypting data:', error);
    throw new Error(`Decryption failed: ${(error as Error).message}`);
  }
}

/**
 * Test encryption/decryption round-trip
 * For development and testing purposes only
 */
export function testEncryption(testString: string = 'Hello, World!'): boolean {
  try {
    const encrypted = encrypt(testString);
    const decrypted = decrypt(encrypted);

    const success = decrypted === testString;

    if (success) {
      console.log('[Encryption] Round-trip test PASSED');
    } else {
      console.error('[Encryption] Round-trip test FAILED');
      console.error('  Original:', testString);
      console.error('  Decrypted:', decrypted);
    }

    return success;
  } catch (error) {
    console.error('[Encryption] Round-trip test ERROR:', error);
    return false;
  }
}
