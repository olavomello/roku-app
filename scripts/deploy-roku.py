#!/usr/bin/env python3
import sys
import os
import subprocess

def deploy_to_roku():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/deploy-roku.py <ROKU_IP> [ROKU_PASSWORD]")
        print("Example: python3 scripts/deploy-roku.py 192.168.1.50 secretpass")
        sys.exit(1)

    roku_ip = sys.argv[1]
    roku_pass = sys.argv[2] if len(sys.argv) > 2 else ""

    zip_file = "roku-channel.zip"
    if not os.path.exists(zip_file):
        print("📦 roku-channel.zip not found. Building package first...")
        subprocess.run(["python3", "scripts/package-roku.py"], check=True)

    print(f"\n🚀 Deploying {zip_file} to Roku TV at http://{roku_ip}...")

    curl_cmd = [
        "curl", "-s", "-S",
        "--digest", "-u", f"rokudev:{roku_pass}",
        "-F", "mysubmit=Install",
        "-F", f"archive=@{zip_file}",
        f"http://{roku_ip}/plugin_install"
    ]

    try:
        result = subprocess.run(curl_cmd, capture_output=True, text=True)
        if "Identical binary already exists" in result.stdout or "Install Success" in result.stdout or "Plugin install success" in result.stdout:
            print(f"🎉 SUCCESS! Channel deployed and launched on Roku TV ({roku_ip})!")
        else:
            print("Response from Roku device:")
            print(result.stdout)
            if "Unauthorized" in result.stdout or "401" in result.stdout:
                print("❌ Authentication failed. Please check your Roku Developer password.")
    except Exception as e:
        print(f"❌ Deploy error: {e}")

if __name__ == "__main__":
    deploy_to_roku()
