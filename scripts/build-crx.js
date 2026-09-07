import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function buildCrx() {
  const distDir = path.join(rootDir, 'dist');
  if (!fs.existsSync(path.join(distDir, 'manifest.json'))) {
    console.log('Running npm run build first...');
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  const version = pkg.version || '0.1.0';
  const zipPath = path.join(rootDir, `stopslop-v${version}.zip`);
  const crxPath = path.join(rootDir, `stopslop-v${version}.crx`);
  const keyPath = path.join(rootDir, 'stopslop-key.pem');

  // 1. Create ZIP Archive
  console.log(`Packaging dist/ into ${path.basename(zipPath)}...`);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  execSync(`cd "${distDir}" && /usr/bin/zip -r "${zipPath}" . -x "*.DS_Store"`, { stdio: 'inherit' });

  // 2. Ensure RSA Private Key (using native Node.js crypto)
  if (!fs.existsSync(keyPath)) {
    console.log('Generating RSA-2048 private key...');
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    fs.writeFileSync(keyPath, privateKey);
  }

  const privateKeyPem = fs.readFileSync(keyPath, 'utf-8');

  // 3. Extract public key in DER format
  const pubKeyObj = crypto.createPublicKey(privateKeyPem);
  const pubkeyDer = pubKeyObj.export({ type: 'spki', format: 'der' });

  // 4. Sign the zip payload
  const zipBuffer = fs.readFileSync(zipPath);
  const signer = crypto.createSign('sha1');
  signer.update(zipBuffer);
  const signature = signer.sign(privateKeyPem);

  // 5. Assemble CRX file (CRX2 format)
  const magic = Buffer.from('Cr24'); // 4 bytes
  const header = Buffer.alloc(12);
  header.writeUInt32LE(2, 0); // version 2
  header.writeUInt32LE(pubkeyDer.length, 4); // pubkey len
  header.writeUInt32LE(signature.length, 8); // sig len

  const crxBuffer = Buffer.concat([magic, header, pubkeyDer, signature, zipBuffer]);
  fs.writeFileSync(crxPath, crxBuffer);

  console.log(`\n🎉 CRX Package Built Successfully!`);
  console.log(`📦 CRX File: ${path.basename(crxPath)} (${(crxBuffer.length / 1024).toFixed(1)} KB)`);
  console.log(`📦 ZIP File: ${path.basename(zipPath)} (${(zipBuffer.length / 1024).toFixed(1)} KB)`);
  console.log(`🔑 Key File: ${path.basename(keyPath)}\n`);
}

buildCrx();
