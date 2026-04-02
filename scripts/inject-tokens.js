const fs   = require('fs');
const path = require('path');

const TEST_IDS = {
  banner:        'ca-app-pub-3940256099942544/6300978111',
  interstitial:  'ca-app-pub-3940256099942544/1033173712',
  rewarded:      'ca-app-pub-3940256099942544/5224354917',
  appOpen:       'ca-app-pub-3940256099942544/3419835294',
  appId:         'ca-app-pub-3940256099942544~3347511713',
};

const isTest      = process.env.TEST_MODE   === 'true';
const pushEnabled = process.env.ENABLE_PUSH === 'true';

function extractDomain(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

let admobAppId = process.env.ADMOB_APP_ID || TEST_IDS.appId;

// Validation: Ensure App ID format is correct (ca-app-pub-################~##########)
const appIdRegex = /^ca-app-pub-\d{16}~\d{10}$/;
if (process.env.ADMOB_APP_ID && !appIdRegex.test(process.env.ADMOB_APP_ID)) {
  console.warn(`WARNING: Invalid ADMOB_APP_ID: "${process.env.ADMOB_APP_ID}". Using test ID.`);
  admobAppId = TEST_IDS.appId;
}

const tokens = {
  '{{APP_NAME}}':               process.env.APP_NAME,
  '{{PACKAGE_NAME}}':           process.env.PACKAGE_NAME,
  '{{VERSION_NAME}}':           process.env.VERSION_NAME    || '1.0',
  '{{VERSION_CODE}}':           process.env.VERSION_CODE    || '1',
  '{{WEBSITE_URL}}':            process.env.WEBSITE_URL,
  '{{WEBSITE_DOMAIN}}':         extractDomain(process.env.WEBSITE_URL || ''),
  '{{ADMOB_APP_ID}}':           admobAppId,
  '{{BANNER_UNIT_ID}}':         isTest ? TEST_IDS.banner       : (process.env.BANNER_UNIT_ID       || TEST_IDS.banner),
  '{{INTERSTITIAL_UNIT_ID}}':   isTest ? TEST_IDS.interstitial : (process.env.INTERSTITIAL_UNIT_ID || TEST_IDS.interstitial),
  '{{REWARDED_UNIT_ID}}':       isTest ? TEST_IDS.rewarded     : (process.env.REWARDED_UNIT_ID     || TEST_IDS.rewarded),
  '{{APP_OPEN_UNIT_ID}}':       isTest ? TEST_IDS.appOpen      : (process.env.APP_OPEN_UNIT_ID     || TEST_IDS.appOpen),
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
  '{{SPLASH_DURATION}}':        String(parseInt(process.env.SPLASH_DURATION || '2000', 10)),
  '{{SPLASH_TAGLINE}}':         process.env.SPLASH_TAGLINE   || '',
};

const required = ['APP_NAME', 'PACKAGE_NAME', 'WEBSITE_URL'];
const missing  = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing required env vars:', missing.join(', '));
  process.exit(1);
}

if (!process.env.ADMOB_APP_ID) {
  console.warn('WARNING: ADMOB_APP_ID not set — using test App ID');
}

console.log(`Injecting tokens (test mode: ${isTest})...`);

const TEXT_EXTS = new Set(['.kt','.java','.xml','.gradle','.properties','.json','.html','.txt']);
const SKIP_DIRS = new Set(['.gradle','build','.git','node_modules','.github','scripts']);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full);
      continue;
    }
    if (!TEXT_EXTS.has(path.extname(entry.name).toLowerCase())) continue;

    let src = fs.readFileSync(full, 'utf8'), changed = false;

    if (src.includes('{{PUSH_SERVICE_START}}')) {
      if (!pushEnabled) {
        src = src.replace(/[ \t]*<!--[ \t]*\{\{PUSH_SERVICE_START\}\}[\s\S]*?<!--[ \t]*\{\{PUSH_SERVICE_END\}\}[ \t]*-->[ \t]*\n?/m, '');
        console.log(`  ✓ Removed FCM push service block from ${full}`);
      } else {
        src = src.replace(/[ \t]*<!--[ \t]*\{\{PUSH_SERVICE_START\}\}[^\n]*-->\n?/m, '');
        src = src.replace(/[ \t]*<!--[ \t]*\{\{PUSH_SERVICE_END\}\}[ \t]*-->\n?/m, '');
        console.log(`  ✓ Kept FCM push service block in ${full}`);
      }
      changed = true;
    }

    for (const [k, v] of Object.entries(tokens)) {
      if (v != null && src.includes(k)) {
        src = src.split(k).join(v);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(full, src, 'utf8');
      console.log(`  ✓ ${full}`);
    }
  }
}

walk(process.cwd());
console.log(`Done.`);

const criticalFiles = ['app/src/main/AndroidManifest.xml'];
for (const f of criticalFiles) {
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, 'utf8');
  const unreplaced = [...content.matchAll(/\{\{[A-Z_]+\}\}/g)].map(m => m[0]);
  if (unreplaced.length) {
    console.error(`ERROR: Unreplaced tokens in ${f}: ${[...new Set(unreplaced)].join(', ')}`);
    process.exit(1);
  }
}
