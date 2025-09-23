import * as crypto from 'crypto';

/**
 * Utility class for encrypting and decrypting sensitive data
 * Uses AES-256-CBC algorithm for secure token storage
 */
export class CryptoUtil {
  private static algorithm = 'aes-256-cbc'; //USA gov security standard
  private static keyLength = 32; // 256 bits
  private static ivLength = 16;  // 128 bits

  /**
   * Get encryption key from environment or throw error
   */
  private static getKey(): Buffer {
    const key = process.env.TOKEN_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('TOKEN_ENCRYPTION_KEY environment variable is not set');
    }

    // Convert hex string to buffer
    const keyBuffer = Buffer.from(key, 'hex');

    if (keyBuffer.length !== this.keyLength) {
      throw new Error(`Encryption key must be ${this.keyLength * 2} hex characters (${this.keyLength} bytes)`);
    }

    return keyBuffer;
  }

  /**
   * Encrypt a string value
   * @param text Plain text to encrypt
   * @returns Encrypted text with IV prepended (format: iv:encryptedData)
   */
  static encrypt(text: string): string {
    if (!text) {
      throw new Error('Cannot encrypt empty text');
    }

    const key = this.getKey();
    const iv = crypto.randomBytes(this.ivLength);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV and encrypted data together
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt a string value
   * @param encryptedText Encrypted text with IV (format: iv:encryptedData)
   * @returns Decrypted plain text
   */
  static decrypt(encryptedText: string): string {
    if (!encryptedText) {
      throw new Error('Cannot decrypt empty text');
    }

    const key = this.getKey();

    // Split IV and encrypted data
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    if (iv.length !== this.ivLength) {
      throw new Error('Invalid IV length');
    }

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate a new encryption key for initial setup
   * This should be run once and the result saved to environment variables
   */
  static generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }
}