import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { generateRokuAssets } from './generate_assets.js';

function toDosDateTime(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  const dosTime = (hour << 11) | (minute << 5) | (second >> 1);

  return { dosDate, dosTime };
}

export function packageRoku() {
  const outputFilename = 'roku-channel.zip';
  const publicOutput = path.join('public', 'roku-channel.zip');

  generateRokuAssets();

  const fixedDate = new Date(2026, 0, 1, 0, 0, 0); // 2026-01-01 00:00:00
  const { dosDate, dosTime } = toDosDateTime(fixedDate);

  const entriesToInclude = [
    'manifest',
    'source',
    'components',
    'screens',
    'services',
    'tasks',
    'models',
    'utils',
    'feeds',
    'assets',
  ];

  console.log('📦 Packaging Roku SceneGraph Channel into roku-channel.zip (Roku OS strict compatibility mode)...');

  const dirsToAdd = new Set();
  const filesToAdd = [];

  if (fs.existsSync('manifest') && fs.statSync('manifest').isFile()) {
    filesToAdd.push({ filePath: 'manifest', arcName: 'manifest' });
  }

  for (const entry of entriesToInclude) {
    if (entry === 'manifest' || !fs.existsSync(entry)) continue;

    const stat = fs.statSync(entry);
    if (stat.isFile()) {
      const arcName = entry.replace(/\\/g, '/').replace(/^\//, '');
      filesToAdd.push({ filePath: entry, arcName });
    } else if (stat.isDirectory()) {
      walkDir(entry, (filePath) => {
        const relPath = path.relative('.', filePath).replace(/\\/g, '/').replace(/^\//, '');
        const parentDir = path.dirname(relPath).replace(/\\/g, '/').replace(/^\//, '');

        if (parentDir && parentDir !== '.') {
          dirsToAdd.add(parentDir.endsWith('/') ? parentDir : parentDir + '/');
        }

        filesToAdd.push({ filePath, arcName: relPath });
      });
    }
  }

  const sortedDirs = Array.from(dirsToAdd).sort();

  // Create ZIP byte buffers
  const localHeaders = [];
  const centralDirRecords = [];
  let currentOffset = 0;

  // Add Directory Entries
  for (const dirPath of sortedDirs) {
    const filenameBuf = Buffer.from(dirPath, 'utf-8');

    // Local Header
    const lh = Buffer.alloc(30 + filenameBuf.length);
    lh.writeUInt32LE(0x04034b50, 0); // Signature
    lh.writeUInt16LE(20, 4); // Version needed (2.0)
    lh.writeUInt16LE(0, 6); // General bit flag
    lh.writeUInt16LE(0, 8); // Compression: Stored
    lh.writeUInt16LE(dosTime, 10);
    lh.writeUInt16LE(dosDate, 12);
    lh.writeUInt32LE(0, 14); // CRC32
    lh.writeUInt32LE(0, 18); // Compressed size
    lh.writeUInt32LE(0, 22); // Uncompressed size
    lh.writeUInt16LE(filenameBuf.length, 26);
    lh.writeUInt16LE(0, 28); // Extra field len
    filenameBuf.copy(lh, 30);

    localHeaders.push(lh);

    // Central Dir Record
    const cd = Buffer.alloc(46 + filenameBuf.length);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(0x0314, 4); // Unix 2.0
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(dosTime, 12);
    cd.writeUInt16LE(dosDate, 14);
    cd.writeUInt32LE(0, 16); // CRC32
    cd.writeUInt32LE(0, 20); // Compressed size
    cd.writeUInt32LE(0, 24); // Uncompressed size
    cd.writeUInt16LE(filenameBuf.length, 28);
    cd.writeUInt16LE(0, 30); // Extra field len
    cd.writeUInt16LE(0, 32); // File comment len
    cd.writeUInt16LE(0, 34); // Disk number start
    cd.writeUInt16LE(0, 36); // Internal attr
    cd.writeUInt32LE((0o40755 * 65536) >>> 0, 38); // External attr (dir)
    cd.writeUInt32LE(currentOffset, 42); // Offset
    filenameBuf.copy(cd, 46);

    centralDirRecords.push(cd);
    currentOffset += lh.length;
    console.log(`  + Added dir:  ${dirPath}`);
  }

  // Add File Entries
  for (const { filePath, arcName } of filesToAdd) {
    const rawContent = fs.readFileSync(filePath);
    const compressedContent = zlib.deflateRawSync(rawContent);
    const crc32Val = zlib.crc32(rawContent) >>> 0;
    const filenameBuf = Buffer.from(arcName, 'utf-8');

    // Local Header
    const lh = Buffer.alloc(30 + filenameBuf.length);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(8, 8); // Compression: Deflate
    lh.writeUInt16LE(dosTime, 10);
    lh.writeUInt16LE(dosDate, 12);
    lh.writeUInt32LE(crc32Val, 14);
    lh.writeUInt32LE(compressedContent.length, 18);
    lh.writeUInt32LE(rawContent.length, 22);
    lh.writeUInt16LE(filenameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    filenameBuf.copy(lh, 30);

    localHeaders.push(lh, compressedContent);

    // Central Dir Record
    const cd = Buffer.alloc(46 + filenameBuf.length);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(0x0314, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt16LE(dosTime, 12);
    cd.writeUInt16LE(dosDate, 14);
    cd.writeUInt32LE(crc32Val, 16);
    cd.writeUInt32LE(compressedContent.length, 20);
    cd.writeUInt32LE(rawContent.length, 24);
    cd.writeUInt16LE(filenameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE((0o100644 * 65536) >>> 0, 38);
    cd.writeUInt32LE(currentOffset, 42);
    filenameBuf.copy(cd, 46);

    centralDirRecords.push(cd);
    currentOffset += lh.length + compressedContent.length;
    console.log(`  + Added file: ${arcName}`);
  }

  // End of Central Directory (EOCD)
  const centralDirSize = centralDirRecords.reduce((acc, b) => acc + b.length, 0);
  const totalEntries = sortedDirs.length + filesToAdd.length;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); // Disk num
  eocd.writeUInt16LE(0, 6); // Disk start
  eocd.writeUInt16LE(totalEntries, 8);
  eocd.writeUInt16LE(totalEntries, 10);
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(currentOffset, 16);
  eocd.writeUInt16LE(0, 20); // Comment len

  const fullZip = Buffer.concat([...localHeaders, ...centralDirRecords, eocd]);

  fs.writeFileSync(outputFilename, fullZip);

  if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
  }
  fs.writeFileSync(publicOutput, fullZip);

  const sizeKb = (fullZip.length / 1024).toFixed(2);
  console.log(`\n✅ Roku channel package built successfully: ${outputFilename} (${sizeKb} KB)`);
  console.log(`✅ Web download link: /roku-channel.zip`);
}

function walkDir(dir, callback) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    if (item.startsWith('.') || item.endsWith('.pyc') || item.endsWith('.zip')) continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  packageRoku();
}
