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
        print("[DEBUG 🛠️] Mode: DEBUG enabled")
        print(f"[DEBUG 🛠️] Python Executable: {sys.executable}")
        print(f"[DEBUG 🛠️] Python Version: {sys.version.split()[0]}")
        print(f"[DEBUG 🛠️] Working Dir: {os.getcwd()}")
        print(f"[DEBUG 🛠️] Target IP: {clean_ip}")
        print(f"[DEBUG 🛠️] Target User: {username}")
        print(f"[DEBUG 🛠️] Password length: {len(roku_pass)} chars")
        print(f"[DEBUG 🛠️] ROKU_HOST env: {os.environ.get('ROKU_HOST', '(not set)')}")
        print(f"[DEBUG 🛠️] ROKU_PASSWORD env: {'***' if os.environ.get('ROKU_PASSWORD') else '(not set)'}")

    # Ensure ZIP exists
    if not os.path.exists(zip_file):
        print("📦 deploy/roku-channel.zip não encontrado. Gerando pacote primeiro...")
        pkg_script = os.path.join("scripts", "package-roku.py")
        if os.path.exists(pkg_script):
            if is_debug:
                print(f"[DEBUG 🛠️] Running packager: {sys.executable} {pkg_script}")
            subprocess.run([sys.executable, pkg_script], check=True)
        else:
            if is_debug:
                print("[DEBUG 🛠️] Running packager: node scripts/package-roku.js")
            subprocess.run(["node", "scripts/package-roku.js"], check=True)

    if is_debug and os.path.exists(zip_file):
        zip_size = os.path.getsize(zip_file)
        print(f"[DEBUG 🛠️] Package ZIP size: {zip_size} bytes ({zip_size/1024:.2f} KB)")

    print(f"\n🚀 [Python] Enviando {zip_file} para Roku TV em http://{clean_ip} (Usuário: {username})...")

    # Method 1: Try curl if available
    curl_installed = False
    try:
        subprocess.run(["curl", "--version"], capture_output=True, check=True)
        curl_installed = True
        if is_debug:
            print("[DEBUG 🛠️] curl binary detected on system path.")
    except Exception as e:
        curl_installed = False
        if is_debug:
            print(f"[DEBUG 🛠️] curl not available ({e}). Will fallback to urllib.")

    if curl_installed:
        curl_cmd = [
            "curl", "-s", "-S",
            "--digest", "-u", f"{username}:{roku_pass}",
            "-F", "mysubmit=Install",
            "-F", f"archive=@{zip_file}",
            f"http://{clean_ip}/plugin_install"
        ]

        if is_debug:
            curl_cmd_debug = [
                "curl", "-v", "-S",
                "--digest", "-u", f"{username}:{roku_pass}",
                "-F", "mysubmit=Install",
                "-F", f"archive=@{zip_file}",
                f"http://{clean_ip}/plugin_install"
            ]
            print(f"[DEBUG 🛠️] Executing curl command: curl -v --digest -u {username}:*** -F mysubmit=Install -F archive=@{zip_file} http://{clean_ip}/plugin_install")

        try:
            cmd_to_run = curl_cmd_debug if is_debug else curl_cmd
            result = subprocess.run(cmd_to_run, capture_output=True, text=True, timeout=20)
            
            if is_debug:
                print(f"[DEBUG 🛠️] curl return code: {result.returncode}")
                if result.stderr:
                    print(f"[DEBUG 🛠️] curl stderr:\n{result.stderr}")
                if result.stdout:
                    print(f"[DEBUG 🛠️] curl stdout:\n{result.stdout[:1000]}")

            if "Identical binary already exists" in result.stdout or "Install Success" in result.stdout or "Plugin install success" in result.stdout:
                print(f"🎉 SUCESSO! Canal instalado e executado na Roku TV ({clean_ip})!")
                return
            elif "Unauthorized" in result.stdout or "401" in result.stdout or "Unauthorized" in result.stderr or "401" in result.stderr:
                print("❌ Falha de autenticação (401). Verifique a senha do Modo Desenvolvedor da Roku TV.")
                return
            else:
                print("Resposta da Roku TV:")
                print(result.stdout[:500] if result.stdout else result.stderr[:500])
                return
        except Exception as e:
            print(f"⚠️ Erro no curl: {e}. Tentando método via Python urllib...")
            if is_debug:
                import traceback
                traceback.print_exc()

    # Method 2: Python native urllib with HTTP Digest Auth
    if is_debug:
        print("[DEBUG 🛠️] Initiating urllib Digest Auth upload...")

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
            print(f"[DEBUG 🛠️] Target URL: {url}")
            print(f"[DEBUG 🛠️] Payload size: {len(payload)} bytes")
            print(f"[DEBUG 🛠️] Form boundary: {boundary}")

        pass_mgr = urllib.request.HTTPPasswordMgrWithDefaultRealm()
        pass_mgr.add_password(None, url, username, roku_pass)
        auth_handler = urllib.request.HTTPDigestAuthHandler(pass_mgr)
        
        handlers = [auth_handler]
        if is_debug:
            handlers.append(urllib.request.HTTPHandler(debuglevel=1))

        opener = urllib.request.build_opener(*handlers)

        req = urllib.request.Request(url, data=payload, method="POST")
        req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

        with opener.open(req, timeout=20) as response:
            html = response.read().decode("utf-8", errors="ignore")
            if is_debug:
                print(f"[DEBUG 🛠️] HTTP Status Code: {response.status}")
                print(f"[DEBUG 🛠️] Response Length: {len(html)} bytes")
                print(f"[DEBUG 🛠️] Response Snippet:\n{html[:800]}")

            if "Identical binary already exists" in html or "Install Success" in html or "Plugin install success" in html:
                print(f"🎉 SUCESSO! Canal instalado e executado na Roku TV ({clean_ip})!")
            else:
                print("Resposta da Roku TV:")
                print(html[:500])
    except urllib.error.HTTPError as e:
        print(f"❌ Erro HTTP {e.code}: {e.reason}")
        if is_debug:
            body = e.read().decode("utf-8", errors="ignore")
            print(f"[DEBUG 🛠️] Error response body:\n{body[:500]}")
        if e.code == 401:
            print("💡 Verifique a senha do Desenvolvedor da Roku TV.")
    except Exception as e:
        print(f"\n❌ Erro de conexão com a Roku TV em {clean_ip}: {e}")
        if is_debug:
            import traceback
            traceback.print_exc()
        print("💡 Verifique se a Roku TV está ligada na mesma rede local e se o IP/Senha estão corretos.")

if __name__ == "__main__":
    deploy_to_roku()
