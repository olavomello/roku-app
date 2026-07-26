#!/usr/bin/env python3
import os
import zipfile
import sys

def package_roku():
    output_filename = "roku-channel.zip"
    public_output = os.path.join("public", "roku-channel.zip")
    
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
    
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for entry in entries_to_include:
            if os.path.isfile(entry):
                zipf.write(entry, entry)
                print(f"  + Added file: {entry}")
            elif os.path.isdir(entry):
                for root, dirs, files in os.walk(entry):
                    for file in files:
                        filepath = os.path.join(root, file)
                        arcname = os.path.relpath(filepath, ".")
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
