/**
 * Two-Factor Authentication (2FA) utilities
 * Implements TOTP (Time-based One-Time Password) authentication
 */

import crypto from 'crypto';
import { logger } from '@/lib/utils/logger';

interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface VerifyTOTPResult {
  isValid: boolean;
  timeWindow?: number;
}

/**
 * Generate base32 encoded secret for TOTP
 */
export function generateTOTPSecret(): string {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

/**
 * Generate backup codes for 2FA recovery
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Generate QR code URL for TOTP setup
 */
export function generateQRCodeUrl(
  secret: string,
  email: string,
  issuer: string = 'SalesFlow CRM'
): string {
  const label = `${issuer}:${email}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

/**
 * Generate complete 2FA setup data
 */
export function generate2FASecret(email: string): TwoFactorSecret {
  const secret = generateTOTPSecret();
  const qrCode = generateQRCodeUrl(secret, email);
  const backupCodes = generateBackupCodes();
  
  logger.info('2FA secret generated', {
    action: '2fa_secret_generated',
    metadata: { email, hasSecret: !!secret, backupCodesCount: backupCodes.length },
  });
  
  return {
    secret,
    qrCode,
    backupCodes,
  };
}

/**
 * Verify TOTP code
 */
export function verifyTOTP(token: string, secret: string): VerifyTOTPResult {
  if (!token || !secret) {
    return { isValid: false };
  }

  // Clean the token (remove spaces, ensure 6 digits)
  const cleanToken = token.replace(/\s/g, '');
  if (!/^\d{6}$/.test(cleanToken)) {
    return { isValid: false };
  }

  const now = Math.floor(Date.now() / 1000);
  const timeStep = 30; // TOTP time step (30 seconds)
  
  // Check current time window and adjacent windows (to account for clock skew)
  for (let i = -1; i <= 1; i++) {
    const timeWindow = Math.floor(now / timeStep) + i;
    const expectedToken = generateTOTPToken(secret, timeWindow);
    
    if (constantTimeCompare(cleanToken, expectedToken)) {
      logger.info('TOTP verification successful', {
        action: 'totp_verified',
        metadata: { timeWindow: i },
      });
      return { isValid: true, timeWindow: i };
    }
  }
  
  logger.warn('TOTP verification failed', {
    action: 'totp_verification_failed',
    metadata: { tokenLength: cleanToken.length },
  });
  
  return { isValid: false };
}

/**
 * Verify backup code
 */
export function verifyBackupCode(code: string, validCodes: string[]): boolean {
  if (!code || !validCodes.length) {
    return false;
  }

  const cleanCode = code.replace(/\s/g, '').toUpperCase();
  const isValid = validCodes.includes(cleanCode);
  
  if (isValid) {
    logger.info('Backup code verification successful', {
      action: 'backup_code_verified',
    });
  } else {
    logger.warn('Backup code verification failed', {
      action: 'backup_code_verification_failed',
    });
  }
  
  return isValid;
}

/**
 * Generate TOTP token for a specific time window
 */
function generateTOTPToken(secret: string, timeWindow: number): string {
  const key = base32Decode(secret);
  const time = Buffer.alloc(8);
  time.writeUInt32BE(Math.floor(timeWindow), 4);
  
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(time);
  const digest = hmac.digest();
  
  const offset = digest[digest.length - 1] & 0x0f;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  
  return code.toString().padStart(6, '0');
}

/**
 * Base32 encoding (RFC 3548)
 */
function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;
  
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }
  
  return result;
}

/**
 * Base32 decoding
 */
function base32Decode(encoded: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  encoded = encoded.toUpperCase().replace(/=/g, '');
  
  let bits = 0;
  let value = 0;
  const result: number[] = [];
  
  for (const char of encoded) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      throw new Error('Invalid base32 character');
    }
    
    value = (value << 5) | index;
    bits += 5;
    
    if (bits >= 8) {
      result.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  
  return Buffer.from(result);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Validate 2FA setup requirements
 */
export function validate2FASetup(secret: string, token: string): {
  isValid: boolean;
  error?: string;
} {
  if (!secret) {
    return { isValid: false, error: 'Secret is required' };
  }
  
  if (!token) {
    return { isValid: false, error: 'Verification code is required' };
  }
  
  const cleanToken = token.replace(/\s/g, '');
  if (!/^\d{6}$/.test(cleanToken)) {
    return { isValid: false, error: 'Verification code must be 6 digits' };
  }
  
  const verification = verifyTOTP(cleanToken, secret);
  if (!verification.isValid) {
    return { isValid: false, error: 'Invalid verification code' };
  }
  
  return { isValid: true };
}

/**
 * Generate QR code as base64 data URL (requires qrcode library)
 * This is a placeholder - in production you'd use a proper QR code library
 */
export async function generateQRCodeImage(url: string): Promise<string> {
  // Placeholder implementation
  // In production, use: import QRCode from 'qrcode'
  // return await QRCode.toDataURL(url)
  
  logger.info('QR code generation requested', {
    action: 'qr_code_generation_requested',
    metadata: { urlLength: url.length },
  });
  
  // Return placeholder base64 image
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
}

/**
 * 2FA status interface
 */
export interface TwoFactorStatus {
  isEnabled: boolean;
  isConfigured: boolean;
  backupCodesRemaining?: number;
  lastUsed?: string;
}