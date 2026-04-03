import '@testing-library/jest-dom'

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
