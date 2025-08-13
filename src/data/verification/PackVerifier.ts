import { Buffer } from 'buffer';
import { CryptoUtils } from '../../shared/utils/crypto';
import { PackManifest } from '../../shared/types/contentPack';

export interface VerificationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PackKeys {
  publicKey: string;
  // Private key should only be available in development/authoring tools
  privateKey?: string;
}

export class PackVerifier {
  // Embedded public key for pack verification
  // In production, this would be your actual public key
  private static readonly PACK_PUBLIC_KEY = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  constructor(private customPublicKey?: string) {}

  /**
   * Verify pack checksum
   */
  verifyChecksum(packData: Buffer, expectedChecksum: string): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const actualChecksum = CryptoUtils.sha256File(packData);
      
      if (actualChecksum.toLowerCase() !== expectedChecksum.toLowerCase()) {
        errors.push(`Checksum mismatch. Expected: ${expectedChecksum}, Got: ${actualChecksum}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`Checksum verification failed: ${error}`);
      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Verify pack signature
   */
  verifySignature(packData: Buffer, signature: string, publicKey?: string): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const keyToUse = publicKey || this.customPublicKey || PackVerifier.PACK_PUBLIC_KEY;
      
      if (!keyToUse) {
        errors.push('No public key available for signature verification');
        return { isValid: false, errors, warnings };
      }

      // Verify signature format
      if (!/^[a-fA-F0-9]+$/.test(signature)) {
        errors.push('Invalid signature format - must be hexadecimal');
        return { isValid: false, errors, warnings };
      }

      if (!/^[a-fA-F0-9]{64}$/.test(keyToUse)) {
        errors.push('Invalid public key format - must be 64 character hex string');
        return { isValid: false, errors, warnings };
      }

      const isValid = CryptoUtils.verifySignature(packData, signature, keyToUse);
      
      if (!isValid) {
        errors.push('Signature verification failed - pack may be tampered with');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`Signature verification failed: ${error}`);
      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Verify complete pack integrity
   */
  verifyPackIntegrity(
    packData: Buffer,
    manifest: PackManifest,
    publicKey?: string
  ): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verify checksum
    const checksumResult = this.verifyChecksum(packData, manifest.checksum);
    errors.push(...checksumResult.errors);
    warnings.push(...checksumResult.warnings);

    // Verify signature
    const signatureResult = this.verifySignature(packData, manifest.signature, publicKey);
    errors.push(...signatureResult.errors);
    warnings.push(...signatureResult.warnings);

    // Additional integrity checks
    if (!manifest.id || !manifest.version) {
      errors.push('Pack manifest missing required identification fields');
    }

    if (!manifest.createdAt || manifest.createdAt <= 0) {
      errors.push('Pack manifest missing or invalid creation timestamp');
    }

    // Check if pack is too old (optional warning)
    const packAge = Date.now() - manifest.createdAt;
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (packAge > oneYear) {
      warnings.push('Pack is more than one year old - consider updating');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Detect if pack has been tampered with
   */
  detectTampering(
    originalManifest: PackManifest,
    currentPackData: Buffer
  ): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Calculate current checksum
      const currentChecksum = CryptoUtils.sha256File(currentPackData);
      
      if (currentChecksum !== originalManifest.checksum) {
        errors.push('Pack data has been modified since installation');
        
        // Additional tampering indicators
        const packSize = currentPackData.length;
        if (packSize === 0) {
          errors.push('Pack file is empty or corrupted');
        } else if (packSize < 1000) {
          errors.push('Pack file is unusually small - may be truncated');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`Tampering detection failed: ${error}`);
      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Create rollback data for failed installations
   */
  createRollbackData(manifest: PackManifest): {
    packId: string;
    version: string;
    timestamp: number;
    reason: string;
  } {
    return {
      packId: manifest.id,
      version: manifest.version,
      timestamp: Date.now(),
      reason: 'Verification failed - preventing installation'
    };
  }
}