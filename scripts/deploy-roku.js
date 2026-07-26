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

export async function deployToRoku(ipArg, passArg) {
  loadEnv();

  const isDebug = process.argv.some(arg => arg === '--debug' || arg === '-d') ||
                  process.env.DEBUG === 'true' || process.env.ROKU_DEBUG === 'true';

  const positionalArgs = process.argv.slice(2).filter(arg => !arg.startsWith('-'));
  const rawIp = ipArg || positionalArgs[0] || process.env.ROKU_HOST || process.env.ROKU_IP || '10.0.0.171';
  const cleanIp = rawIp.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const rokuPass = passArg || positionalArgs[1] || process.env.ROKU_PASSWORD || process.env.ROKU_DEV_PASSWORD || 'sobeoapp';
  const username = 'rokudev';

  const deployDir = path.join(process.cwd(), 'deploy');
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }

  console.log(`\n🚀 [Node.js] Deploying Roku Channel to Roku TV at http://${cleanIp} using roku-deploy...`);
  if (isDebug) {
    console.log(`[DEBUG 🛠️] Debug Mode Enabled.`);
    console.log(`[DEBUG 🛠️] Timestamp: ${new Date().toISOString()}`);
    console.log(`[DEBUG 🛠️] Node Version: ${process.version}`);
    console.log(`[DEBUG 🛠️] Target IP/Host: ${cleanIp}`);
    console.log(`[DEBUG 🛠️] Username: ${username}`);
    console.log(`[DEBUG 🛠️] Password set: ${rokuPass ? `YES (${rokuPass.length} chars)` : 'NO'}`);
    console.log(`[DEBUG 🛠️] process.env.ROKU_HOST: ${process.env.ROKU_HOST || '(not set)'}`);
    console.log(`[DEBUG 🛠️] process.env.ROKU_PASSWORD: ${process.env.ROKU_PASSWORD ? '***' : '(not set)'}`);
  }

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

  if (isDebug) {
    console.log(`[DEBUG 🛠️] rokuDeploy options configuration:`);
    console.log(JSON.stringify(options, null, 2));
  }

  try {
    const startTime = Date.now();
    await rokuDeploy.publish(options);
    const durationMs = Date.now() - startTime;

    console.log(`\n🎉 SUCCESS! Channel deployed and launched on Roku TV (${cleanIp}) in ${durationMs}ms!`);

    const zipPath = path.join(deployDir, 'roku-channel.zip');
    if (fs.existsSync(zipPath)) {
      if (isDebug) {
        const stats = fs.statSync(zipPath);
        console.log(`[DEBUG 🛠️] Package verified: ${zipPath} (${(stats.size / 1024).toFixed(2)} KB, modified: ${stats.mtime.toISOString()})`);
      }
      if (!fs.existsSync('public')) {
        fs.mkdirSync('public', { recursive: true });
      }
      fs.copyFileSync(zipPath, path.join('public', 'roku-channel.zip'));
    }
  } catch (err) {
    console.error(`\n❌ Deployment error:`, err.message || err);
    if (isDebug) {
      console.error(`[DEBUG 🛠️] Stack Trace:`);
      console.error(err);
    }
    console.log(`\n💡 Dicas de solução:`);
    console.log(` 1. Certifique-se de que a Roku TV (${cleanIp}) está ligada e na MESMA REDE Wi-Fi local que este computador.`);
    console.log(` 2. Confirme se o Developer Mode está ativo na Roku TV.`);
    console.log(` 3. Verifique a senha do Desenvolvedor configurada na TV (atual informada: "${rokuPass}").`);
    console.log(` 4. Se estiver rodando em ambiente de nuvem/container, execute o comando diretamente no VS Code local:`);
    console.log(`    npm run deploy-node ${cleanIp} ${rokuPass} --debug`);
  }
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  deployToRoku();
}
