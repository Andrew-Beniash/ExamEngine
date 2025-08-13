import { Buffer } from 'buffer';
import RNFS from 'react-native-fs';
import { PackManifest } from '../../shared/types/contentPack';
import { PackValidator } from '../../data/validation/PackValidator';
import { PackVerifier } from '../../data/verification/PackVerifier';
import { SecureStorage } from '../../data/storage/SecureStorage';

export interface PackInstallationResult {
  success: boolean;
  packId: string;
  version: string;
  errors: string[];
  warnings: string[];
}

export interface DownloadProgress {
  packId: string;
  downloaded: number;
  total: number;
  percentage: number;
  status: 'downloading' | 'verifying' | 'installing' | 'complete' | 'error';
  error?: string;
}

export type ProgressCallback = (progress: DownloadProgress) => void;

export class PackManager {
  private static instance: PackManager;
  private downloads = new Map<string, XMLHttpRequest>();
  private validator = new PackValidator();
  private verifier = new PackVerifier();
  private secureStorage = SecureStorage.getInstance();

  private constructor() {}

  static getInstance(): PackManager {
    if (!PackManager.instance) {
      PackManager.instance = new PackManager();
    }
    return PackManager.instance;
  }

  /**
   * Get the app's packs directory
   */
  private getPacksDirectory(): string {
    return `${RNFS.DocumentDirectoryPath}/packs`;
  }

  /**
   * Get the temporary downloads directory
   */
  private getTempDirectory(): string {
    return `${RNFS.CachesDirectoryPath}/pack_downloads`;
  }

  /**
   * Ensure directories exist
   */
  private async ensureDirectories(): Promise<void> {
    const packsDir = this.getPacksDirectory();
    const tempDir = this.getTempDirectory();

    if (!(await RNFS.exists(packsDir))) {
      await RNFS.mkdir(packsDir);
    }

    if (!(await RNFS.exists(tempDir))) {
      await RNFS.mkdir(tempDir);
    }
  }

  /**
   * Check if pack is installed
   */
  async isPackInstalled(packId: string, version?: string): Promise<boolean> {
    try {
      const packDir = `${this.getPacksDirectory()}/${packId}`;
      const manifestPath = `${packDir}/manifest.json`;

      if (!(await RNFS.exists(manifestPath))) {
        return false;
      }

      if (version) {
        const manifestContent = await RNFS.readFile(manifestPath, 'utf8');
        const manifest: PackManifest = JSON.parse(manifestContent);
        return manifest.version === version;
      }

      return true;
    } catch (error) {
      console.error('Error checking pack installation:', error);
      return false;
    }
  }

  /**
   * Get installed pack version
   */
  async getInstalledVersion(packId: string): Promise<string | null> {
    try {
      const manifestPath = `${this.getPacksDirectory()}/${packId}/manifest.json`;
      
      if (!(await RNFS.exists(manifestPath))) {
        return null;
      }

      const manifestContent = await RNFS.readFile(manifestPath, 'utf8');
      const manifest: PackManifest = JSON.parse(manifestContent);
      return manifest.version;
    } catch (error) {
      console.error('Error getting installed version:', error);
      return null;
    }
  }

  /**
   * Check app version compatibility
   */
  checkCompatibility(manifest: PackManifest, appVersion: string): { compatible: boolean; reason?: string } {
    const compareVersions = (v1: string, v2: string): number => {
      const parts1 = v1.split('.').map(Number);
      const parts2 = v2.split('.').map(Number);
      
      for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;
        
        if (part1 < part2) return -1;
        if (part1 > part2) return 1;
      }
      return 0;
    };

    // Check minimum version
    if (compareVersions(appVersion, manifest.minAppVersion) < 0) {
      return {
        compatible: false,
        reason: `App version ${appVersion} is below minimum required ${manifest.minAppVersion}`
      };
    }

    // Check maximum version if specified
    if (manifest.maxAppVersion && compareVersions(appVersion, manifest.maxAppVersion) > 0) {
      return {
        compatible: false,
        reason: `App version ${appVersion} is above maximum supported ${manifest.maxAppVersion}`
      };
    }

    return { compatible: true };
  }

  /**
   * Download a pack with progress tracking
   */
  async downloadPack(
    packId: string,
    downloadUrl: string,
    onProgress?: ProgressCallback
  ): Promise<string> {
    await this.ensureDirectories();

    const tempPath = `${this.getTempDirectory()}/${packId}.zip`;
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      this.downloads.set(packId, xhr);

      xhr.open('GET', downloadUrl, true);
      xhr.responseType = 'blob';

      xhr.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress: DownloadProgress = {
            packId,
            downloaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
            status: 'downloading'
          };
          onProgress(progress);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          try {
            // Convert blob to buffer and save
            const blob = xhr.response;
            const buffer = Buffer.from(await blob.arrayBuffer());
            
            await RNFS.writeFile(tempPath, buffer.toString('base64'), 'base64');
            this.downloads.delete(packId);
            resolve(tempPath);
          } catch (error) {
            this.downloads.delete(packId);
            reject(new Error(`Failed to save downloaded pack: ${error}`));
          }
        } else {
          this.downloads.delete(packId);
          reject(new Error(`Download failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        this.downloads.delete(packId);
        reject(new Error('Download failed due to network error'));
      };

      xhr.ontimeout = () => {
        this.downloads.delete(packId);
        reject(new Error('Download timed out'));
      };

      xhr.timeout = 300000; // 5 minute timeout
      xhr.send();
    });
  }

  /**
   * Cancel an ongoing download
   */
  cancelDownload(packId: string): void {
    const xhr = this.downloads.get(packId);
    if (xhr) {
      xhr.abort();
      this.downloads.delete(packId);
    }
  }

  /**
   * Verify and install a downloaded pack
   */
  async installPack(
    packId: string,
    tempPath: string,
    manifest: PackManifest,
    onProgress?: ProgressCallback
  ): Promise<PackInstallationResult> {
    try {
      if (onProgress) {
        onProgress({
          packId,
          downloaded: 0,
          total: 100,
          percentage: 0,
          status: 'verifying'
        });
      }

      // Read the downloaded file
      const packData = await RNFS.readFile(tempPath, 'base64');
      const packBuffer = Buffer.from(packData, 'base64');

      // Verify pack integrity
      const verificationResult = this.verifier.verifyPackIntegrity(packBuffer, manifest);
      
      if (!verificationResult.isValid) {
        return {
          success: false,
          packId: manifest.id,
          version: manifest.version,
          errors: ['Pack verification failed', ...verificationResult.errors],
          warnings: verificationResult.warnings
        };
      }

      if (onProgress) {
        onProgress({
          packId,
          downloaded: 50,
          total: 100,
          percentage: 50,
          status: 'installing'
        });
      }

      // Create pack directory
      const packDir = `${this.getPacksDirectory()}/${packId}`;
      const backupDir = `${packDir}_backup_${Date.now()}`;

      // Backup existing installation if it exists
      if (await RNFS.exists(packDir)) {
        await RNFS.moveFile(packDir, backupDir);
      }

      try {
        // Extract pack (simplified - in production you'd use a proper zip library)
        await RNFS.mkdir(packDir);
        await RNFS.copyFile(tempPath, `${packDir}/pack.zip`);

        // Save manifest
        await RNFS.writeFile(
          `${packDir}/manifest.json`,
          JSON.stringify(manifest, null, 2),
          'utf8'
        );

        // Store pack metadata in secure storage
        this.secureStorage.storePackMetadata(packId, {
          installTime: Date.now(),
          checksum: manifest.checksum,
          signature: manifest.signature,
          verified: true
        });

        // Clean up
        await RNFS.unlink(tempPath);
        if (await RNFS.exists(backupDir)) {
          await RNFS.unlink(backupDir);
        }

        if (onProgress) {
          onProgress({
            packId,
            downloaded: 100,
            total: 100,
            percentage: 100,
            status: 'complete'
          });
        }

        return {
          success: true,
          packId: manifest.id,
          version: manifest.version,
          errors: [],
          warnings: verificationResult.warnings
        };

      } catch (installError) {
        // Rollback on installation failure
        if (await RNFS.exists(packDir)) {
          await RNFS.unlink(packDir);
        }
        if (await RNFS.exists(backupDir)) {
          await RNFS.moveFile(backupDir, packDir);
        }
        throw installError;
      }

    } catch (error) {
      if (onProgress) {
        onProgress({
          packId,
          downloaded: 0,
          total: 100,
          percentage: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      return {
        success: false,
        packId: manifest.id,
        version: manifest.version,
        errors: [`Installation failed: ${error}`],
        warnings: []
      };
    }
  }

  /**
   * Uninstall a pack
   */
  async uninstallPack(packId: string): Promise<boolean> {
    try {
      const packDir = `${this.getPacksDirectory()}/${packId}`;
      
      if (await RNFS.exists(packDir)) {
        await RNFS.unlink(packDir);
      }

      // Remove from secure storage
      this.secureStorage.removePack(packId);

      return true;
    } catch (error) {
      console.error('Failed to uninstall pack:', error);
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  async getStorageUsage(): Promise<{
    totalSize: number;
    packsSize: number;
    tempSize: number;
    packs: Array<{ id: string; size: number; version: string }>;
  }> {
    try {
      const packsDir = this.getPacksDirectory();
      const tempDir = this.getTempDirectory();

      let packsSize = 0;
      let tempSize = 0;
      const packs: Array<{ id: string; size: number; version: string }> = [];

      // Calculate packs directory size
      if (await RNFS.exists(packsDir)) {
        const packDirs = await RNFS.readDir(packsDir);
        
        for (const dir of packDirs) {
          if (dir.isDirectory()) {
            const dirSize = await this.getDirectorySize(dir.path);
            packsSize += dirSize;

            // Get pack version from manifest
            const manifestPath = `${dir.path}/manifest.json`;
            let version = 'unknown';
            try {
              if (await RNFS.exists(manifestPath)) {
                const manifestContent = await RNFS.readFile(manifestPath, 'utf8');
                const manifest: PackManifest = JSON.parse(manifestContent);
                version = manifest.version;
              }
            } catch (error) {
              console.warn('Failed to read manifest for pack:', dir.name);
            }

            packs.push({
              id: dir.name,
              size: dirSize,
              version
            });
          }
        }
      }

      // Calculate temp directory size
      if (await RNFS.exists(tempDir)) {
        tempSize = await this.getDirectorySize(tempDir);
      }

      return {
        totalSize: packsSize + tempSize,
        packsSize,
        tempSize,
        packs
      };
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      return {
        totalSize: 0,
        packsSize: 0,
        tempSize: 0,
        packs: []
      };
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(): Promise<void> {
    try {
      const tempDir = this.getTempDirectory();
      
      if (await RNFS.exists(tempDir)) {
        const files = await RNFS.readDir(tempDir);
        
        for (const file of files) {
          // Delete files older than 24 hours
          const ageHours = (Date.now() - new Date(file.mtime!).getTime()) / (1000 * 60 * 60);
          if (ageHours > 24) {
            await RNFS.unlink(file.path);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup temp files:', error);
    }
  }

  /**
   * Get size of a directory recursively
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    try {
      const items = await RNFS.readDir(dirPath);
      let totalSize = 0;

      for (const item of items) {
        if (item.isDirectory()) {
          totalSize += await this.getDirectorySize(item.path);
        } else {
          totalSize += item.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to calculate directory size:', error);
      return 0;
    }
  }
}
