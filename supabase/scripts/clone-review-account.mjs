#!/usr/bin/env node
/**
 * Clone john@myvitrine.app catalog → appreview@myvitrine.app for App Review.
 *
 * Copies profile presentation fields, published collectibles, showcases, and
 * showcase membership. Skips social graph (follows, DMs, tracking). Safe to
 * re-run: wipes the review user's collectibles/showcases first.
 *
 * Prerequisites:
 *   - SUPABASE_SERVICE_ROLE_KEY (and optionally SUPABASE_URL)
 *   - review-sign-in secrets set on the project
 *
 * Usage (from repo root):
 *   pnpm clone-review-account
 *
 * After clone, deploy review-sign-in and set secrets:
 *   supabase secrets set REVIEW_AUTH_EMAIL=appreview@myvitrine.app
 *   supabase secrets set REVIEW_AUTH_CODE=847291
 *   supabase functions deploy review-sign-in
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');

const SOURCE_EMAIL = 'john@myvitrine.app';
const TARGET_EMAIL = 'appreview@myvitrine.app';
const TARGET_USERNAME = 'vitrine-review';
const TARGET_DISPLAY_NAME = 'Vitrine Review';

const PROJECT_REF = 'fxmiongkckkrllgyfwyw';
const DEFAULT_URL = `https://${PROJECT_REF}.supabase.co`;

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
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(REPO_ROOT, 'apps/native/.env'));
loadEnvFile(resolve(REPO_ROOT, 'apps/web/.env.local'));
loadEnvFile(resolve(REPO_ROOT, '.env'));

const supabaseUrl = process.env.SUPABASE_URL ?? DEFAULT_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function getUserByEmail(email) {
  const { data, error } = await admin
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getOrCreateAuthUserId(email) {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { review_account: true },
  });

  if (created?.user?.id) {
    return created.user.id;
  }

  const profile = await getUserByEmail(email);
  if (profile?.supabase_auth_id) {
    return profile.supabase_auth_id;
  }

  let page = 1;
  while (page <= 20) {
    const { data: listData, error: listError } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (listError) throw listError;

    const match = listData.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match?.id) return match.id;

    if (listData.users.length < 200) break;
    page += 1;
  }

  throw createError ?? new Error(`Auth user not found for ${email}`);
}

async function wipeReviewCatalog(targetUserId) {
  const { data: showcases } = await admin
    .from('showcases')
    .select('id')
    .eq('user_id', targetUserId);

  const showcaseIds = (showcases ?? []).map((row) => row.id);

  if (showcaseIds.length > 0) {
    const { error: junctionError } = await admin
      .from('showcase_collectibles')
      .delete()
      .in('showcase_id', showcaseIds);
    if (junctionError) throw junctionError;
  }

  const { data: collectibles } = await admin
    .from('collectibles')
    .select('id')
    .eq('user_id', targetUserId);

  const collectibleIds = (collectibles ?? []).map((row) => row.id);

  if (collectibleIds.length > 0) {
    const { error: junctionByCollectibleError } = await admin
      .from('showcase_collectibles')
      .delete()
      .in('collectible_id', collectibleIds);
    if (junctionByCollectibleError) throw junctionByCollectibleError;
  }

  const { error: showcaseError } = await admin
    .from('showcases')
    .delete()
    .eq('user_id', targetUserId);
  if (showcaseError) throw showcaseError;

  const { error: collectibleError } = await admin
    .from('collectibles')
    .delete()
    .eq('user_id', targetUserId);
  if (collectibleError) throw collectibleError;
}

function omitKeys(row, keys) {
  const copy = { ...row };
  for (const key of keys) {
    delete copy[key];
  }
  return copy;
}

async function main() {
  console.log(`Source: ${SOURCE_EMAIL}`);
  console.log(`Target: ${TARGET_EMAIL}`);

  const source = await getUserByEmail(SOURCE_EMAIL);
  if (!source?.id) {
    console.error(`Source user not found: ${SOURCE_EMAIL}`);
    process.exit(1);
  }

  const authUserId = await getOrCreateAuthUserId(TARGET_EMAIL);
  const now = new Date().toISOString();

  let target = await getUserByEmail(TARGET_EMAIL);

  const profilePatch = {
    supabase_auth_id: authUserId,
    email: TARGET_EMAIL,
    username: TARGET_USERNAME,
    display_name: source.display_name ?? TARGET_DISPLAY_NAME,
    avatar: source.avatar,
    bio: source.bio,
    onboarding_completed_at: source.onboarding_completed_at ?? now,
    follow_lists_visibility: source.follow_lists_visibility ?? 'public',
    sharing_permission: source.sharing_permission ?? 'public',
    messaging_permission: source.messaging_permission,
    primary_type: source.primary_type,
    collector_profile: source.collector_profile,
    settings: source.settings,
    tags: source.tags,
    featured_showcase_id: null,
    crown_jewel_collectible_id: null,
    updated_at: now,
  };

  if (target?.id) {
    const { error: updateError } = await admin
      .from('users')
      .update(profilePatch)
      .eq('id', target.id);
    if (updateError) throw updateError;
  } else {
    const newId = randomUUID();
    const { error: insertError } = await admin.from('users').insert({
      id: newId,
      created_at: now,
      collectibles_count: 0,
      followers_count: 0,
      following_count: 0,
      showcases_count: 0,
      ...profilePatch,
    });
    if (insertError) throw insertError;
    target = { id: newId };
  }

  const targetUserId = target.id;
  console.log(`Target user id: ${targetUserId}`);

  await wipeReviewCatalog(targetUserId);
  console.log('Cleared existing review catalog');

  const { data: sourceCollectibles, error: collectiblesError } = await admin
    .from('collectibles')
    .select('*')
    .eq('user_id', source.id)
    .order('created_at', { ascending: true });

  if (collectiblesError) throw collectiblesError;

  const collectibleIdMap = new Map();

  for (const row of sourceCollectibles ?? []) {
    const newId = randomUUID();
    collectibleIdMap.set(row.id, newId);

    const insertRow = omitKeys(row, ['id', 'user_id', 'extraction_job_id']);
    insertRow.id = newId;
    insertRow.user_id = targetUserId;
    insertRow.share_token = randomUUID();
    insertRow.extraction_job_id = null;
    insertRow.updated_at = now;

    const { error: insertError } = await admin.from('collectibles').insert(insertRow);
    if (insertError) throw insertError;
  }

  console.log(`Cloned ${collectibleIdMap.size} collectibles`);

  for (const row of sourceCollectibles ?? []) {
    if (!row.reextraction_of) continue;
    const remapped = collectibleIdMap.get(row.reextraction_of);
    if (!remapped) continue;

    const newId = collectibleIdMap.get(row.id);
    const { error: remapError } = await admin
      .from('collectibles')
      .update({ reextraction_of: remapped })
      .eq('id', newId);
    if (remapError) throw remapError;
  }

  const { data: sourceShowcases, error: showcasesError } = await admin
    .from('showcases')
    .select('*')
    .eq('user_id', source.id)
    .order('created_at', { ascending: true });

  if (showcasesError) throw showcasesError;

  const showcaseIdMap = new Map();

  for (const row of sourceShowcases ?? []) {
    const newId = randomUUID();
    showcaseIdMap.set(row.id, newId);

    const insertRow = omitKeys(row, ['id', 'user_id']);
    insertRow.id = newId;
    insertRow.user_id = targetUserId;
    insertRow.updated_at = now;

    const { error: insertError } = await admin.from('showcases').insert(insertRow);
    if (insertError) throw insertError;
  }

  console.log(`Cloned ${showcaseIdMap.size} showcases`);

  const sourceShowcaseIds = [...showcaseIdMap.keys()];
  if (sourceShowcaseIds.length > 0) {
    const { data: junctionRows, error: junctionError } = await admin
      .from('showcase_collectibles')
      .select('*')
      .in('showcase_id', sourceShowcaseIds);

    if (junctionError) throw junctionError;

    for (const row of junctionRows ?? []) {
      const showcaseId = showcaseIdMap.get(row.showcase_id);
      const collectibleId = collectibleIdMap.get(row.collectible_id);
      if (!showcaseId || !collectibleId) continue;

      const { error: insertError } = await admin.from('showcase_collectibles').insert({
        id: randomUUID(),
        showcase_id: showcaseId,
        collectible_id: collectibleId,
        display_order: row.display_order,
        added_at: row.added_at ?? now,
      });
      if (insertError) throw insertError;
    }

    console.log(`Cloned ${junctionRows?.length ?? 0} showcase memberships`);
  }

  const featuredShowcaseId = source.featured_showcase_id
    ? showcaseIdMap.get(source.featured_showcase_id) ?? null
    : null;

  const crownJewelCollectibleId = source.crown_jewel_collectible_id
    ? collectibleIdMap.get(source.crown_jewel_collectible_id) ?? null
    : null;

  const { error: finalizeError } = await admin
    .from('users')
    .update({
      featured_showcase_id: featuredShowcaseId,
      crown_jewel_collectible_id: crownJewelCollectibleId,
      collectibles_count: collectibleIdMap.size,
      showcases_count: showcaseIdMap.size,
      updated_at: now,
    })
    .eq('id', targetUserId);

  if (finalizeError) throw finalizeError;

  console.log('\nDone.');
  console.log(`Review account: ${TARGET_EMAIL}`);
  console.log(`Username: ${TARGET_USERNAME}`);
  console.log(`Collectibles: ${collectibleIdMap.size}`);
  console.log(`Showcases: ${showcaseIdMap.size}`);
  console.log('\nNext: set secrets and deploy review-sign-in (see script header).');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
