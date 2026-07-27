import rokuDeploy from 'roku-deploy';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

export async function packageRoku() {
  loadEnv();
  console.log('📦 Packaging Roku SceneGraph Channel into deploy/roku-channel.zip using roku-deploy...');

  const deployDir = path.join(process.cwd(), 'deploy');
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }

  const options = {
    rootDir: process.cwd(),
    outDir: deployDir,
    outFile: 'roku-channel',
    retainDeploymentArchive: true,
    files: [
      'manifest',
      'source/**/*.*',
      'components/**/*.*',
      // screens/ and tasks/ excluded: canonical BRS+XML now live under components/screens/ and components/tasks/
      // Including them would create duplicate component definitions that break Roku SceneGraph loading
      'services/**/*.*',
      'models/**/*.*',
      'utils/**/*.*',
      'feeds/**/*.*',
      'assets/**/*.*',
    ],
  };

  try {
    await rokuDeploy.createPackage(options);

    const zipPath = path.join(deployDir, 'roku-channel.zip');
    const publicZip = path.join(process.cwd(), 'public', 'roku-channel.zip');

    if (!fs.existsSync('public')) {
      fs.mkdirSync('public', { recursive: true });
    }

    if (fs.existsSync(zipPath)) {
      fs.copyFileSync(zipPath, publicZip);
      const sizeKb = (fs.statSync(zipPath).size / 1024).toFixed(2);
      console.log(`\n✅ Roku channel package built successfully in deploy folder: ${zipPath} (${sizeKb} KB)`);
      console.log(`✅ Web download link available at: /roku-channel.zip`);
    }
  } catch (err) {
    console.error('❌ Packaging error:', err.message || err);
  }
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  packageRoku();
}
