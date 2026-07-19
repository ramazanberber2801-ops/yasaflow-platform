#!/usr/bin/env node

const required = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'MEMBER_ACCESS_TOKEN',
  'ORG_ADMIN_ACCESS_TOKEN',
  'SUPERADMIN_ACCESS_TOKEN',
  'MEMBER_ORG_ID',
  'ADMIN_ORG_ID',
  'FOREIGN_ORG_ID',
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  process.exit(2);
}

const baseUrl = process.env.SUPABASE_URL.replace(/\/$/, '');
const anonKey = process.env.SUPABASE_ANON_KEY;
const results = [];

function report(name, ok, detail) {
  results.push({ name, ok });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name} — ${detail}`);
}

async function select(table, token, organizationId) {
  const url = new URL(`${baseUrl}/rest/v1/${table}`);
  url.searchParams.set('select', 'organization_id');
  url.searchParams.set('organization_id', `eq.${organizationId}`);
  url.searchParams.set('limit', '5');

  const response = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token || anonKey}`,
      Accept: 'application/json',
    },
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, ok: response.ok, body };
}

function isDenied(result) {
  return result.status === 401 || result.status === 403 ||
    (result.ok && Array.isArray(result.body) && result.body.length === 0);
}

async function noForeignRows(name, table, token, foreignOrgId) {
  const result = await select(table, token, foreignOrgId);
  report(name, isDenied(result), `HTTP ${result.status}, rows=${Array.isArray(result.body) ? result.body.length : 'n/a'}`);
}

async function ownAndForeign(name, table, token, ownOrgId, foreignOrgId) {
  const own = await select(table, token, ownOrgId);
  const foreign = await select(table, token, foreignOrgId);
  report(
    name,
    own.ok && isDenied(foreign),
    `own=${own.status}, foreign=${foreign.status}, foreign rows=${Array.isArray(foreign.body) ? foreign.body.length : 'n/a'}`,
  );
}

await noForeignRows('Anonymous cannot read memberships', 'organization_members', null, process.env.FOREIGN_ORG_ID);
await noForeignRows('Anonymous cannot read modules', 'organization_modules', null, process.env.FOREIGN_ORG_ID);

await ownAndForeign(
  'Member cannot read another organization memberships',
  'organization_members',
  process.env.MEMBER_ACCESS_TOKEN,
  process.env.MEMBER_ORG_ID,
  process.env.FOREIGN_ORG_ID,
);
await ownAndForeign(
  'Member cannot read another organization modules',
  'organization_modules',
  process.env.MEMBER_ACCESS_TOKEN,
  process.env.MEMBER_ORG_ID,
  process.env.FOREIGN_ORG_ID,
);

await ownAndForeign(
  'Organization admin cannot read foreign memberships',
  'organization_members',
  process.env.ORG_ADMIN_ACCESS_TOKEN,
  process.env.ADMIN_ORG_ID,
  process.env.FOREIGN_ORG_ID,
);
await ownAndForeign(
  'Organization admin cannot read foreign modules',
  'organization_modules',
  process.env.ORG_ADMIN_ACCESS_TOKEN,
  process.env.ADMIN_ORG_ID,
  process.env.FOREIGN_ORG_ID,
);

const superadmin = await fetch(`${baseUrl}/rest/v1/organizations?select=id&limit=1`, {
  headers: {
    apikey: anonKey,
    Authorization: `Bearer ${process.env.SUPERADMIN_ACCESS_TOKEN}`,
    Accept: 'application/json',
  },
});
report('Superadmin authenticated organization read succeeds', superadmin.ok, `HTTP ${superadmin.status}`);

const failed = results.filter((result) => !result.ok);
console.log(`Completed ${results.length} checks: ${results.length - failed.length} passed, ${failed.length} failed.`);
if (failed.length) process.exit(1);
