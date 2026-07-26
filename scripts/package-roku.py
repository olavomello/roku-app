#!/usr/bin/env python3
import os
import zipfile
import sys

# Add scripts directory to sys.path
scripts_dir = os.path.dirname(os.path.abspath(__file__))
if scripts_dir not in sys.path:
    sys.path.insert(0, scripts_dir)

from generate_assets import generate_roku_assets

def package_roku():
    output_filename = "roku-channel.zip"
    public_output = os.path.join("public", "roku-channel.zip")
    
    # Generate missing icon/splash assets if needed
    generate_roku_assets()

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

    print("📦 Packaging Roku SceneGraph Channel into roku-channel.zip...")
    
    # Roku OS strict unzip compatibility: allowZip64=False to prevent ZIP64 headers
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED, allowZip64=False) as zipf:
        for entry in entries_to_include:
            if not os.path.exists(entry):
                continue
            if os.path.isfile(entry):
                arcname = entry.replace('\\', '/')
                zipf.write(entry, arcname)
                print(f"  + Added file: {arcname}")
            elif os.path.isdir(entry):
                for root, dirs, files in os.walk(entry):
                    for file in files:
                        if file.startswith('.') or file.endswith('.pyc'):
                            continue
                        filepath = os.path.join(root, file)
                        arcname = os.path.relpath(filepath, ".").replace('\\', '/')
                        zipf.write(filepath, arcname)
                        print(f"  + Added file: {arcname}")

    # Copy to public folder so it can be downloaded via web browser / simulator
    os.makedirs("public", exist_ok=True)
    with open(output_filename, 'rb') as src, open(public_output, 'wb') as dst:
        dst.write(src.read())

    size_kb = os.path.getsize(output_filename) / 1024
    print(f"\n✅ Package created successfully: {output_filename} ({size_kb:.2f} KB)")
    print(f"✅ Web download available at: /roku-channel.zip")

if __name__ == "__main__":
    package_roku()
