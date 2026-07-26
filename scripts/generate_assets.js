import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

/**
 * Creates a raw valid PNG Buffer for a given width, height, and solid RGB color.
 */
export function createPng(width, height, colorRgb = [102, 45, 145]) {
  const [r, g, b] = colorRgb;
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(2, 9); // color type 2 (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createPngChunk('IHDR', ihdrData);

  // IDAT chunk
  const rowLength = 1 + width * 3;
  const rawData = Buffer.alloc(rowLength * height);
  for (let y = 0; y < height; y++) {
    const offset = y * rowLength;
    rawData[offset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = offset + 1 + x * 3;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createPngChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createPngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcValue = zlib.crc32(crcInput);
  crcBuf.writeUInt32BE(crcValue >>> 0, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

export function generateRokuAssets() {
  const assetsDir = path.join(process.cwd(), 'assets', 'images');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const assets = [
    { name: 'icon_hd.png', width: 290, height: 218 },
    { name: 'icon_fhd.png', width: 540, height: 360 },
    { name: 'splash_hd.png', width: 1280, height: 720 },
    { name: 'splash_fhd.png', width: 1920, height: 1080 },
  ];

  for (const asset of assets) {
    const filePath = path.join(assetsDir, asset.name);
    if (!fs.existsSync(filePath)) {
      const pngBuf = createPng(asset.width, asset.height, [102, 45, 145]);
      fs.writeFileSync(filePath, pngBuf);
      console.log(`🎨 Generated Roku asset: assets/images/${asset.name} (${asset.width}x${asset.height})`);
    }
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  generateRokuAssets();
}
