import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import * as ftp from 'basic-ftp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

async function deploy() {
  console.log('🚀 Building production bundle with latest fixes...');
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });

  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log('\n🔌 Connecting to FTP server: ftp.devsynx.com...');
    await client.access({
      host: 'ftp.devsynx.com',
      user: 'nadeem@websynx.devsynx.com',
      password: 'Allah512@@',
      port: 21,
      secure: false
    });

    console.log('✅ Connected successfully!');
    console.log('📂 Remote root listing:');
    const list = await client.list();
    console.log(list.map(f => `${f.name} (${f.size} bytes)`).join('\n'));

    console.log('\n📤 Uploading dist directory to FTP root...');
    try {
      await client.clearWorkingDir();
    } catch (e) {
      console.log('Note on clear working dir:', e.message);
    }
    await client.uploadFromDir(distDir);

    console.log('\n🎉 Deployment complete! All latest assets and index.html have been published to http://websynx.devsynx.com');
  } catch (err) {
    console.error('❌ FTP Deployment error:', err);
  } finally {
    client.close();
  }
}

deploy();
