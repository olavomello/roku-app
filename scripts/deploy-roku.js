import rokuDeploy from 'roku-deploy';
import fs from 'fs';
import path from 'path';

export async function deployToRoku(ipArg, passArg) {
  const rawIp = ipArg || process.argv[2] || process.env.ROKU_IP || '10.0.0.171';
  const cleanIp = rawIp.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const rokuPass = passArg || process.argv[3] || process.env.ROKU_DEV_PASSWORD || 'sobeoapp';
  const username = 'rokudev';

  console.log(`\n🚀 Deploying Roku Channel to Roku TV at http://${cleanIp} using roku-deploy...`);

  const options = {
    host: cleanIp,
    password: rokuPass,
    username: username,
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
    await rokuDeploy.publish(options);
    console.log(`\n🎉 SUCCESS! Channel deployed and launched on Roku TV (${cleanIp})!`);

    if (fs.existsSync('roku-channel.zip')) {
      if (!fs.existsSync('public')) {
        fs.mkdirSync('public', { recursive: true });
      }
      fs.copyFileSync('roku-channel.zip', path.join('public', 'roku-channel.zip'));
    }
  } catch (err) {
    console.error(`\n❌ Deployment error:`, err.message || err);
    console.log(`\n💡 Dicas de solução:`);
    console.log(` 1. Certifique-se de que a Roku TV (${cleanIp}) está ligada e na MESMA REDE Wi-Fi local que este computador.`);
    console.log(` 2. Confirme se o Developer Mode está ativo na Roku TV.`);
    console.log(` 3. Verifique a senha do Desenvolvedor configurada na TV (atual informada: "${rokuPass}").`);
    console.log(` 4. Se estiver rodando em ambiente de nuvem/container, execute o comando diretamente no VS Code local:`);
    console.log(`    npm run deploy:roku ${cleanIp} ${rokuPass}`);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  deployToRoku();
}
