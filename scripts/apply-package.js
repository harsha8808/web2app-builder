#!/usr/bin/env node
/**
 * apply-package.js
 * Moves Kotlin source files from the placeholder package directory
 * (com/template/app) to the user's actual package path.
 */

const fs   = require('fs');
const path = require('path');

const pkg = process.env.PACKAGE_NAME;
if (!pkg) { console.error('PACKAGE_NAME required'); process.exit(1); }
if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/.test(pkg)) {
  console.error(`Invalid package name: ${pkg}`); process.exit(1);
}

const srcBase    = path.join(process.cwd(), 'app/src/main/java');
const tmplPath   = path.join(srcBase, 'com', 'template', 'app');
const targetPath = path.join(srcBase, ...pkg.split('.'));

fs.mkdirSync(targetPath, { recursive: true });

if (fs.existsSync(tmplPath)) {
  for (const f of fs.readdirSync(tmplPath)) {
    fs.renameSync(path.join(tmplPath, f), path.join(targetPath, f));
    console.log(`Moved: ${f} → ${pkg.replace(/\./g,'/')}/`);
  }
  fs.rmSync(path.join(srcBase, 'com', 'template'), { recursive: true, force: true });
  console.log('Removed placeholder directory.');
}
console.log(`Package applied: ${pkg}`);
