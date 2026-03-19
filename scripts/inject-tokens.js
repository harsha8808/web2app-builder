#!/usr/bin/env node
/**
 * inject-tokens.js
 * Replaces {{TOKEN}} placeholders across all Android template source files.
 * Called by the GitHub Actions workflow after checkout.
 */

const fs  = require('fs');
const path = require('path');

const TEST_IDS = {
  banner:        'ca-app-pub-3940256099942544/6300978111',
  interstitial:  'ca-app-pub-3940256099942544/1033173712',
  rewarded:      'ca-app-pub-3940256099942544/5224354917',
  appOpen:       'ca-app-pub-3940256099942544/3419835294',
};

const isTest = process.env.TEST_MODE === 'true';

// Extract domain from URL for network_security_config.xml
function extractDomain(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

const tokens = {
  '{{APP_NAME}}':               process.env.APP_NAME,
  '{{PACKAGE_NAME}}':           process.env.PACKAGE_NAME,
  '{{VERSION_NAME}}':           process.env.VERSION_NAME    || '1.0',
  '{{VERSION_CODE}}':           process.env.VERSION_CODE    || '1',
  '{{WEBSITE_URL}}':            process.env.WEBSITE_URL,
  '{{WEBSITE_DOMAIN}}':         extractDomain(process.env.WEBSITE_URL || ''),
  '{{ADMOB_APP_ID}}':           process.env.ADMOB_APP_ID,
  '{{BANNER_UNIT_ID}}':         isTest ? TEST_IDS.banner       : (process.env.BANNER_UNIT_ID       || ''),
  '{{INTERSTITIAL_UNIT_ID}}':   isTest ? TEST_IDS.interstitial : (process.env.INTERSTITIAL_UNIT_ID || ''),
  '{{REWARDED_UNIT_ID}}':       isTest ? TEST_IDS.rewarded     : (process.env.REWARDED_UNIT_ID     || ''),
  '{{APP_OPEN_UNIT_ID}}':       isTest ? TEST_IDS.appOpen      : (process.env.APP_OPEN_UNIT_ID     || ''),
  '{{INTERSTITIAL_FREQUENCY}}': process.env.INTERSTITIAL_FREQUENCY || '3',
  '{{ENABLE_BANNER}}':          process.env.ENABLE_BANNER          || 'true',
  '{{ENABLE_INTERSTITIAL}}':    process.env.ENABLE_INTERSTITIAL    || 'true',
  '{{ENABLE_REWARDED}}':        process.env.ENABLE_REWARDED        || 'false',
  '{{ENABLE_APP_OPEN}}':        process.env.ENABLE_APP_OPEN        || 'false',
  '{{ENABLE_PULL_TO_REFRESH}}': process.env.ENABLE_PULL_TO_REFRESH || 'true',
  '{{ENABLE_PROGRESS_BAR}}':    process.env.ENABLE_PROGRESS_BAR   || 'true',
  '{{ENABLE_OFFLINE_PAGE}}':    process.env.ENABLE_OFFLINE_PAGE    || 'true',
  '{{ENABLE_PUSH}}':            process.env.ENABLE_PUSH            || 'false',
  '{{SPLASH_BG_COLOR}}':        process.env.SPLASH_BG_COLOR  || '#FFFFFF',
  '{{SPLASH_DURATION}}':        process.env.SPLASH_DURATION  || '2000',
  '{{SPLASH_TAGLINE}}':         process.env.SPLASH_TAGLINE   || '',
};

const required = ['APP_NAME', 'PACKAGE_NAME', 'WEBSITE_URL', 'ADMOB_APP_ID'];
const missing  = required.filter(k => !process.env[k]);
if (missing.length) { console.error('Missing env vars:', missing.join(', ')); process.exit(1); }

const TEXT_EXTS  = new Set(['.kt','.java','.xml','.gradle','.properties','.json','.html','.txt']);
const SKIP_DIRS  = new Set(['.gradle','build','.git','node_modules','.github','scripts']);

let files = 0, replacements = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (!SKIP_DIRS.has(entry.name)) walk(full); continue; }
    if (!TEXT_EXTS.has(path.extname(entry.name).toLowerCase())) continue;
    let src = fs.readFileSync(full, 'utf8'), changed = false;
    for (const [k, v] of Object.entries(tokens)) {
      if (v != null && src.includes(k)) { src = src.split(k).join(v); changed = true; replacements++; }
    }
    if (changed) { fs.writeFileSync(full, src, 'utf8'); files++; }
  }
}

console.log(`Injecting tokens (test mode: ${isTest})...`);
walk(process.cwd());
console.log(`Done — ${files} files, ${replacements} replacements.`);
