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
   * Get encryption key from provided string or throw error
   */
  private static getKey(encryptionKey: string): Buffer {
    if (!encryptionKey) {
      throw new Error('Encryption key is not provided');
    }

    // Convert hex string to buffer
    const keyBuffer = Buffer.from(encryptionKey, 'hex');

    if (keyBuffer.length !== this.keyLength) {
      throw new Error(`Encryption key must be ${this.keyLength * 2} hex characters (${this.keyLength} bytes)`);
    }

    return keyBuffer;
  }

  /**
   * Decrypt a string value
   * @param encryptedText Encrypted text with IV (format: iv:encryptedData)
   * @param encryptionKey Encryption key as hex string
   * @returns Decrypted plain text
   */
  static decrypt(encryptedText: string, encryptionKey: string): string {
    if (!encryptedText) {
      throw new Error('Cannot decrypt empty text');
    }

    const key = this.getKey(encryptionKey);

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
}
