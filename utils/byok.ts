import { decryptSecret, encryptSecret, isEncryptedEnvelope } from "./crypto";

/**
 * Parses whatever is currently stored in `profiles.byok_key` into a
 * provider -> key map.
 *
 * The stored value is expected to be an encrypted envelope (see
 * `utils/crypto.ts`) wrapping either:
 *   - a JSON object of provider -> key pairs (multi-provider BYOK), or
 *   - a single raw key string (legacy single-provider format, treated as Google).
 *
 * Defense in depth: if a stored value is NOT a recognized encrypted envelope
 * (e.g. a row that predates the encryption migration and hasn't been
 * migrated yet), it is treated as legacy plaintext instead of being
 * discarded, so existing users are never locked out. Run
 * `scripts/migrate-byok-encryption.mjs` once to eliminate this case entirely.
 */
export function parseStoredUserKeys(rawStored: string | null | undefined): Record<string, string> {
  if (!rawStored || !rawStored.trim()) return {};

  let plaintext = rawStored;
  if (isEncryptedEnvelope(rawStored)) {
    try {
      plaintext = decryptSecret(rawStored);
    } catch (err) {
      console.error("Failed to decrypt stored BYOK keys (wrong BYOK_ENCRYPTION_KEY or corrupted data):", err);
      return {};
    }
  }

  return parsePlaintextKeys(plaintext);
}

function parsePlaintextKeys(plaintext: string): Record<string, string> {
  const trimmed = plaintext.trim();
  if (!trimmed) return {};
  try {
    if (trimmed.startsWith("{")) {
      return JSON.parse(trimmed);
    }
    return { google: trimmed };
  } catch {
    return { google: trimmed };
  }
}

/**
 * Serializes and encrypts a provider -> key map for storage in
 * `profiles.byok_key`. Returns an empty string if there are no keys left
 * (matches the previous "clear the column" behavior).
 */
export function encryptUserKeys(keys: Record<string, string>): string {
  const cleaned = Object.fromEntries(
    Object.entries(keys).filter(([, v]) => !!v && v.trim() !== "")
  );
  if (Object.keys(cleaned).length === 0) return "";
  return encryptSecret(JSON.stringify(cleaned));
}

/**
 * Returns just the list of provider IDs that have a configured key, without
 * ever exposing the actual key values. This is the only BYOK-derived data
 * that should ever be sent to a client component.
 */
export function getConfiguredProviders(rawStored: string | null | undefined): string[] {
  const keys = parseStoredUserKeys(rawStored);
  return Object.keys(keys).filter((k) => !!keys[k]?.trim());
}
