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

    roku_ip = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("ROKU_HOST", os.environ.get("ROKU_IP", "10.0.0.171"))
    roku_pass = sys.argv[2] if len(sys.argv) > 2 else os.environ.get("ROKU_PASSWORD", os.environ.get("ROKU_DEV_PASSWORD", "sobeoapp"))
    
    clean_ip = roku_ip.replace("http://", "").replace("https://", "").strip("/")
    username = "rokudev"
    
    deploy_dir = os.path.join(os.getcwd(), "deploy")
    os.makedirs(deploy_dir, exist_ok=True)
    zip_file = os.path.join(deploy_dir, "roku-channel.zip")

    # Ensure ZIP exists
    if not os.path.exists(zip_file):
        print("📦 deploy/roku-channel.zip não encontrado. Gerando pacote primeiro...")
        pkg_script = os.path.join("scripts", "package-roku.py")
        if os.path.exists(pkg_script):
            subprocess.run([sys.executable, pkg_script], check=True)
        else:
            subprocess.run(["node", "scripts/package-roku.js"], check=True)

    print(f"\n🚀 [Python] Enviando {zip_file} para Roku TV em http://{clean_ip} (Usuário: {username})...")

    # Method 1: Try curl if available
    curl_installed = False
    try:
        subprocess.run(["curl", "--version"], capture_output=True, check=True)
        curl_installed = True
    except Exception:
        curl_installed = False

    if curl_installed:
        curl_cmd = [
            "curl", "-s", "-S",
            "--digest", "-u", f"{username}:{roku_pass}",
            "-F", "mysubmit=Install",
            "-F", f"archive=@{zip_file}",
            f"http://{clean_ip}/plugin_install"
        ]
        try:
            result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=15)
            if "Identical binary already exists" in result.stdout or "Install Success" in result.stdout or "Plugin install success" in result.stdout:
                print(f"🎉 SUCESSO! Canal instalado e executado na Roku TV ({clean_ip})!")
                return
            elif "Unauthorized" in result.stdout or "401" in result.stdout:
                print("❌ Falha de autenticação. Verifique a senha do Modo Desenvolvedor da Roku TV.")
                return
            else:
                print("Resposta da Roku TV:")
                print(result.stdout[:500])
                return
        except Exception as e:
            print(f"⚠️ Erro no curl: {e}. Tentando método via Python urllib...")

    # Method 2: Python native urllib with HTTP Digest Auth
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

        pass_mgr = urllib.request.HTTPPasswordMgrWithDefaultRealm()
        pass_mgr.add_password(None, url, username, roku_pass)
        auth_handler = urllib.request.HTTPDigestAuthHandler(pass_mgr)
        opener = urllib.request.build_opener(auth_handler)

        req = urllib.request.Request(url, data=payload, method="POST")
        req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

        with opener.open(req, timeout=15) as response:
            html = response.read().decode("utf-8", errors="ignore")
            if "Identical binary already exists" in html or "Install Success" in html or "Plugin install success" in html:
                print(f"🎉 SUCESSO! Canal instalado e executado na Roku TV ({clean_ip})!")
            else:
                print("Resposta da Roku TV:")
                print(html[:500])
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print("❌ Falha de autenticação (401). Verifique a senha do Desenvolvedor da Roku TV.")
        else:
            print(f"❌ Erro HTTP {e.code}: {e.reason}")
    except Exception as e:
        print(f"\n❌ Erro de conexão com a Roku TV em {clean_ip}: {e}")
        print("💡 Verifique se a Roku TV está ligada na mesma rede local e se o IP/Senha estão corretos.")

if __name__ == "__main__":
    deploy_to_roku()
