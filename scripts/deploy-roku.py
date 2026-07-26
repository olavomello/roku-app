#!/usr/bin/env python3
import sys
import os
import subprocess
import urllib.request
import urllib.parse
import http.cookiejar

def load_env():
    env_path = os.path.join(os.getcwd(), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip()
                    if key not in os.environ:
                        os.environ[key] = val

def deploy_to_roku():
    load_env()

    is_debug = any(arg in ["--debug", "-d"] for arg in sys.argv) or \
               os.environ.get("DEBUG") == "true" or \
               os.environ.get("ROKU_DEBUG") == "true"

    positional_args = [arg for arg in sys.argv[1:] if not arg.startswith("-")]
    roku_ip = positional_args[0] if len(positional_args) > 0 else os.environ.get("ROKU_HOST", os.environ.get("ROKU_IP", "10.0.0.171"))
    roku_pass = positional_args[1] if len(positional_args) > 1 else os.environ.get("ROKU_PASSWORD", os.environ.get("ROKU_DEV_PASSWORD", "sobeoapp"))

    clean_ip = roku_ip.replace("http://", "").replace("https://", "").strip("/")
    username = "rokudev"

    deploy_dir = os.path.join(os.getcwd(), "deploy")
    os.makedirs(deploy_dir, exist_ok=True)
    zip_file = os.path.join(deploy_dir, "roku-channel.zip")

    if is_debug:
        print("[DEBUG] Mode: DEBUG enabled")
        print(f"[DEBUG] Python Executable: {sys.executable}")
        print(f"[DEBUG] Python Version: {sys.version.split()[0]}")
        print(f"[DEBUG] Working Dir: {os.getcwd()}")
        print(f"[DEBUG] Target IP: {clean_ip}")
        print(f"[DEBUG] Target User: {username}")
        print(f"[DEBUG] Password length: {len(roku_pass)} chars")
        print(f"[DEBUG] ROKU_HOST env: {os.environ.get('ROKU_HOST', '(not set)')}")
        print(f"[DEBUG] ROKU_PASSWORD env: {'***' if os.environ.get('ROKU_PASSWORD') else '(not set)'}")

    # Ensure ZIP exists — auto-build if missing
    if not os.path.exists(zip_file):
        print("deploy/roku-channel.zip not found. Building package first...")
        pkg_script = os.path.join("scripts", "package-roku.py")
        if os.path.exists(pkg_script):
            if is_debug:
                print(f"[DEBUG] Running packager: {sys.executable} {pkg_script}")
            subprocess.run([sys.executable, pkg_script], check=True)
        else:
            if is_debug:
                print("[DEBUG] Running packager: node scripts/package-roku.js")
            subprocess.run(["node", "scripts/package-roku.js"], check=True)

    if is_debug and os.path.exists(zip_file):
        zip_size = os.path.getsize(zip_file)
        print(f"[DEBUG] Package ZIP size: {zip_size} bytes ({zip_size/1024:.2f} KB)")

    print(f"\n🚀 [Python] Sending {zip_file} to Roku TV at http://{clean_ip} (User: {username})...")

    # Method 1: curl (handles HTTP Digest Auth automatically via --digest flag)
    # NOTE: curl will issue two requests — a 401 challenge/response handshake is NORMAL for Digest auth.
    # The script only checks the FINAL response body for success/failure keywords,
    # not the intermediate 401 challenge that appears in verbose stderr output.
    curl_installed = False
    try:
        subprocess.run(["curl", "--version"], capture_output=True, check=True)
        curl_installed = True
        if is_debug:
            print("[DEBUG] curl binary detected on system path.")
    except Exception as e:
        curl_installed = False
        if is_debug:
            print(f"[DEBUG] curl not available ({e}). Falling back to urllib.")

    if curl_installed:
        # -s = silent output, --digest = auto Digest auth, write result to stdout only
        curl_cmd = [
            "curl", "-s", "-S",
            "--digest", "-u", f"{username}:{roku_pass}",
            "-F", "mysubmit=Install",
            "-F", f"archive=@{zip_file}",
            f"http://{clean_ip}/plugin_install"
        ]

        if is_debug:
            # -v adds verbose output to stderr (includes the expected 401 Digest challenge)
            curl_cmd = [
                "curl", "-v", "-S",
                "--digest", "-u", f"{username}:{roku_pass}",
                "-F", "mysubmit=Install",
                "-F", f"archive=@{zip_file}",
                f"http://{clean_ip}/plugin_install"
            ]
            print(f"[DEBUG] curl command: curl -v --digest -u {username}:*** -F mysubmit=Install -F archive=@{zip_file} http://{clean_ip}/plugin_install")
            print("[DEBUG] Note: a 401 in curl stderr is the normal Digest auth challenge, not an error.")

        try:
            result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=30)

            if is_debug:
                print(f"[DEBUG] curl exit code: {result.returncode}")
                if result.stderr:
                    print(f"[DEBUG] curl stderr (Digest auth handshake visible here):\n{result.stderr}")
                if result.stdout:
                    print(f"[DEBUG] curl stdout (Roku response):\n{result.stdout[:1000]}")

            # Check only stdout (Roku's HTML response) — NOT stderr (which always contains the 401 challenge)
            stdout = result.stdout or ""
            if "Install Success" in stdout or "Plugin install success" in stdout or "Identical binary" in stdout:
                print(f"🎉 SUCCESS! Channel installed and launched on Roku TV ({clean_ip})!")
                return
            elif "Compilation Failed" in stdout:
                print(f"❌ Install failed: BrightScript compilation error.")
                # Extract the error message from Roku's HTML response
                import re
                match = re.search(r'Install Failure: ([^\<]+)', stdout)
                if match:
                    print(f"   Roku error: {match.group(1).strip()}")
                print("   Check the BRS files for syntax errors and re-run: npm run transpile && npm run package:roku")
                return
            elif result.returncode != 0:
                print(f"❌ curl failed (exit code {result.returncode}). Check network connectivity to {clean_ip}.")
                return
            else:
                # Unknown response — print it for inspection
                print("Roku TV response:")
                print(stdout[:600] if stdout else "(empty response — check network)")
                return

        except Exception as e:
            print(f"⚠️ curl error: {e}. Trying urllib fallback...")
            if is_debug:
                import traceback
                traceback.print_exc()

    # Method 2: Python native urllib with HTTP Digest Auth
    if is_debug:
        print("[DEBUG] Initiating urllib Digest Auth upload...")

    try:
        url = f"http://{clean_ip}/plugin_install"

        with open(zip_file, "rb") as f:
            zip_bytes = f.read()

        boundary = "----RokuFormBoundary" + os.urandom(8).hex()

        body = []
        body.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"mysubmit\"\r\n\r\nInstall\r\n".encode("utf-8"))
        body.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"archive\"; filename=\"roku-channel.zip\"\r\nContent-Type: application/zip\r\n\r\n".encode("utf-8"))
        body.append(zip_bytes)
        body.append(f"\r\n--{boundary}--\r\n".encode("utf-8"))

        payload = b"".join(body)

        if is_debug:
            print(f"[DEBUG] Target URL: {url}")
            print(f"[DEBUG] Payload size: {len(payload)} bytes")

        pass_mgr = urllib.request.HTTPPasswordMgrWithDefaultRealm()
        pass_mgr.add_password(None, url, username, roku_pass)
        auth_handler = urllib.request.HTTPDigestAuthHandler(pass_mgr)

        handlers = [auth_handler]
        if is_debug:
            handlers.append(urllib.request.HTTPHandler(debuglevel=1))

        opener = urllib.request.build_opener(*handlers)

        req = urllib.request.Request(url, data=payload, method="POST")
        req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

        with opener.open(req, timeout=30) as response:
            html = response.read().decode("utf-8", errors="ignore")
            if is_debug:
                print(f"[DEBUG] HTTP Status: {response.status}")
                print(f"[DEBUG] Response length: {len(html)} bytes")
                print(f"[DEBUG] Response snippet:\n{html[:800]}")

            if "Install Success" in html or "Plugin install success" in html or "Identical binary" in html:
                print(f"🎉 SUCCESS! Channel installed and launched on Roku TV ({clean_ip})!")
            elif "Compilation Failed" in html:
                print(f"❌ Install failed: BrightScript compilation error.")
                import re
                match = re.search(r'Install Failure: ([^\<]+)', html)
                if match:
                    print(f"   Roku error: {match.group(1).strip()}")
            else:
                print("Roku TV response:")
                print(html[:500])

    except urllib.error.HTTPError as e:
        if e.code == 401:
            print(f"❌ Authentication failed (401). Check the Developer Mode password for the Roku TV.")
            print(f"   Current password used: '{roku_pass}'")
        else:
            print(f"❌ HTTP error {e.code}: {e.reason}")
        if is_debug:
            body_text = e.read().decode("utf-8", errors="ignore")
            print(f"[DEBUG] Error response body:\n{body_text[:500]}")
    except Exception as e:
        print(f"\n❌ Connection error to Roku TV at {clean_ip}: {e}")
        if is_debug:
            import traceback
            traceback.print_exc()
        print("Check that the Roku TV is powered on, on the same local network, and that the IP/password are correct.")

if __name__ == "__main__":
    deploy_to_roku()
