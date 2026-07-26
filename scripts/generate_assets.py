#!/usr/bin/env python3
import os
import zlib
import struct

def create_png(width, height, color_rgb=(102, 45, 145)):
    """Creates a raw valid PNG byte stream for a given width, height, and solid RGB color."""
    r, g, b = color_rgb
    # PNG signature
    png_sig = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk: width (4 bytes), height (4 bytes), bit depth 8, color type 2 (RGB), compression 0, filter 0, interlace 0
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    ihdr_chunk = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # IDAT chunk (image data)
    # Each row starts with filter byte 0x00, followed by RGB bytes for each pixel
    row_bytes = b'\x00' + bytes([r, g, b] * width)
    raw_data = row_bytes * height
    compressed_data = zlib.compress(raw_data)
    idat_crc = zlib.crc32(b'IDAT' + compressed_data)
    idat_chunk = struct.pack('>I', len(compressed_data)) + b'IDAT' + compressed_data + struct.pack('>I', idat_crc)
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND')
    iend_chunk = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    return png_sig + ihdr_chunk + idat_chunk + iend_chunk

def generate_roku_assets():
    os.makedirs("assets/images", exist_ok=True)
    
    # Roku standard required icon & splash resolutions:
    # HD Icon: 290x218
    # FHD Icon: 540x360
    # Splash FHD: 1920x1080
    assets = [
        ("assets/images/icon_hd.png", 290, 218),
        ("assets/images/icon_fhd.png", 540, 360),
        ("assets/images/splash_fhd.png", 1920, 1080)
    ]
    
    for filepath, w, h in assets:
        if not os.path.exists(filepath):
            png_bytes = create_png(w, h, color_rgb=(102, 45, 145))
            with open(filepath, "wb") as f:
                f.write(png_bytes)
            print(f"🎨 Generated Roku asset: {filepath} ({w}x{h})")

if __name__ == "__main__":
    generate_roku_assets()
