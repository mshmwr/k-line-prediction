import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock ResizeObserver for recharts ResponsiveContainer
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const canvasContextStub = {
  save() {},
  restore() {},
  scale() {},
  setTransform() {},
  resetTransform() {},
  translate() {},
  beginPath() {},
  closePath() {},
  moveTo() {},
  lineTo() {},
  arc() {},
  arcTo() {},
  fill() {},
  stroke() {},
  fillRect() {},
  clearRect() {},
  setLineDash() {},
  fillText() {},
  strokeText() {},
  measureText() {
    return {
      width: 0,
      actualBoundingBoxAscent: 0,
      actualBoundingBoxDescent: 0,
    }
  },
  createLinearGradient() {
    return {
      addColorStop() {},
    }
  },
  get canvas() {
    return document.createElement('canvas')
  },
} as unknown as CanvasRenderingContext2D

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => canvasContextStub,
})

globalThis.fetch = vi.fn(async () => ({
  ok: true,
  json: async () => ({
    '1H': { filename: 'Binance_ETHUSDT_1h.csv', latest: '2026-04-01 00:00', bar_count: 1000 },
    '1D': { filename: 'Binance_ETHUSDT_d.csv', latest: '2026-04-01', bar_count: 100 },
  }),
})) as unknown as typeof fetch
