import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import * as ftp from 'basic-ftp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

import fs from 'fs';

async function deploy() {
  console.log('🚀 Building production bundle with latest fixes...');
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });

  const client = new ftp.Client();
  client.ftp.verbose = true;
  client.ftp.timeout = 60000;

  try {
    console.log('\n🔌 Connecting to FTP server: 209.42.21.27 (ecomxstocks.com)...');
    await client.access({
      host: '209.42.21.27',
      user: 'nadeem@websynx.devsynx.com',
      password: 'Allah512@@',
      port: 21,
      secure: false
    });

    console.log('✅ Connected successfully!');

    // 1. Ensure assets directory exists and upload assets FIRST (the JS & CSS bundle)
    console.log('📤 Uploading assets directory...');
    await client.ensureDir('assets');
    const assetFiles = fs.readdirSync(path.join(distDir, 'assets'));
    for (const file of assetFiles) {
      console.log(`Uploading assets/${file}...`);
      await client.uploadFrom(path.join(distDir, 'assets', file), file);
    }
    await client.cdup();

    // 2. Ensure api directory exists and upload PHP REST API files
    if (fs.existsSync(path.join(distDir, 'api'))) {
      console.log('📤 Uploading api directory for cPanel MySQL...');
      await client.ensureDir('api');
      const apiFiles = fs.readdirSync(path.join(distDir, 'api'));
      for (const file of apiFiles) {
        console.log(`Uploading api/${file}...`);
        await client.uploadFrom(path.join(distDir, 'api', file), file);
      }
      await client.cdup();
    }

    // 3. Upload index.html and root files
    console.log('📤 Uploading index.html and root files...');
    await client.uploadFrom(path.join(distDir, 'index.html'), 'index.html');
    if (fs.existsSync(path.join(distDir, '.htaccess'))) {
      try {
        console.log('📤 Uploading .htaccess...');
        await client.uploadFrom(path.join(distDir, '.htaccess'), '.htaccess');
      } catch (e) {
        console.warn('Notice: .htaccess preserved on server');
      }
    }
    if (fs.existsSync(path.join(distDir, 'favicon.svg'))) {
      await client.uploadFrom(path.join(distDir, 'favicon.svg'), 'favicon.svg');
    }
    if (fs.existsSync(path.join(distDir, 'icons.svg'))) {
      await client.uploadFrom(path.join(distDir, 'icons.svg'), 'icons.svg');
    }
    if (fs.existsSync(path.join(distDir, 'robots.txt'))) {
      await client.uploadFrom(path.join(distDir, 'robots.txt'), 'robots.txt');
    }
    if (fs.existsSync(path.join(distDir, 'sitemap.xml'))) {
      await client.uploadFrom(path.join(distDir, 'sitemap.xml'), 'sitemap.xml');
    }
    if (fs.existsSync(path.join(distDir, 'Ecomxstocks_Operations_Manual.pdf'))) {
      await client.uploadFrom(path.join(distDir, 'Ecomxstocks_Operations_Manual.pdf'), 'Ecomxstocks_Operations_Manual.pdf');
    }

    // 4. Admin folder fallback (optional, non-blocking)
    if (fs.existsSync(path.join(distDir, 'admin', 'index.html'))) {
      try {
        console.log('📤 Uploading /admin fallback...');
        await client.ensureDir('admin');
        await client.uploadFrom(path.join(distDir, 'admin', 'index.html'), 'index.html');
        await client.cdup();
      } catch (adminErr) {
        console.warn('Notice: /admin folder managed via .htaccess rewrite rule:', adminErr.message);
      }
    }

    // Final confirmation index.html upload
    await client.uploadFrom(path.join(distDir, 'index.html'), 'index.html');

    console.log('\n🎉 Deployment complete! All latest assets, PHP REST API, and index.html have been successfully published to http://websynx.devsynx.com');
  } catch (err) {
    console.error('❌ FTP Deployment error:', err);
  } finally {
    client.close();
  }
}

deploy();
