import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

/**
 * Creates a valid PNG Buffer with a custom styled Roku channel icon/splash art.
 */
export function createRokuAssetPng(width, height, isIcon = true) {
  const rowLength = 1 + width * 3;
  const rawData = Buffer.alloc(rowLength * height);

  // Roku Purple Theme Colors matching the Web App UI (#120d1c, #662D91, #a341e8, #1e172e)
  const bgR = 18, bgG = 13, bgB = 28; // #120D1C (Deep Dark Purple Canvas)
  const innerBgR = 30, innerBgG = 23, innerBgB = 46; // #1E172E (Card Fill)
  const purpleR = 102, purpleG = 45, purpleB = 145; // #662D91 (Roku Purple)
  const highlightR = 163, highlightG = 65, highlightB = 232; // #A341E8 (Bright Purple Accent)
  const whiteR = 255, whiteG = 255, whiteB = 255;
  const goldR = 245, goldG = 158, goldB = 11; // #F59E0B (Accent Gold)

  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const playSize = Math.floor(Math.min(width, height) * 0.22);
  const circleRadius = Math.floor(Math.min(width, height) * 0.34);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter 0

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;

      // Subtle vertical radial gradient from deep purple center to darker edges
      const distFromCenter = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
      const maxDist = Math.sqrt(cx * cx + cy * cy);
      const gradientFactor = Math.max(0, 1 - distFromCenter / maxDist);

      let r = Math.floor(bgR + gradientFactor * 15);
      let g = Math.floor(bgG + gradientFactor * 10);
      let b = Math.floor(bgB + gradientFactor * 25);

      // Top and bottom accent border bars (Bright Roku Purple)
      const barHeight = Math.max(4, Math.floor(height * 0.035));
      if (y < barHeight || y > height - barHeight) {
        r = highlightR; g = highlightG; b = highlightB;
      } else {
        const dx = x - cx;
        const dy = y - cy;
        const distSq = dx * dx + dy * dy;

        // Draw Outer Glowing Circle Emblem
        if (distSq <= circleRadius * circleRadius) {
          const ringThickness = Math.max(5, Math.floor(circleRadius * 0.14));
          if (distSq >= (circleRadius - ringThickness) * (circleRadius - ringThickness)) {
            // Gradient ring from highlight purple to gold accent
            r = highlightR; g = highlightG; b = highlightB;
          } else {
            r = innerBgR; g = innerBgG; b = innerBgB;
          }
        }

        // Draw Play Triangle (pointing right)
        const xMin = cx - Math.floor(playSize * 0.45);
        const xMax = cx + Math.floor(playSize * 0.75);
        if (x >= xMin && x <= xMax) {
          const halfH = Math.floor(((xMax - x) / (xMax - xMin)) * playSize);
          if (y >= cy - halfH && y <= cy + halfH) {
            r = whiteR; g = whiteG; b = whiteB;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(2, 9); // color type 2 (RGB)
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  const ihdrChunk = createPngChunk('IHDR', ihdrData);

  // IDAT chunk
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
    { name: 'icon_hd.png', width: 290, height: 218, isIcon: true },
    { name: 'icon_fhd.png', width: 540, height: 405, isIcon: true }, // Correct FHD 4:3 size
    { name: 'splash_hd.png', width: 1280, height: 720, isIcon: false },
    { name: 'splash_fhd.png', width: 1920, height: 1080, isIcon: false },
  ];

  for (const asset of assets) {
    const filePath = path.join(assetsDir, asset.name);
    const pngBuf = createRokuAssetPng(asset.width, asset.height, asset.isIcon);
    fs.writeFileSync(filePath, pngBuf);
    console.log(`🎨 Generated Roku asset: assets/images/${asset.name} (${asset.width}x${asset.height})`);
  }
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  generateRokuAssets();
}
