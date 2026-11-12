# Plan: Windows & Linux Executable Releases

This plan describes how to package Inkfra as native desktop executables for Windows and Linux while reusing the existing web stack.

## Current implementation

Inkfra currently ships Node SEA executables. `npm run package:sea` builds the web app, injects the SEA blob into a copy of Node, and copies `dist/` next to the binary.

- `Release Desktop` (`.github/workflows/release-desktop.yml`) runs on `v*` tags, builds Windows and Linux bundles, and attaches `inkfra-windows.zip` and `inkfra-linux.zip` to the GitHub Release. Tags containing `-alpha` are published as prereleases.
- `Desktop Build (Node SEA)` (`.github/workflows/desktop.yml`) is a manual workflow for verification. It uploads the same zipped bundles as workflow artifacts.

Each archive contains the executable and the `dist/` directory. Keep them together; the executable serves `dist/` from its own directory.

The Changesets release workflow creates the version tag. GitHub does not trigger workflows from tag pushes made with the repository `GITHUB_TOKEN`. To publish desktop assets automatically, create a fine-grained personal access token with **Contents: Read and write** and **Pull requests: Read and write**, and store it as the `RELEASE_TOKEN` repository secret. The release workflow uses it when present and falls back to `GITHUB_TOKEN` otherwise.

## Option A — Tauri (recommended)

**Why:** Small bundle size, native webview, Rust backend, built-in updater, cross-platform installers.

### Prerequisites

- Rust toolchain (`rustup`)
- Tauri CLI (`cargo install tauri-cli` or `npm i -D @tauri-apps/cli`)
- Platform build tools:
  - Windows: Visual Studio Build Tools (MSVC), WebView2
  - Linux: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`

### Steps

1. Initialize Tauri in the project:
   ```bash
   npm i -D @tauri-apps/cli
   npx tauri init
   ```
2. Configure `src-tauri/tauri.conf.json`:
   - `build.devUrl`: `http://localhost:5173`
   - `build.frontendDist`: `../dist`
   - Window title, dimensions, and icon.
3. Add Rust commands for file system access (save ZIP, open file dialogs).
4. Replace browser-only download with Tauri dialog + fs APIs.
5. Build:
   ```bash
   npx tauri build
   ```
   Outputs:
   - Windows: `.exe` and `.msi`
   - Linux: `.AppImage`, `.deb`, `.rpm`

### CI matrix

- Use `tauri-apps/tauri-action` on `windows-latest` and `ubuntu-latest`.
- Sign Windows binaries with a code-signing certificate.
- Publish artifacts to GitHub Releases.

## Option B — Electron

**Why:** Mature ecosystem, Node APIs available, easier for teams already using Node.

### Steps

1. Install Electron and builder:
   ```bash
   npm i -D electron electron-builder
   ```
2. Create `electron/main.ts` that creates a `BrowserWindow` and loads `dist/index.html`.
3. Add `electron-builder` config to `package.json` for Windows (`nsis`) and Linux (`AppImage`, `deb`).
4. Build:
   ```bash
   npx electron-builder --win --linux
   ```

### Trade-offs

- Larger bundle size (~100MB+).
- Higher memory usage.

## Option C — Node single executable (SEA)

**Why:** No native toolchain beyond Node; smallest conceptual change.

### Steps

1. Create `scripts/serve.mjs` that serves `dist/` on a local port and opens the default browser.
2. Use Node 24 Single Executable Application (SEA) support:
   ```bash
   node --experimental-sea-config sea-config.json
   ```
3. Inject the blob into a copy of the Node binary using `postject`.
4. Package per platform:
   - Windows: `node.exe` → `inkfra.exe`
   - Linux: `node` → `inkfra`

### Trade-offs

- Requires shipping a Node binary (~50MB).
- Less native feel than Tauri/Electron.

## Recommended path

1. **Short term:** Implement Option C to provide immediate executables without new toolchains.
2. **Long term:** Migrate to Option A (Tauri) for smaller, native installers and auto-updates.

## Deliverables

- `src-tauri/` or `electron/` directory with configuration.
- `scripts/serve.mjs` for SEA packaging.
- CI matrix producing Windows and Linux artifacts.
- Code signing setup documentation.
- Auto-update configuration (Tauri updater or electron-updater).

## Acceptance criteria

- Double-clicking the Windows executable launches Inkfra.
- The Linux executable runs on Ubuntu 22.04+ without additional dependencies (AppImage).
- Installers are published to GitHub Releases.
- File save dialogs work natively (no browser download fallback).
