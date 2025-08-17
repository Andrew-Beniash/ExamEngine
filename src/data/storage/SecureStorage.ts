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
   * Store ad state for AdManager
   */
  storeAdState(adState: any): void {
    this.storage.set('ad_state', JSON.stringify(adState));
  }

  /**
   * Get ad state for AdManager
   */
  getAdState(): any | null {
    const data = this.storage.getString('ad_state');
    return data ? JSON.parse(data) : null;
  }

  /**
   * Generic method to store any JSON data
   */
  storeJson(key: string, data: any): void {
    this.storage.set(key, JSON.stringify(data));
  }

  /**
   * Generic method to retrieve JSON data
   */
  getJson<T>(key: string): T | null {
    const data = this.storage.getString(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Store a string value
   */
  storeString(key: string, value: string): void {
    this.storage.set(key, value);
  }

  /**
   * Get a string value
   */
  getString(key: string): string | null {
    return this.storage.getString(key) || null;
  }

  /**
   * Store a boolean value
   */
  storeBoolean(key: string, value: boolean): void {
    this.storage.set(key, value);
  }

  /**
   * Get a boolean value
   */
  getBoolean(key: string): boolean {
    return this.storage.getBoolean(key) || false;
  }

  /**
   * Store a number value
   */
  storeNumber(key: string, value: number): void {
    this.storage.set(key, value);
  }

  /**
   * Get a number value
   */
  getNumber(key: string): number {
    return this.storage.getNumber(key) || 0;
  }

  /**
   * Delete a key
   */
  deleteKey(key: string): void {
    this.storage.delete(key);
  }

  /**
   * Check if a key exists
   */
  hasKey(key: string): boolean {
    return this.storage.contains(key);
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