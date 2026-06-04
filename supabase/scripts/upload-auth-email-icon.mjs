#!/usr/bin/env node
/**
 * Upload apps/native/assets/icon.png → brand-assets/logos/icon.png
 * for the Supabase Auth OTP email template.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (and optionally SUPABASE_URL).
 * Loads apps/native/.env and apps/web/.env.local when present.
 *
 * Usage (from repo root):
 *   pnpm upload:auth-email-icon
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');

const BUCKET = 'brand-assets';
const STORAGE_PATH = 'logos/icon.png';
const SOURCE_FILE = resolve(REPO_ROOT, 'apps/native/assets/icon.png');
const PROJECT_REF = 'fxmiongkckkrllgyfwyw';
const DEFAULT_URL = `https://${PROJECT_REF}.supabase.co`;

const PUBLIC_URL = `${DEFAULT_URL}/storage/v1/object/public/${BUCKET}/${STORAGE_PATH}`;

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function resolveConfig() {
  loadEnvFile(resolve(REPO_ROOT, 'apps/native/.env'));
  loadEnvFile(resolve(REPO_ROOT, 'apps/web/.env.local'));
  loadEnvFile(resolve(REPO_ROOT, '.env'));

  const url =
    process.env.SUPABASE_URL ??
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    DEFAULT_URL;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error(
      'Missing SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Set it in apps/native/.env or your shell, then re-run:\n' +
        '  pnpm upload:auth-email-icon',
    );
    process.exit(1);
  }

  return { url, serviceRoleKey };
}

async function main() {
  if (!existsSync(SOURCE_FILE)) {
    console.error(`Source file not found: ${SOURCE_FILE}`);
    process.exit(1);
  }

  const { url, serviceRoleKey } = resolveConfig();
  const fileBuffer = readFileSync(SOURCE_FILE);

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Uploading ${SOURCE_FILE}`);
  console.log(`  → ${BUCKET}/${STORAGE_PATH}`);

  const { error } = await supabase.storage.from(BUCKET).upload(STORAGE_PATH, fileBuffer, {
    contentType: 'image/png',
    upsert: true,
    cacheControl: '86400',
  });

  if (error) {
    console.error('Upload failed:', error.message);
    if (error.message.includes('Bucket not found')) {
      console.error(`Create a public bucket named "${BUCKET}" in Supabase Storage first.`);
    }
    process.exit(1);
  }

  console.log('\nDone. Public URL (used in email-otp.html):');
  console.log(`  ${PUBLIC_URL}`);
  console.log('\nOpen that URL in a browser to confirm the image loads.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
