#!/usr/bin/env node
// Switch the "main" entry in package.json for a given role, then run
// `expo export --platform web` and rename dist/ -> dist-<role>/.
// Usage: node scripts/build-web.js client|restaurant|courier|admin

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const role = process.argv[2];
const VALID = ['client', 'restaurant', 'courier', 'admin'];
if (!VALID.includes(role)) {
  console.error(`Usage: node scripts/build-web.js ${VALID.join('|')}`);
  process.exit(1);
}

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const originalMain = pkg.main;

try {
  pkg.main = `index.${role}.ts`;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`[build:${role}] entrée: ${pkg.main}`);

  // Clean previous dist
  const distDir = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  execSync('npx expo export --platform web', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  // Rename dist -> dist-<role>
  const target = path.join(__dirname, '..', `dist-${role}`);
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
  fs.renameSync(distDir, target);
  console.log(`[build:${role}] terminé → ${target}`);
} finally {
  // Toujours restaurer le main original pour ne pas polluer le repo
  pkg.main = originalMain;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}
