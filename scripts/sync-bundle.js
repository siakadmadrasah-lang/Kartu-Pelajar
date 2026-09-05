import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const bundleDir = path.join(rootDir, 'public', 'app-bundle');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      // Ignore nested app-bundle and node server bundle files
      if (childItemName === 'app-bundle' || childItemName === 'server.cjs' || childItemName === 'server.cjs.map') return;
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    const filename = path.basename(src);
    if (filename !== 'server.cjs' && filename !== 'server.cjs.map') {
      fs.copyFileSync(src, dest);
    }
  }
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      const rel = path.relative(bundleDir, fullPath).replace(/\\/g, '/');
      if (!rel.startsWith('app-bundle/') && rel !== 'manifest.json' && !rel.endsWith('server.cjs') && !rel.endsWith('server.cjs.map')) {
        arrayOfFiles.push(rel);
      }
    }
  });
  return arrayOfFiles;
}

if (fs.existsSync(distDir)) {
  if (fs.existsSync(bundleDir)) {
    fs.rmSync(bundleDir, { recursive: true, force: true });
  }
  fs.mkdirSync(bundleDir, { recursive: true });
  copyRecursiveSync(distDir, bundleDir);
  const allFiles = getAllFiles(bundleDir);
  fs.writeFileSync(
    path.join(bundleDir, 'manifest.json'),
    JSON.stringify({ files: allFiles, builtAt: new Date().toISOString() }, null, 2)
  );
  console.log('App bundle successfully synced to public/app-bundle with', allFiles.length, 'files:', allFiles);
} else {
  console.warn('dist folder does not exist, run vite build first.');
}

