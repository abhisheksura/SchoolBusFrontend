# 🚍 School Bus Tracker — Frontend Setup Guide

> Step-by-step guide to get the frontend development environment running from scratch.

---

## 📋 Prerequisites

Before starting, make sure you have:

- A Unix-based terminal (macOS / Linux / WSL on Windows)
- `curl` installed
- The backend (FastAPI) running locally at `http://localhost:8000`
- Git installed

---

## 🧰 Step 1 — Install NVM (Node Version Manager)

> **Skip this step if you already have NVM installed.**

NVM lets you manage multiple Node.js versions cleanly — no system-level conflicts.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

After installation, restart your terminal or run:

```bash
source ~/.bashrc    # Linux
source ~/.zshrc     # macOS (zsh)
```

Verify NVM is installed:

```bash
nvm --version
```

---

## 🟢 Step 2 — Install Node.js (LTS)

Install the current Active LTS version of Node.js.
As of **March 2026**, that is **Node.js v22.x** (LTS support until ~2027).

```bash
nvm install --lts
```

Verify:

```bash
node --version   # v22.x.x
npm --version    # 10.x.x
```

---

## ⚡ Step 3 — Scaffold the Project

Create a new Vite + React + TypeScript project:

```bash
npm create vite@latest SchoolBusFrontend -- --template react-ts
cd SchoolBusFrontend
npm install
```

If SchoolBusFrontend is already present

```bash
cd SchoolBusFrontend
npm create vite@latest . -- --template react-ts
npm install
```

Run the dev server to verify the scaffold works:

```bash
npm run dev
```

You should see the default Vite + React page at `http://localhost:5173`.

---
