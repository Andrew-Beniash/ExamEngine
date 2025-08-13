import { MMKV } from 'react-native-mmkv';

export class SecureStorage {
  private static instance: SecureStorage;
  private storage: MMKV;

  private constructor() {
    this.storage = new MMKV({
      id: 'secure-keys',
      encryptionKey: 'exam-engine-secure-key-storage',
    });
  }

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  /**
   * Store pack verification public key
   */
  storePackPublicKey(packId: string, publicKey: string): void {
    this.storage.set(`pack_key_${packId}`, publicKey);
  }

  /**
   * Retrieve pack verification public key
   */
  getPackPublicKey(packId: string): string | null {
    return this.storage.getString(`pack_key_${packId}`) || null;
  }

  /**
   * Store device GUID (for analytics)
   */
  storeDeviceGuid(guid: string): void {
    this.storage.set('device_guid', guid);
  }

  /**
   * Get or generate device GUID
   */
  getDeviceGuid(): string {
    let guid = this.storage.getString('device_guid');
    if (!guid) {
      guid = this.generateDeviceGuid();
      this.storeDeviceGuid(guid);
    }
    return guid;
  }

  /**
   * Store pack installation metadata
   */
  storePackMetadata(packId: string, metadata: {
    installTime: number;
    checksum: string;
    signature: string;
    verified: boolean;
  }): void {
    this.storage.set(`pack_meta_${packId}`, JSON.stringify(metadata));
  }

  /**
   * Get pack installation metadata
   */
  getPackMetadata(packId: string): {
    installTime: number;
    checksum: string;
    signature: string;
    verified: boolean;
  } | null {
    const data = this.storage.getString(`pack_meta_${packId}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Remove all data for a pack
   */
  removePack(packId: string): void {
    this.storage.delete(`pack_key_${packId}`);
    this.storage.delete(`pack_meta_${packId}`);
  }

  /**
   * Clear all secure storage (for development/testing)
   */
  clearAll(): void {
    if (__DEV__) {
      this.storage.clearAll();
    }
  }

  private generateDeviceGuid(): string {
    // Generate a random GUID for device identification
    return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}