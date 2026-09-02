#!/usr/bin/env node
/**
 * One-time migration: encrypts every existing plaintext value in
 * `profiles.byok_key` using AES-256-GCM, keyed by BYOK_ENCRYPTION_KEY.
 *
 * Safe to re-run: rows whose value is already a recognized encrypted
 * envelope (prefixed with "v1:") are skipped, so running this more than
 * once (or against a partially-migrated database) is harmless.
 *
 * This script is standalone (no `@/` path aliases, no TypeScript) so it can
 * run with plain Node, independent of the Next.js build pipeline. It
 * duplicates the small AES-256-GCM routine from `utils/crypto.ts` -- keep
 * both in sync if that file's envelope format ever changes.
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-byok-encryption.mjs
 *
 * Required environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL   - your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY  - Service Role key (Project Settings > API).
 *                                Required to bypass RLS and read/write every
 *                                user's row from a script instead of a
 *                                logged-in session. NEVER expose this key to
 *                                the client, commit it to source control, or
 *                                leave it configured permanently -- it only
 *                                needs to exist in your shell/.env for the
 *                                duration of this one-time run.
 *   BYOK_ENCRYPTION_KEY        - base64, 32-byte master key.
 *                                Generate with: openssl rand -base64 32
 */

import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const ALGORITHM = "aes-256-gcm";
const ENVELOPE_PREFIX = "v1:";
const IV_LENGTH = 12;

function getKey() {
  const raw = process.env.BYOK_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("BYOK_ENCRYPTION_KEY is not set. Generate one with: openssl rand -base64 32");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(`BYOK_ENCRYPTION_KEY must decode to exactly 32 bytes (got ${key.length}).`);
  }
  return key;
}

function isEncryptedEnvelope(value) {
  return typeof value === "string" && value.startsWith(ENVELOPE_PREFIX) && value.split(":").length === 4;
}

function encryptSecret(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${ENVELOPE_PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext.toString("base64")}`;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Run with: node --env-file=.env.local scripts/migrate-byok-encryption.mjs"
    );
    process.exit(1);
  }

  // Validate the encryption key eagerly so we fail fast, before touching any rows.
  getKey();

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: rows, error } = await supabase
    .from("profiles")
    .select("id, byok_key")
    .not("byok_key", "is", null)
    .neq("byok_key", "");

  if (error) {
    console.error("Failed to fetch profiles:", error.message);
    process.exit(1);
  }

  console.log(`Found ${rows.length} profile(s) with a non-empty byok_key.`);

  let migrated = 0;
  let alreadyEncrypted = 0;
  let failed = 0;

  for (const row of rows) {
    if (isEncryptedEnvelope(row.byok_key)) {
      alreadyEncrypted++;
      continue;
    }

    try {
      const encrypted = encryptSecret(row.byok_key);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ byok_key: encrypted })
        .eq("id", row.id);

      if (updateError) {
        console.error(`Failed to update profile ${row.id}:`, updateError.message);
        failed++;
        continue;
      }

      migrated++;
      console.log(`Encrypted byok_key for profile ${row.id}`);
    } catch (err) {
      console.error(`Failed to encrypt byok_key for profile ${row.id}:`, err.message);
      failed++;
    }
  }

  console.log("\nMigration summary:");
  console.log(`  Migrated:          ${migrated}`);
  console.log(`  Already encrypted: ${alreadyEncrypted}`);
  console.log(`  Failed:            ${failed}`);
  console.log(`  Total scanned:     ${rows.length}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Migration script crashed:", err);
  process.exit(1);
});
