#!/usr/bin/env python3
import os
import sys
import zlib
import zipfile

scripts_dir = os.path.dirname(os.path.abspath(__file__))
if scripts_dir not in sys.path:
    sys.path.insert(0, scripts_dir)

from generate_assets import generate_roku_assets

def package_roku():
    output_filename = "roku-channel.zip"
    public_output = os.path.join("public", "roku-channel.zip")
    
    # 1. Ensure required assets exist
    generate_roku_assets()

    # Fixed timestamp for deterministic, clean ZIP headers (2026-01-01 00:00:00)
    zip_date_time = (2026, 1, 1, 0, 0, 0)

    entries_to_include = [
        "manifest",
        "source",
        "components",
        "screens",
        "services",
        "tasks",
        "models",
        "utils",
        "feeds",
        "assets"
    ]

    print("📦 Packaging Roku SceneGraph Channel into roku-channel.zip (Roku OS strict compatibility mode)...")

    # Collect directories and files
    dirs_to_add = set()
    files_to_add = [] # list of (filepath, arcname)

    # Force manifest to be the very first file
    if os.path.isfile("manifest"):
        files_to_add.append(("manifest", "manifest"))

    for entry in entries_to_include:
        if entry == "manifest" or not os.path.exists(entry):
            continue
            
        if os.path.isfile(entry):
            arcname = entry.replace('\\', '/').lstrip('/')
            files_to_add.append((entry, arcname))
        elif os.path.isdir(entry):
            for root, dirs, files in os.walk(entry):
                rel_dir = os.path.relpath(root, ".").replace('\\', '/').lstrip('/')
                if rel_dir and rel_dir != ".":
                    dirs_to_add.add(rel_dir if rel_dir.endswith('/') else rel_dir + '/')
                    
                for file in files:
                    if file.startswith('.') or file.endswith('.pyc') or file.endswith('.zip'):
                        continue
                    filepath = os.path.join(root, file)
                    arcname = os.path.relpath(filepath, ".").replace('\\', '/').lstrip('/')
                    
                    parent_dir = os.path.dirname(arcname).replace('\\', '/').lstrip('/')
                    if parent_dir:
                        dirs_to_add.add(parent_dir if parent_dir.endswith('/') else parent_dir + '/')
                        
                    files_to_add.append((filepath, arcname))

    sorted_dirs = sorted(list(dirs_to_add))

    # Create ZIP archive with strict Roku OS minizip compatibility:
    # - No UTF-8 flag (flag_bits = 0)
    # - No Zip64
    # - Explicit Unix external_attr permissions
    # - Clean extra fields (extra = b'')
    with zipfile.ZipFile(output_filename, 'w', compression=zipfile.ZIP_DEFLATED, allowZip64=False) as zipf:
        # Add Directory Entries
        for dir_path in sorted_dirs:
            zinfo = zipfile.ZipInfo(dir_path, zip_date_time)
            zinfo.create_system = 3 # Unix
            zinfo.external_attr = 0o40755 << 16 # directory mode
            zinfo.compress_type = zipfile.ZIP_STORED
            zinfo.flag_bits = 0
            zinfo.extra = b''
            zipf.writestr(zinfo, b'')
            print(f"  + Added dir:  {dir_path}")

        # Add File Entries
        for filepath, arcname in files_to_add:
            with open(filepath, 'rb') as f:
                content = f.read()
                
            zinfo = zipfile.ZipInfo(arcname, zip_date_time)
            zinfo.create_system = 3 # Unix
            zinfo.external_attr = 0o100644 << 16 # regular file mode
            zinfo.compress_type = zipfile.ZIP_DEFLATED
            zinfo.flag_bits = 0
            zinfo.extra = b''
            zinfo.file_size = len(content)
            zinfo.CRC = zlib.crc32(content) & 0xffffffff
            
            zipf.writestr(zinfo, content)
            print(f"  + Added file: {arcname}")

    # Mirror package to public/ for browser downloads
    os.makedirs("public", exist_ok=True)
    with open(output_filename, 'rb') as src, open(public_output, 'wb') as dst:
        dst.write(src.read())

    size_kb = os.path.getsize(output_filename) / 1024
    print(f"\n✅ Roku channel package built successfully: {output_filename} ({size_kb:.2f} KB)")
    print(f"✅ Web download link: /roku-channel.zip")

if __name__ == "__main__":
    package_roku()
