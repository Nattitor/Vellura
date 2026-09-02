import crypto from "node:crypto";

/**
 * AES-256-GCM helpers for encrypting sensitive values (BYOK provider keys)
 * before they are persisted to Supabase.
 *
 * Server-only: relies on Node's built-in `crypto` module and a server-side
 * environment variable. Never import this from a "use client" component.
 */

const ALGORITHM = "aes-256-gcm";
const ENVELOPE_PREFIX = "v1:";
const IV_LENGTH = 12; // 96-bit IV, recommended size for GCM

function getKey(): Buffer {
  const raw = process.env.BYOK_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "BYOK_ENCRYPTION_KEY is not set. Generate one with: openssl rand -base64 32"
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `BYOK_ENCRYPTION_KEY must decode to exactly 32 bytes (got ${key.length}). Generate one with: openssl rand -base64 32`
    );
  }
  return key;
}

/**
 * Returns true if the given stored value looks like one of our encrypted
 * envelopes (version-prefixed, 4 colon-separated segments). Used to tell
 * already-migrated rows apart from legacy plaintext.
 */
export function isEncryptedEnvelope(value: string): boolean {
  return typeof value === "string" && value.startsWith(ENVELOPE_PREFIX) && value.split(":").length === 4;
}

/**
 * Encrypts a plaintext secret using AES-256-GCM. The result is a
 * self-describing, versioned envelope string safe to store in a text column:
 *
 *   v1:<iv base64>:<authTag base64>:<ciphertext base64>
 */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${ENVELOPE_PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext.toString("base64")}`;
}

/**
 * Decrypts a value produced by {@link encryptSecret}. Throws if the value is
 * not a recognized envelope, or fails authentication (wrong key or the
 * ciphertext was tampered with).
 */
export function decryptSecret(envelope: string): string {
  if (!isEncryptedEnvelope(envelope)) {
    throw new Error("Value is not a recognized encrypted envelope.");
  }
  const key = getKey();
  const [, ivB64, authTagB64, ciphertextB64] = envelope.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
