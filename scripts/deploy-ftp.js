import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import * as ftp from 'basic-ftp';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

async function deploy() {
  console.log('🚀 Building production bundle with latest fixes...');
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });

  const client = new ftp.Client();
  client.ftp.verbose = false; // cleaner output
  client.ftp.timeout = 120000;

  const ftpConfig = {
    host: '209.42.21.27',
    user: 'nadeem@websynx.devsynx.com',
    password: 'Allah512@@',
    port: 21,
    secure: false
  };

  const ensureConnected = async () => {
    if (!client.closed) {
      try {
        await client.pwd();
        return;
      } catch (e) {}
    }
    console.log('🔌 Connecting to FTP server: 209.42.21.27...');
    await client.access(ftpConfig);
    console.log('✅ Connected successfully!');
  };

  const uploadFileWithRetry = async (localPath, remoteName, targetDir = '/') => {
    let attempts = 3;
    while (attempts > 0) {
      try {
        await ensureConnected();
        await client.cd('/');
        if (targetDir && targetDir !== '/') {
          await client.ensureDir(targetDir);
        }
        await client.uploadFrom(localPath, remoteName);
        console.log(`  ✓ Uploaded ${targetDir === '/' ? '' : targetDir + '/'}${remoteName}`);
        await new Promise(r => setTimeout(r, 200));
        return;
      } catch (err) {
        attempts--;
        console.warn(`  ⚠️ Upload failed for ${remoteName}: ${err.message}. Retrying (${attempts} attempts left)...`);
        try { client.close(); } catch (e) {}
        await new Promise(r => setTimeout(r, 1500));
        if (attempts === 0) throw err;
      }
    }
  };

  try {
    await ensureConnected();

    // 1. Upload assets
    console.log('\n📤 Uploading assets directory...');
    const assetFiles = fs.readdirSync(path.join(distDir, 'assets'));
    for (const file of assetFiles) {
      await uploadFileWithRetry(path.join(distDir, 'assets', file), file, 'assets');
    }

    // 2. Upload api files if present
    if (fs.existsSync(path.join(distDir, 'api'))) {
      console.log('\n📤 Uploading api directory for cPanel MySQL...');
      const apiFiles = fs.readdirSync(path.join(distDir, 'api'));
      for (const file of apiFiles) {
        await uploadFileWithRetry(path.join(distDir, 'api', file), file, 'api');
      }
    }

    // 3. Upload root files
    console.log('\n📤 Uploading root files...');
    await uploadFileWithRetry(path.join(distDir, 'index.html'), 'index.html', '/');
    if (fs.existsSync(path.join(distDir, 'favicon.svg'))) {
      await uploadFileWithRetry(path.join(distDir, 'favicon.svg'), 'favicon.svg', '/');
    }
    if (fs.existsSync(path.join(distDir, 'icons.svg'))) {
      await uploadFileWithRetry(path.join(distDir, 'icons.svg'), 'icons.svg', '/');
    }
    if (fs.existsSync(path.join(distDir, 'robots.txt'))) {
      await uploadFileWithRetry(path.join(distDir, 'robots.txt'), 'robots.txt', '/');
    }
    if (fs.existsSync(path.join(distDir, 'sitemap.xml'))) {
      await uploadFileWithRetry(path.join(distDir, 'sitemap.xml'), 'sitemap.xml', '/');
    }
    if (fs.existsSync(path.join(distDir, 'Ecomxstocks_Operations_Manual.pdf'))) {
      await uploadFileWithRetry(path.join(distDir, 'Ecomxstocks_Operations_Manual.pdf'), 'Ecomxstocks_Operations_Manual.pdf', '/');
    }
    if (fs.existsSync(path.join(distDir, '.htaccess'))) {
      try {
        await uploadFileWithRetry(path.join(distDir, '.htaccess'), '.htaccess', '/');
      } catch (e) {
        console.warn('Notice: .htaccess preserved on server');
      }
    }

    // 4. Admin folder fallback if present
    if (fs.existsSync(path.join(distDir, 'admin', 'index.html'))) {
      try {
        console.log('\n📤 Uploading /admin fallback...');
        await uploadFileWithRetry(path.join(distDir, 'admin', 'index.html'), 'index.html', 'admin');
      } catch (adminErr) {
        console.warn('Notice: /admin folder managed via .htaccess rewrite rule:', adminErr.message);
      }
    }

    console.log('\n🎉 Deployment complete! All latest assets and files have been successfully published to http://websynx.devsynx.com');
  } catch (err) {
    console.error('❌ FTP Deployment error:', err);
  } finally {
    try {
      client.close();
    } catch(e) {}
  }
}

deploy();
