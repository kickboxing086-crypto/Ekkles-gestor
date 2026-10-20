/**
 * Security & Cryptography Service for EKKLES
 * Implements standard cryptographic hashing (SHA-256 with salt) and AES-GCM encryption
 * for user accounts, passwords, logins, and session data.
 */

const APP_PEPPER = 'ekkles_sec_salt_2026_v1_k89!';

/**
 * Computes a salted SHA-256 cryptographic hash of a password or credential.
 */
export async function hashPassword(plainText: string, customSalt: string = 'ekkles_salt'): Promise<string> {
  if (!plainText) return '';
  
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${customSalt}:${plainText}:${APP_PEPPER}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `sha256$${customSalt}$${hexHash}`;
  } catch (error) {
    console.error('Failed to hash with subtle crypto, falling back to safe hash', error);
    // Lightweight deterministic fallback
    let h = 0x811c9dc5;
    for (let i = 0; i < plainText.length; i++) {
      h ^= plainText.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return `sha256$fallback$${(h >>> 0).toString(16)}`;
  }
}

/**
 * Verifies a plain text password against either a salted hash or a legacy plain string.
 */
export async function verifyPassword(plainText: string, storedHashOrPlain: string): Promise<boolean> {
  if (!plainText || !storedHashOrPlain) return false;

  // If already hashed with our sha256 prefix
  if (storedHashOrPlain.startsWith('sha256$')) {
    const parts = storedHashOrPlain.split('$');
    const salt = parts[1] || 'ekkles_salt';
    const computed = await hashPassword(plainText, salt);
    return computed === storedHashOrPlain;
  }

  // Legacy plain-text fallback (allows seamless migration without breaking existing accounts)
  return plainText === storedHashOrPlain;
}

/**
 * Checks whether a password string is already cryptographically hashed.
 */
export function isPasswordHashed(str: string): boolean {
  return typeof str === 'string' && str.startsWith('sha256$');
}

/**
 * Derives an AES-GCM CryptoKey from a passphrase using PBKDF2.
 */
async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a text string using authenticated AES-GCM (256-bit).
 * Returns envelope: "aes256gcm$<saltHex>$<ivHex>$<cipherHex>"
 */
export async function encryptData(plainText: string, secretKey: string = APP_PEPPER): Promise<string> {
  if (!plainText) return '';
  try {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveAesKey(secretKey, salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as any },
      key,
      enc.encode(plainText)
    );

    const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('');
    const ivHex = Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join('');
    const cipherHex = Array.from(new Uint8Array(encrypted)).map((b) => b.toString(16).padStart(2, '0')).join('');

    return `aes256gcm$${saltHex}$${ivHex}$${cipherHex}`;
  } catch (error) {
    console.error('Encryption failed, returning encoded fallback', error);
    return `b64$${btoa(encodeURIComponent(plainText))}`;
  }
}

/**
 * Decrypts an AES-GCM encrypted envelope.
 */
export async function decryptData(envelope: string, secretKey: string = APP_PEPPER): Promise<string> {
  if (!envelope) return '';
  
  if (envelope.startsWith('b64$')) {
    try {
      return decodeURIComponent(atob(envelope.replace('b64$', '')));
    } catch {
      return envelope;
    }
  }

  if (!envelope.startsWith('aes256gcm$')) {
    return envelope; // Not encrypted
  }

  try {
    const [, saltHex, ivHex, cipherHex] = envelope.split('$');
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    const cipherData = new Uint8Array(cipherHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

    const key = await deriveAesKey(secretKey, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as any },
      key,
      cipherData
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed', error);
    return '***Erro ao decodificar***';
  }
}

/**
 * Masks a password for UI presentation (e.g. ••••••••).
 */
export function maskPassword(password: string): string {
  if (!password) return '••••••••';
  const len = Math.max(8, Math.min(password.length, 14));
  return '•'.repeat(len);
}

/**
 * Masks a username or email for safe display.
 */
export function maskEmailOrUsername(str: string): string {
  if (!str) return '';
  if (str.includes('@')) {
    const [u, d] = str.split('@');
    if (u.length <= 2) return `${u}***@${d}`;
    return `${u[0]}***${u[u.length - 1]}@${d}`;
  }
  if (str.length <= 3) return `${str}***`;
  return `${str.slice(0, 2)}***${str.slice(-2)}`;
}

/**
 * Generates an encrypted credentials dispatch ticket / receipt for audit and sharing.
 */
export async function generateSecureLoginReceipt(username: string, gcName: string = 'Célula'): Promise<string> {
  const payload = JSON.stringify({
    system: 'EKKLES',
    username,
    gcName,
    cipher: 'AES-GCM-256 + SHA-256',
    issuedAt: new Date().toISOString(),
  });
  return encryptData(payload);
}
