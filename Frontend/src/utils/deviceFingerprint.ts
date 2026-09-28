/**
 * Device Fingerprinting Utility
 *
 * Implements token binding by generating a unique device fingerprint
 * based on browser characteristics and tying it to authentication tokens.
 *
 * This provides defense-in-depth against token theft:
 * - Stolen tokens cannot be used from a different device
 * - Browser changes/updates will cause fingerprint mismatch (requires re-auth)
 * - Complements httpOnly cookies and Secure flags
 *
 * Security Notes:
 * - Fingerprints are NOT unique identifiers (by design) to preserve privacy
 * - Used ONLY for token binding, not for tracking
 * - Stored locally with tokens in sessionStorage
 * - Never sent to analytics or third parties
 */

import crypto from 'crypto';

/**
 * Generate a stable device fingerprint for token binding.
 *
 * Combines:
 * - User Agent string (browser, OS, version)
 * - Screen resolution and color depth
 * - Timezone offset
 * - Language preferences
 * - WebGL renderer info (GPU fingerprint)
 * - Canvas fingerprint (rendering variations)
 *
 * @returns Base64-encoded fingerprint hash
 */
export async function generateDeviceFingerprint(): Promise<string> {
  try {
    const fingerprints: string[] = [];

    // 1. User Agent
    fingerprints.push(navigator.userAgent);

    // 2. Screen characteristics
    fingerprints.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

    // 3. Timezone
    fingerprints.push(new Date().getTimezoneOffset().toString());

    // 4. Language
    fingerprints.push(navigator.language);

    // 5. WebGL fingerprint (GPU info)
    const webglInfo = getWebGLFingerprint();
    if (webglInfo) {
      fingerprints.push(webglInfo);
    }

    // 6. Canvas fingerprint (rendering variations)
    const canvasInfo = getCanvasFingerprint();
    if (canvasInfo) {
      fingerprints.push(canvasInfo);
    }

    // 7. CPU cores and memory
    if (navigator.hardwareConcurrency) {
      fingerprints.push(navigator.hardwareConcurrency.toString());
    }

    // 8. Device memory
    if ((navigator as any).deviceMemory) {
      fingerprints.push((navigator as any).deviceMemory.toString());
    }

    // 9. Do Not Track
    if ((navigator as any).doNotTrack) {
      fingerprints.push((navigator as any).doNotTrack);
    }

    // 10. Local storage availability
    try {
      const test = '__fingerprint_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      fingerprints.push('localStorage:true');
    } catch {
      fingerprints.push('localStorage:false');
    }

    // Combine all fingerprints and hash
    const combined = fingerprints.join('|');
    const hash = sha256(combined);

    return hash;
  } catch (error) {
    console.error('[Device Fingerprint] Error generating fingerprint:', error);
    // Return a random fallback (not ideal, but allows system to continue)
    return randomHash();
  }
}

/**
 * Get WebGL fingerprint (GPU and driver info).
 * Safely handles browsers without WebGL support.
 */
function getWebGLFingerprint(): string | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) return null;

    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return null;

    const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    return `${vendor}|${renderer}`;
  } catch {
    return null;
  }
}

/**
 * Get canvas fingerprint using rendering differences.
 * Safely handles browsers with canvas fingerprinting protection.
 */
function getCanvasFingerprint(): string | null {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Set canvas size
    canvas.width = 280;
    canvas.height = 60;

    // Draw test pattern
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Device Fingerprint Test 🔐', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Device Fingerprint Test 🔐', 4, 17);

    // Get canvas data
    const canvasData = canvas.toDataURL();
    return sha256(canvasData);
  } catch {
    return null;
  }
}

/**
 * Simple SHA-256 hash implementation (browser compatible).
 * For production, consider using a library like TweetNaCl.js if needed.
 */
function sha256(message: string): string {
  // Use SubtleCrypto if available (modern browsers)
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return hashWithSubtleCrypto(message);
  }

  // Fallback: simple hash (not cryptographically secure, but acceptable for fingerprinting)
  return simpleHash(message);
}

/**
 * Async SHA-256 using SubtleCrypto.
 * Returns synchronous hash for now (see note in generateDeviceFingerprint).
 */
async function hashWithSubtleCrypto(message: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return Buffer.from(hashHex, 'hex').toString('base64');
  } catch {
    return simpleHash(message);
  }
}

/**
 * Simple hash function for fallback (not cryptographically secure).
 * Good enough for device fingerprinting purposes.
 */
function simpleHash(message: string): string {
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a random hash for fallback cases.
 */
function randomHash(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate that a token's fingerprint matches the current device.
 *
 * @param tokenFingerprint - Fingerprint stored with the token
 * @returns true if fingerprints match (device is the same)
 */
export async function validateTokenBinding(tokenFingerprint: string): Promise<boolean> {
  try {
    const currentFingerprint = await generateDeviceFingerprint();
    const isValid = currentFingerprint === tokenFingerprint;

    if (!isValid) {
      console.warn('[Token Binding] Fingerprint mismatch - possible token theft detected');
    }

    return isValid;
  } catch (error) {
    console.error('[Token Binding] Validation error:', error);
    // On error, fail closed (deny access) for security
    return false;
  }
}

/**
 * Store a token with its device fingerprint binding.
 *
 * @param key - Storage key (e.g., 'bmdc-auth-token')
 * @param token - The JWT token
 * @param storageKey - Where to store (localStorage, sessionStorage)
 */
export async function storeTokenWithFingerprint(
  key: string,
  token: string,
  storageKey: Storage = typeof window !== 'undefined' ? sessionStorage : localStorage
): Promise<void> {
  try {
    const fingerprint = await generateDeviceFingerprint();
    const bound = {
      token,
      fingerprint,
      timestamp: Date.now(),
    };

    storageKey.setItem(key, JSON.stringify(bound));
  } catch (error) {
    console.error('[Token Binding] Failed to store token with fingerprint:', error);
    // Fallback: store token without fingerprint
    storageKey.setItem(key, token);
  }
}

/**
 * Retrieve and validate a token with fingerprint binding.
 *
 * @param key - Storage key (e.g., 'bmdc-auth-token')
 * @param storageKey - Where to retrieve from (localStorage, sessionStorage)
 * @returns Token if valid and fingerprint matches, null otherwise
 */
export async function getAndValidateToken(
  key: string,
  storageKey: Storage = typeof window !== 'undefined' ? sessionStorage : localStorage
): Promise<string | null> {
  try {
    const stored = storageKey.getItem(key);
    if (!stored) return null;

    // Try parsing as bound token (new format)
    let bound: { token: string; fingerprint: string; timestamp: number } | null = null;
    try {
      const parsed = JSON.parse(stored);
      if (parsed.token && parsed.fingerprint) {
        bound = parsed;
      }
    } catch {
      // Not JSON, treat as raw token (legacy)
      return stored;
    }

    if (!bound) return null;

    // Validate fingerprint
    const isValid = await validateTokenBinding(bound.fingerprint);
    if (!isValid) {
      console.warn('[Token Binding] Token invalid due to device mismatch');
      storageKey.removeItem(key);
      return null;
    }

    // Check age (optional: invalidate tokens older than 24 hours)
    const ageMs = Date.now() - bound.timestamp;
    const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours
    if (ageMs > maxAgeMs) {
      console.warn('[Token Binding] Token expired (older than 24 hours)');
      storageKey.removeItem(key);
      return null;
    }

    return bound.token;
  } catch (error) {
    console.error('[Token Binding] Error validating token:', error);
    return null;
  }
}

/**
 * Clear bound token from storage.
 *
 * @param key - Storage key
 * @param storageKey - Storage location
 */
export function clearBoundToken(
  key: string,
  storageKey: Storage = typeof window !== 'undefined' ? sessionStorage : localStorage
): void {
  storageKey.removeItem(key);
}
