# Roku TV App — System Solution Design (SSD) Roadmap & Specs

This document tracks all completed and planned specifications for the **Roku TV App (SceneGraph)** following standard SSD format.

> **Governance Rule**: All new feature proposals must enter as `Status: Draft`. Features are only moved to implementation or production after explicit approval (`Status: Approved`).

---

## 📋 Status Legend

- 🟢 **Approved - Production**: Implemented, tested, and released in production (`main`).
- 🟡 **Draft**: Proposed specification under review. Waiting for user approval before development.
- 🔴 **Rejected**: Proposed feature that was reviewed and declined.

---

## 🟢 Approved & Implemented Specifications (MVP / Production)

### SPEC-001: SceneGraph Core Architecture & Central Navigation
- **ID**: `SPEC-001`
- **Status**: 🟢 `Approved - Production`
- **Module**: `source/`, `components/`, `src/components/MainScene.tsx`
- **Objective**: Establish SceneGraph layered architecture with `MainScene` as the central orchestrator for screen switching and remote control event dispatching.
- **Key Deliverables**:
  - `MainScene.xml` / `MainScene.brs` (Roku Native) and React Web Simulator.
  - Centralized navigation flow (`HomeScene` ↔ `PlayerScene`).
  - Screen stack lifecycle handling.

---

### SPEC-002: HomeScene Video Catalog & Spotlight HUD
- **ID**: `SPEC-002`
- **Status**: 🟢 `Approved - Production`
- **Module**: `screens/HomeScene.*`, `src/components/HomeScene.tsx`
- **Objective**: Display video content poster grid with focal navigation and a high-contrast detail spotlight HUD for the currently focused video.
- **Key Deliverables**:
  - D-pad focus navigation with border highlights.
  - Category filter pills header.
  - Metadata spotlight displaying duration, rating, creator, and synopsis.
  - Smooth auto-scroll behavior for focused items.

---

### SPEC-003: PlayerScene Native Video Player with Fallback Mirrors
- **ID**: `SPEC-003`
- **Status**: 🟢 `Approved - Production`
- **Module**: `screens/PlayerScene.*`, `src/components/PlayerScene.tsx`
- **Objective**: Implement video stream playback using native controls, state events (Play, Pause, Fast Forward, Rewind, Seek, Back), and auto-failover to backup mirrors on stream error.
- **Key Deliverables**:
  - Fullscreen video player with custom Roku overlay controls.
  - Playback progress tracking and resume points.
  - Automated mirror stream retry on network/codec error.

---

### SPEC-004: FeedService & Multi-Format FeedParser
- **ID**: `SPEC-004`
- **Status**: 🟢 `Approved - Production`
- **Module**: `services/FeedService.*`, `services/FeedParser.*`
- **Objective**: Provide decoupled feed loading and format normalization for local JSON and official Roku Content Feed schemas.
- **Key Deliverables**:
  - Support for custom MVP JSON (`{ "videos": [...] }`), array JSON, and official Roku Content Feed schemas (`movie`, `shortFormVideos`, `tvSpecial`).
  - Fallback poster and stream assignment for incomplete nodes.

---

### SPEC-005: Roku Remote Control Simulator & Key Handlers
- **ID**: `SPEC-005`
- **Status**: 🟢 `Approved - Production`
- **Module**: `src/components/RokuRemote.tsx`, `src/components/MainScene.tsx`
- **Objective**: Provide an interactive on-screen Roku remote control with visual feedback and physical keyboard mapping (`ArrowKeys`, `Enter`, `Backspace`, `Space`, `Escape`).
- **Key Deliverables**:
  - On-screen remote control panel.
  - Global key listener mapping to Roku OS button codes (`Up`, `Down`, `Left`, `Right`, `Select`, `Back`, `Play`, `Option`).

---

### SPEC-006: Automated Test Suite & GitHub Actions CI Quality Gates
- **ID**: `SPEC-006`
- **Status**: 🟢 `Approved - Production`
- **Module**: `src/test/`, `.github/workflows/ci.yml`
- **Objective**: Integrate Unit and E2E testing framework (Vitest + Testing Library) with automated GitHub Actions CI pipeline.
- **Key Deliverables**:
  - Unit tests for `FeedParser` and `FeedService`.
  - Component unit tests for `HomeScene` and `PlayerScene`.
  - E2E flow test verifying app lifecycle and screen transitions.
  - Automated CI workflow executing linter, unit/E2E tests, and production build checks.

---

## 🟡 Draft Specifications (Awaiting Approval)

### SPEC-007: Remote Feed HTTP Fetching, Retry & Cache Management
- **ID**: `SPEC-007`
- **Status**: 🟢 `Approved - Production`
- **Sprint Target**: Sprint 2
- **Module**: `tasks/LoadFeedTask.xml`, `services/FeedService.brs`
- **Objective**: Implement asynchronous `roUrlTransfer` task nodes for remote JSON feeds with retry backoff and local cache headers (`if-modified-since`).
- **Architecture**:
  ```
  [MainScene] -> [LoadFeedTask (Async Thread)] -> [roUrlTransfer] -> [Local Cache] -> [FeedParser]
  ```
- **Acceptance Criteria**:
  1. Downloads remote JSON feeds in background thread without blocking UI thread.
  2. Implements 3-tier exponential backoff retry logic.
  3. Falls back gracefully to `sample-feed.json` if network is unreachable.

---

### SPEC-008: Continue Watching Row & Favorites Persistence
- **ID**: `SPEC-008`
- **Status**: 🟡 `Draft`
- **Sprint Target**: Sprint 4
- **Module**: `models/VideoModel.brs`, `utils/StorageHelper.brs`
- **Objective**: Store playback progress locally in `roRegistry` / LocalStorage and render a dedicated "Continue Watching" carousel row on `HomeScene`.
- **Acceptance Criteria**:
  1. Saves current playback position every 5 seconds during video playback.
  2. Displays progress percentage bar on posters.
  3. Allows user to resume video from last saved timestamp or start over.

---

### SPEC-009: In-App Search & Dynamic Category Filtering
- **ID**: `SPEC-009`
- **Status**: 🟡 `Draft`
- **Sprint Target**: Sprint 5
- **Module**: `screens/SearchScene.xml`, `components/KeyboardGrid.xml`
- **Objective**: Provide an on-screen keyboard component for live title, genre, and creator search with instant grid filtering.
- **Acceptance Criteria**:
  1. Roku-compliant 6x6 alphanumeric keyboard grid.
  2. Real-time query filtering as user types.
  3. Displays empty state message with "Clear Search" button when no matches exist.

---

### SPEC-010: Roku Deep Linking & Certification Compliance
- **ID**: `SPEC-010`
- **Status**: 🟡 `Draft`
- **Sprint Target**: Sprint 5
- **Module**: `source/main.brs`, `manifest`
- **Objective**: Support Roku Channel Store deep linking parameters (`contentId`, `mediaType`) to launch directly into specified video player content from Roku OS home search.
- **Acceptance Criteria**:
  1. Parses `args.contentId` and `args.mediaType` in `main.brs`.
  2. Launches directly into `PlayerScene` when valid deep link arguments are passed.
  3. Passes all Roku automated channel certification checks.
