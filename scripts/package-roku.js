import rokuDeploy from 'roku-deploy';
import fs from 'fs';
import path from 'path';
import { generateRokuAssets } from './generate_assets.js';

export async function packageRoku() {
  console.log('📦 Packaging Roku SceneGraph Channel into roku-channel.zip using roku-deploy...');

  // Ensure HD & FHD images are present
  generateRokuAssets();

  const options = {
    rootDir: process.cwd(),
    outDir: process.cwd(),
    outFile: 'roku-channel',
    retainDeploymentArchive: true,
    files: [
      'manifest',
      'source/**/*.*',
      'components/**/*.*',
      'screens/**/*.*',
      'services/**/*.*',
      'tasks/**/*.*',
      'models/**/*.*',
      'utils/**/*.*',
      'feeds/**/*.*',
      'assets/**/*.*',
    ],
  };

  try {
    await rokuDeploy.createPackage(options);

    const zipName = 'roku-channel.zip';
    const publicZip = path.join('public', zipName);

    if (!fs.existsSync('public')) {
      fs.mkdirSync('public', { recursive: true });
    }

    if (fs.existsSync(zipName)) {
      fs.copyFileSync(zipName, publicZip);
      const sizeKb = (fs.statSync(zipName).size / 1024).toFixed(2);
      console.log(`\n✅ Roku channel package built successfully: ${zipName} (${sizeKb} KB)`);
      console.log(`✅ Web download link: /${zipName}`);
    }
  } catch (err) {
    console.error('❌ Packaging error:', err.message || err);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  packageRoku();
}
