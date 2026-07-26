import rokuDeploy from 'roku-deploy';
import fs from 'fs';
import path from 'path';

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

export async function deployToRoku(ipArg, passArg) {
  loadEnv();

  const rawIp = ipArg || process.argv[2] || process.env.ROKU_HOST || process.env.ROKU_IP || '10.0.0.171';
  const cleanIp = rawIp.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const rokuPass = passArg || process.argv[3] || process.env.ROKU_PASSWORD || process.env.ROKU_DEV_PASSWORD || 'sobeoapp';
  const username = 'rokudev';

  const deployDir = path.join(process.cwd(), 'deploy');
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }

  console.log(`\n🚀 [Node.js] Deploying Roku Channel to Roku TV at http://${cleanIp} using roku-deploy...`);

  const options = {
    host: cleanIp,
    password: rokuPass,
    username: username,
    rootDir: process.cwd(),
    outDir: deployDir,
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
    await rokuDeploy.publish(options);
    console.log(`\n🎉 SUCCESS! Channel deployed and launched on Roku TV (${cleanIp})!`);

    const zipPath = path.join(deployDir, 'roku-channel.zip');
    if (fs.existsSync(zipPath)) {
      if (!fs.existsSync('public')) {
        fs.mkdirSync('public', { recursive: true });
      }
      fs.copyFileSync(zipPath, path.join('public', 'roku-channel.zip'));
    }
  } catch (err) {
    console.error(`\n❌ Deployment error:`, err.message || err);
    console.log(`\n💡 Dicas de solução:`);
    console.log(` 1. Certifique-se de que a Roku TV (${cleanIp}) está ligada e na MESMA REDE Wi-Fi local que este computador.`);
    console.log(` 2. Confirme se o Developer Mode está ativo na Roku TV.`);
    console.log(` 3. Verifique a senha do Desenvolvedor configurada na TV (atual informada: "${rokuPass}").`);
    console.log(` 4. Se estiver rodando em ambiente de nuvem/container, execute o comando diretamente no VS Code local:`);
    console.log(`    npm run deploy-node ${cleanIp} ${rokuPass}`);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  deployToRoku();
}
