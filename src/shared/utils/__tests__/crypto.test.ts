import { CryptoUtils } from '../crypto';

// Mock react-native-libsodium for testing
jest.mock('react-native-libsodium', () => ({
  ready: Promise.resolve(),
  crypto_sign_keypair: () => ({
    publicKey: new Uint8Array(32),
    privateKey: new Uint8Array(64),
  }),
  crypto_sign_detached: () => new Uint8Array(64),
  crypto_sign_verify_detached: () => true,
  from_hex: (hex: string) => new Uint8Array(hex.length / 2),
  to_hex: (bytes: Uint8Array) => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''),
  randombytes_buf: (length: number) => new Uint8Array(length),
}));

describe('CryptoUtils', () => {
  beforeAll(async () => {
    await CryptoUtils.initialize();
  });

  describe('SHA-256 Hashing', () => {
    test('should produce correct hash for known test vector', () => {
      const testData = 'The quick brown fox jumps over the lazy dog';
      const expectedHash = 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592';
      
      const actualHash = CryptoUtils.sha256(testData);
      expect(actualHash).toBe(expectedHash);
    });

    test('should produce correct hash for empty string', () => {
      const testData = '';
      const expectedHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      
      const actualHash = CryptoUtils.sha256(testData);
      expect(actualHash).toBe(expectedHash);
    });

    test('should produce different hashes for different inputs', () => {
      const hash1 = CryptoUtils.sha256('test1');
      const hash2 = CryptoUtils.sha256('test2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Ed25519 Operations', () => {
    test('should generate key pair', () => {
      const keyPair = CryptoUtils.generateKeyPair();
      
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(typeof keyPair.publicKey).toBe('string');
      expect(typeof keyPair.privateKey).toBe('string');
    });

    test('should sign and verify data', () => {
      const keyPair = CryptoUtils.generateKeyPair();
      const testData = 'Test message for signing';
      
      const signature = CryptoUtils.signData(testData, keyPair.privateKey);
      const isValid = CryptoUtils.verifySignature(testData, signature, keyPair.publicKey);
      
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(isValid).toBe(true);
    });

    test('should fail verification with wrong signature', () => {
      const keyPair = CryptoUtils.generateKeyPair();
      const testData = 'Test message';
      const wrongSignature = 'invalid_signature_hex';
      
      const isValid = CryptoUtils.verifySignature(testData, wrongSignature, keyPair.publicKey);
      expect(isValid).toBe(false);
    });
  });

  describe('Random Generation', () => {
    test('should generate random bytes', () => {
      const random1 = CryptoUtils.randomBytes(16);
      const random2 = CryptoUtils.randomBytes(16);
      
      expect(random1).toBeDefined();
      expect(random2).toBeDefined();
      expect(random1).not.toBe(random2);
      expect(random1.length).toBe(32); // 16 bytes = 32 hex chars
    });
  });
});