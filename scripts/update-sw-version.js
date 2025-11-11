#!/usr/bin/env node

/**
 * Update Service Worker Version Script
 *
 * อัปเดต CACHE_VERSION ใน service-worker.js อัตโนมัติ
 * ใช้ timestamp เป็น version: suekk-YYYYMMDD-HHmm
 *
 * Usage:
 *   node scripts/update-sw-version.js
 *   หรือเพิ่มใน package.json scripts: "update-sw": "node scripts/update-sw-version.js"
 */

const fs = require('fs');
const path = require('path');

// Paths
const SW_FILE = path.join(__dirname, '../public/service-worker.js');

// Generate version string: suekk-YYYYMMDD-HHmm
function generateVersion() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `suekk-${year}${month}${day}-${hours}${minutes}`;
}

// Update service worker file
function updateServiceWorker() {
  try {
    // Read file
    let content = fs.readFileSync(SW_FILE, 'utf8');

    // Generate new version
    const newVersion = generateVersion();

    // Replace CACHE_VERSION line
    const versionRegex = /const CACHE_VERSION = ['"]suekk-\d{8}-\d{4}['"];/;

    if (!versionRegex.test(content)) {
      console.error('❌ Error: CACHE_VERSION pattern not found in service-worker.js');
      console.error('   Make sure the file contains: const CACHE_VERSION = \'suekk-YYYYMMDD-HHmm\';');
      process.exit(1);
    }

    content = content.replace(
      versionRegex,
      `const CACHE_VERSION = '${newVersion}';`
    );

    // Write back
    fs.writeFileSync(SW_FILE, content, 'utf8');

    console.log('✅ Service Worker version updated successfully!');
    console.log(`   New version: ${newVersion}`);
    console.log(`   File: ${SW_FILE}`);
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Build your app: npm run build');
    console.log('   2. Deploy to production');
    console.log('   3. Users will see update prompt automatically');
  } catch (error) {
    console.error('❌ Error updating service worker:', error.message);
    process.exit(1);
  }
}

// Run
console.log('🔄 Updating Service Worker version...');
console.log('');
updateServiceWorker();
