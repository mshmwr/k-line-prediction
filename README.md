# K-Line-Prediction

## Runtime

This project now expects Node 20 for the frontend toolchain.

- Recommended: Node `20.x`
- Minimum for the current Vitest stack: Node `18+`
- Verified frontend commands: `npm run build`

## Quick Start

From the project root:

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
