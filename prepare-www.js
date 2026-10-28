const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const wwwDir = path.join(rootDir, 'www');

// إنشاء أو تفريغ مجلد www
if (!fs.existsSync(wwwDir)) {
  fs.mkdirSync(wwwDir, { recursive: true });
}

// قائمة الملفات المراد نسخها لمجلد www الخاص بـ Capacitor
const filesToCopy = [
  'index.html',
  'login.html',
  'home.html',
  'ai-medguide.html',
  'ai-medguide-caregiver.html',
  'ai-medguide-auth.html',
  'manifest.json',
  'sw.js',
  'icon-192.png',
  'icon-512.png',
  'icon-192-maskable.png',
  'icon-512-maskable.png'
];

let copiedCount = 0;
for (const file of filesToCopy) {
  const src = path.join(rootDir, file);
  const dest = path.join(wwwDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    copiedCount++;
  } else {
    console.warn(`[prepare-www] Warning: File not found: ${file}`);
  }
}

console.log(`[prepare-www] Successfully prepared ${copiedCount} files in: ${wwwDir}`);
