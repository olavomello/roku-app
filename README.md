# 📺 Roku TV App — SceneGraph & Interactive Web Player

[![Roku SceneGraph](https://img.shields.io/badge/Roku-SceneGraph_OS-662D91?style=for-the-badge&logo=roku&logoColor=white)](https://developer.roku.com/)
[![BrightScript](https://img.shields.io/badge/Language-BrightScript-blue?style=for-the-badge)](https://developer.roku.com/docs/references/brightscript/language/brightscript-language-reference.md)
[![TypeScript](https://img.shields.io/badge/Simulator-TypeScript_%2B_React-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite_6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![CI / Quality Gates](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/olavomello/roku-app/actions)

Production-grade **Roku TV App** built with **Roku SceneGraph (BrightScript + XML)** following official Roku Developer Guidelines and Content Feed Specifications. Includes a high-fidelity **interactive Web Simulator** with on-screen D-pad remote control, feed inspector, unit test suite, and continuous quality gates.

---

## Live app

Check this out: [📺 Live app](https://roku-app.vercel.app)

---

## 🚀 Key Features & Highlights

- 🎬 **SceneGraph Native Codebase**: Complete native BrightScript/XML files ready for Roku packaging (`source/`, `components/`, `screens/`, `tasks/`, `services/`, `models/`, `utils/`).
- 📺 **Interactive Web Simulator**: Full-featured React 18 & Tailwind TV web simulator mimicking Roku OS focus navigation and SceneGraph nodes.
- 🎛️ **Roku Remote Control HUD**: On-screen remote control supporting D-pad arrows, `OK/Select`, `Back`, `Home`, `Option (*)`, `Play/Pause`, `Rewind`, and `Fast Forward` plus physical keyboard shortcuts.
- 📰 **Multi-Format Feed Engine**: Supports custom MVP feeds, root array JSONs, and the official **Roku Content Feed** schema (`movie`, `shortFormVideos`, `tvSpecial`).
- 🛡️ **Auto-Retry & Stream Mirrors**: Robust video error detection with automatic fallback mirror switching.
- 🧪 **Comprehensive Test Suite**: Unit, component, and end-to-end integration tests powered by Vitest and React Testing Library.
- ⚙️ **GitHub Actions CI Pipeline**: Automated linter, test runner, and build quality gates on `main` and `develop` branches.
- 📋 **System Solution Design (SSD)**: Standardized specification workflow (`specs/ROADMAP.md`).

---

## 📂 Project Architecture & File Tree

```
roku-app/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI Quality Gate pipeline
├── components/                    # Native Roku SceneGraph Components
│   ├── MainScene.xml              # Main Roku Scene Orchestrator
│   └── MainScene.brs              # Navigation & Screen Lifecycle Logic
├── screens/                       # Native Roku SceneGraph Screens
│   ├── HomeScene.xml              # Catalog Poster Grid XML Layout
│   ├── HomeScene.brs              # Poster Grid Focus & Item Selection
│   ├── PlayerScene.xml            # Native Video Player Node XML
│   └── PlayerScene.brs            # Video Playback Controls & Event Handling
├── services/                      # Business & Data Services
│   ├── FeedService.brs            # HTTP Download & Cache Controller
│   └── FeedParser.brs             # JSON to VideoModel & ContentNode Converter
├── tasks/                         # Asynchronous Background Task Nodes
│   ├── LoadFeedTask.xml           # Async HTTP Task Declaration
│   └── LoadFeedTask.brs           # Asynchronous Worker Script
├── models/                        # Data Representations
│   └── VideoModel.brs             # Video Item ContentNode Data Structure
├── utils/                         # Utilities & Helpers
│   ├── Logger.brs                 # Centralized Logger (DEBUG, INFO, WARN, ERROR)
│   ├── Config.brs                 # Global Channel Configurations
│   └── Constants.brs              # Static Key Codes & Event Strings
├── feeds/                         # Sample Local Feeds
│   └── sample-feed.json           # Default Local Feed Data
├── source/                        # Roku Application Main Entry Points
│   ├── main.brs                   # Roku Channel Entry Point
│   └── App.brs                    # Application Bootstrap Script
├── specs/                         # System Solution Design Specifications
│   └── ROADMAP.md                 # System Solution Design Roadmap & Specs
├── src/                           # High-Fidelity Web Simulator (React + TypeScript)
│   ├── components/                # Simulator UI Components (HomeScene, PlayerScene, Remote)
│   ├── services/                # Simulator Feed Loaders & Parsers
│   ├── test/                      # Unit & E2E Test Suite (Vitest)
│   ├── types.ts                   # Shared TypeScript Interfaces
│   └── App.tsx                    # Simulator Root Controller
├── manifest                       # Roku Channel Manifest File
├── package.json                   # Web Simulator Dependencies & Scripts
├── README.md                      # Project Documentation
└── AGENTS.md                      # System Solution Design (SSD) Specification
```

---

## 🛠️ Installation & Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- _(Optional)_ **Roku Device**: For side-loading onto physical hardware

### 1. Clone the Repository

```bash
git clone https://github.com/olavomello/roku-app.git
cd roku-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Web Simulator

```bash
npm run dev
```

Open your browser at `http://localhost:3000` to interact with the Roku TV application.

---

## 🧪 Testing & Quality Assurance

Run the automated Vitest unit and integration test suite:

```bash
# Run unit and E2E tests
npm run test

# Run linter / TypeScript type checker
npm run lint

# Run web simulator production build verification
npm run build
```

---

## 🎮 Interactive Remote Control Shortcuts

When using the Web Simulator, you can use your physical keyboard to simulate Roku TV remote button presses:

| Key                    | Roku Remote Button | Description                         |
| :--------------------- | :----------------- | :---------------------------------- |
| `▲` / `Up Arrow`       | **DPad Up**        | Move focus up                       |
| `▼` / `Down Arrow`     | **DPad Down**      | Move focus down                     |
| `◄` / `Left Arrow`     | **DPad Left**      | Move focus left                     |
| `►` / `Right Arrow`    | **DPad Right**     | Move focus right                    |
| `Enter` / `Space`      | **OK / Select**    | Select item / Play video / Pause    |
| `Escape` / `Backspace` | **Back**           | Return to previous screen / Catalog |
| `*` / `Shift`          | **Option (\*)**    | Open Feed Inspector modal           |

---

### Configuração de Ambiente (`.env`)

Crie ou edite o arquivo `.env` na raiz do projeto para configurar as credenciais da sua Roku TV:

```env
# IP address or hostname of the Roku device to run the device tests against
ROKU_HOST=0.0.0.0

# Developer password for that device (set when you enabled developer mode)
ROKU_PASSWORD=
```

---

## 🚀 Como Fazer o Deploy do App na Roku TV (Passo a Passo)

Você pode realizar o empacotamento e o deploy na sua Roku TV de **três formas**: usando **Node.js (Recomendado - Oficial via `roku-deploy`)**, **Python**, ou **Sideloading Manual pelo Navegador**. Todos os arquivos empacotados e artefatos de deploy são gerados automaticamente na pasta **`/deploy`** na raiz do projeto (`deploy/roku-channel.zip`).

### 1. Habilitar o Modo Desenvolvedor na Roku TV

Antes de qualquer deploy, ative o Modo Desenvolvedor na sua Roku TV:

1. No controle remoto da Roku TV, pressione a sequência exata de botões:
    - **Home** (5 vezes)
    - **Seta para Cima / Up** (3 vezes)
    - **Seta para Direita / Right** (1 vez)
    - **Seta para Esquerda / Left** (1 vez)
    - **Seta para Direita / Right** (1 vez)
    - **Seta para Esquerda / Left** (1 vez)
    - **Seta para Direita / Right** (1 vez)
2. Anote o **IP da Roku TV** exibido na tela (exemplo: `10.0.0.171`).
3. Escolha **Enable developer settings and restart**.
4. Aceite os termos e defina uma **senha do desenvolvedor** (exemplo: `yourpass`). A TV irá reiniciar.

---

### Opção A: Deploy via Node.js (`deploy-node` - Recomendado via `roku-deploy`)

Utiliza a biblioteca oficial da comunidade Roku (`roku-deploy`) para empacotar os arquivos na pasta `deploy/` e realizar o upload HTTP Digest diretamente para a TV.

```bash
# Executar deploy usando configurações do .env:
npm run deploy-node

# Ou passar IP e Senha diretamente como argumentos:
npm run deploy-node 0.0.0.0 yourpass

# Ativar depurador de deploy (gera logs detalhados de cada etapa):
npm run deploy-node -- --debug

# Apenas empacotar e gerar deploy/roku-channel.zip:
npm run package-node
```

---

### Opção B: Deploy via Python (`deploy-py`)

Permite o envio via script Python (compatível com Windows, macOS e Linux sem depender de utilitários externos):

```bash
# Executar deploy via Python usando .env:
npm run deploy-py

# Ou passar IP e Senha como argumentos:
npm run deploy-py 0.0.0.0 yourpass

# Ativar depurador de deploy via Python (logs de cabeçalhos HTTP, auth e retornos):
npm run deploy-py -- --debug

# Apenas empacotar via Python (gera deploy/roku-channel.zip):
npm run package-py
```

---

### Opção C: Sideloading Manual pelo Navegador Web

1. Gere o arquivo de pacote executando `npm run package-node` (o arquivo `roku-channel.zip` será gerado na pasta `deploy/`).
2. Abra o seu navegador e acesse o IP da Roku TV: `http://0.0.0.0`
3. Faça login com usuário `rokudev` e a senha definida no Modo Desenvolvedor (`yourpass`).
4. Na tela do **Roku Development Application Installer**, selecione o arquivo `deploy/roku-channel.zip` e clique no botão **Install**.

---

## 📋 Feature Roadmap & Implementation Status

For detailed feature proposals, technical contracts, and status tracking, see [`specs/ROADMAP.md`](./specs/ROADMAP.md).

- 🟢 `SPEC-001`: SceneGraph Core Architecture & Central Navigation
- 🟢 `SPEC-002`: HomeScene Video Catalog & Spotlight HUD
- 🟢 `SPEC-003`: PlayerScene Native Video Player with Fallback Mirrors
- 🟢 `SPEC-004`: FeedService & Multi-Format FeedParser
- 🟢 `SPEC-005`: Roku Remote Control Simulator & Key Handlers
- 🟢 `SPEC-006`: Automated Test Suite & GitHub Actions CI Quality Gates
- 🟡 `SPEC-007`: Remote Feed HTTP Fetching, Retry & Cache Management
- 🟡 `SPEC-008`: Continue Watching Row & Favorites Persistence
- 🟡 `SPEC-009`: In-App Search & Dynamic Category Filtering
- 🟡 `SPEC-010`: Roku Deep Linking & Certification Compliance

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
