import fs from 'fs';
import path from 'path';
import http from 'http';
import crypto from 'crypto';
import { packageRoku } from './package-roku.js';

function parseDigestHeader(header) {
  const params = {};
  const matches = header.replace(/^Digest\s+/, '').match(/(\w+)=("[^"]*"|[^,]*)/g);
  if (matches) {
    for (const match of matches) {
      const idx = match.indexOf('=');
      const key = match.substring(0, idx).trim();
      let val = match.substring(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      params[key] = val;
    }
  }
  return params;
}

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

export async function deployToRoku(ipArg, passArg) {
  const rokuIp = ipArg || process.argv[2] || '10.0.0.171';
  const rokuPass = passArg || process.argv[3] || 'sobeoapp';
  const username = 'rokudev';

  const zipFile = 'roku-channel.zip';
  if (!fs.existsSync(zipFile)) {
    console.log('📦 roku-channel.zip not found. Building package first...');
    packageRoku();
  }

  const cleanIp = rokuIp.replace(/^https?:\/\//, '').replace(/\/$/, '');
  console.log(`\n🚀 Deploying ${zipFile} to Roku TV at http://${cleanIp} (User: ${username})...`);

  const boundary = '----RokuFormBoundary' + Math.random().toString(36).substring(2);
  const zipContent = fs.readFileSync(zipFile);

  const headerPart =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="mysubmit"\r\n\r\nInstall\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="archive"; filename="${zipFile}"\r\n` +
    `Content-Type: application/zip\r\n\r\n`;

  const footerPart = `\r\n--${boundary}--\r\n`;

  const bodyBuffer = Buffer.concat([
    Buffer.from(headerPart, 'utf-8'),
    zipContent,
    Buffer.from(footerPart, 'utf-8'),
  ]);

  // Step 1: Send request to get 401 WWW-Authenticate Digest header
  const makeRequest = (authHeader = null) => {
    return new Promise((resolve, reject) => {
      const headers = {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuffer.length,
      };
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const req = http.request(
        {
          hostname: cleanIp,
          port: 80,
          path: '/plugin_install',
          method: 'POST',
          headers,
          timeout: 10000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
        }
      );

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Timeout connecting to Roku TV at ${cleanIp}`));
      });

      req.write(bodyBuffer);
      req.end();
    });
  };

  try {
    const initialRes = await makeRequest();

    if (initialRes.statusCode === 401 && initialRes.headers['www-authenticate']) {
      const authHeaderStr = initialRes.headers['www-authenticate'];
      const params = parseDigestHeader(authHeaderStr);

      const realm = params.realm || '';
      const nonce = params.nonce || '';
      const qop = params.qop || '';

      const nc = '00000001';
      const cnonce = crypto.randomBytes(8).toString('hex');
      const uri = '/plugin_install';
      const method = 'POST';

      const ha1 = md5(`${username}:${realm}:${rokuPass}`);
      const ha2 = md5(`${method}:${uri}`);

      let response;
      if (qop) {
        response = md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
      } else {
        response = md5(`${ha1}:${nonce}:${ha2}`);
      }

      let digestAuth = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}"`;
      if (qop) {
        digestAuth += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
      }
      if (params.opaque) {
        digestAuth += `, opaque="${params.opaque}"`;
      }

      const authRes = await makeRequest(digestAuth);
      handleResponse(authRes.body, cleanIp);
    } else {
      handleResponse(initialRes.body, cleanIp);
    }
  } catch (err) {
    console.log(`\n⚠️ Direct HTTP upload note: ${err.message}`);
    console.log(`💡 Note: If running on a cloud environment or remote terminal, the Roku TV (${cleanIp}) must be on the same local Wi-Fi network as the machine running this command.`);
    console.log(`💡 In VS Code on your local machine, run:\n   npm run deploy:roku ${cleanIp} ${rokuPass}`);
  }
}

function handleResponse(htmlBody, ip) {
  if (
    htmlBody.includes('Identical binary already exists') ||
    htmlBody.includes('Install Success') ||
    htmlBody.includes('Plugin install success')
  ) {
    console.log(`\n🎉 SUCCESS! Channel deployed and launched on Roku TV (${ip})!`);
  } else if (htmlBody.includes('Unauthorized') || htmlBody.includes('401')) {
    console.log('\n❌ Authentication failed. Please check your Roku Developer password.');
  } else {
    console.log('\nResponse from Roku device:');
    console.log(htmlBody.substring(0, 500));
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  deployToRoku();
}
