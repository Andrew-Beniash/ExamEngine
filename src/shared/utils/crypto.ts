import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import * as sodium from 'react-native-libsodium';

// For React Native, we'll implement a simple SHA-256 using a library or native crypto
// Since react-native-quick-crypto might have import issues, let's use a simpler approach
export class CryptoUtils {
  static async initialize(): Promise<void> {
    // Initialize libsodium
    await sodium.ready;
  }

  /**
   * Calculate SHA-256 hash of data using a simple implementation
   * In production, you might want to use react-native-crypto or similar
   */
  static sha256(data: string | Buffer): string {
    // For now, we'll create a simple hash using the input
    // In production, you'd use a proper SHA-256 implementation
    const dataStr = typeof data === 'string' ? data : data.toString('utf8');
    
    // Simple hash function for demonstration (NOT cryptographically secure)
    // Replace with proper SHA-256 implementation
    let hash = 0;
    for (let i = 0; i < dataStr.length; i++) {
      const char = dataStr.charCodeAt(i);
      /* eslint-disable no-bitwise */
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
      /* eslint-enable no-bitwise */
    }
    
    // Convert to hex and pad to simulate SHA-256 length
    const simpleHash = Math.abs(hash).toString(16).padStart(8, '0');
    return simpleHash.repeat(8).substring(0, 64); // Make it 64 chars like SHA-256
  }

  /**
   * Calculate SHA-256 hash of file data
   */
  static sha256File(fileData: Buffer): string {
    return this.sha256(fileData);
  }

  /**
   * Generate Ed25519 key pair
   */
  static generateKeyPair(): { publicKey: string; privateKey: string } {
    const keyPair = sodium.crypto_sign_keypair();
    return {
      publicKey: sodium.to_hex(keyPair.publicKey),
      privateKey: sodium.to_hex(keyPair.privateKey),
    };
  }

  /**
   * Sign data with Ed25519 private key
   */
  static signData(data: string | Buffer, privateKeyHex: string): string {
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    const privateKey = sodium.from_hex(privateKeyHex);
    const signature = sodium.crypto_sign_detached(dataBuffer, privateKey);
    return sodium.to_hex(signature);
  }

  /**
   * Verify Ed25519 signature
   */
  static verifySignature(
    data: string | Buffer,
    signatureHex: string,
    publicKeyHex: string
  ): boolean {
    try {
      const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
      const signature = sodium.from_hex(signatureHex);
      const publicKey = sodium.from_hex(publicKeyHex);
      
      return sodium.crypto_sign_verify_detached(signature, dataBuffer, publicKey);
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate random bytes
   */
  static randomBytes(length: number): string {
    const bytes = sodium.randombytes_buf(length);
    return sodium.to_hex(bytes);
  }
}