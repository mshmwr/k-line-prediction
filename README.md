# K-Line-Prediction

## Runtime

This project now expects Node 20 for the frontend toolchain.

- Recommended: Node `20.x`
- Minimum for the current Vitest stack: Node `18+`
- Verified frontend commands: `npm run build`

## Quick Start

### 後端（FastAPI）

```bash
cd backend
python3 -m uvicorn main:app --reload --port 8000
```

後端啟動後在 `http://localhost:8000`。

### 前端（React/Vite）

```bash
cd frontend
npm install
npm run dev
```

前端啟動後在 `http://localhost:5173`。

> 前後端需同時執行，請開兩個終端視窗分別啟動。

### 執行測試

```bash
cd frontend
npm install
npm run build
npm test -- --run
```

## Node Version Notes

The frontend uses `vitest ^1.6.0`, which pulls in dependencies that require a modern Node runtime. On Node 16, test startup fails before any tests are collected.

If you use a version manager, switch to Node 20 before running frontend commands:

```bash
nvm use
```

If your machine does not have `nvm`, install or activate Node 20 first, then rerun the commands above.
