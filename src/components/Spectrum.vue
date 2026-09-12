<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { audioEngine } from '../audio/engine'

const props = defineProps({
  mode: { type: String, default: 'bar' } // bar | ring
})

const canvasRef = ref(null)
let rafId = null
let freqData = new Uint8Array(128)
let resizeObserver = null

// 与 style.css 中渐变一致的三个主题色
const COLORS = [
  [124, 58, 237], // #7c3aed
  [236, 72, 153], // #ec4899
  [6, 182, 212] // #06b6d4
]

// 频谱灵敏度：幂次放大弱信号并叠加增益，值越大越灵敏
const SENSITIVITY = 1.8
function boost(v) {
  return Math.min(1, Math.pow(v, 0.7) * SENSITIVITY)
}

function sampleColor(t) {
  // t in [0,1) 在三个颜色间循环插值
  const seg = t * 3
  const i = Math.floor(seg)
  const f = seg - i
  const a = COLORS[i % 3]
  const b = COLORS[(i + 1) % 3]
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
}

function resize() {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
}

function drawBar(ctx, w, h) {
  const bars = 64
  const gap = 3
  const bw = (w - gap * (bars - 1)) / bars
  audioEngine.getFrequencyData(freqData)

  const grad = ctx.createLinearGradient(0, h, 0, 0)
  grad.addColorStop(0, '#06b6d4')
  grad.addColorStop(0.5, '#ec4899')
  grad.addColorStop(1, '#7c3aed')
  ctx.fillStyle = grad

  for (let i = 0; i < bars; i++) {
    const idx = Math.floor((i / bars) * freqData.length)
    const v = boost(freqData[idx] / 255)
    const bh = Math.max(3, v * (h - 10))
    const x = i * (bw + gap)
    const y = h - bh
    ctx.globalAlpha = 0.35 + v * 0.65
    ctx.beginPath()
    ctx.roundRect(x, y, bw, bh, 4)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawRing(ctx, w, h) {
  const bars = 72
  const cx = w / 2
  const cy = h / 2
  const maxRadius = Math.min(w, h) / 2 - 8
  const inner = maxRadius * 0.45
  audioEngine.getFrequencyData(freqData)

  ctx.lineCap = 'round'
  for (let i = 0; i < bars; i++) {
    const idx = Math.floor((i / bars) * freqData.length)
    const v = boost(freqData[idx] / 255)
    const angle = (i / bars) * Math.PI * 2 - Math.PI / 2
    const len = v * (maxRadius - inner)
    const [r, g, b] = sampleColor(i / bars)
    ctx.strokeStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${0.35 + v * 0.65})`
    ctx.lineWidth = 3
    ctx.beginPath()
    const x1 = cx + Math.cos(angle) * inner
    const y1 = cy + Math.sin(angle) * inner
    const x2 = cx + Math.cos(angle) * (inner + len)
    const y2 = cy + Math.sin(angle) * (inner + len)
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
}

function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.scale(dpr, dpr)
  const w = canvas.width / dpr
  const h = canvas.height / dpr
  if (props.mode === 'ring') drawRing(ctx, w, h)
  else drawBar(ctx, w, h)
  ctx.restore()
  rafId = requestAnimationFrame(render)
}

onMounted(() => {
  resize()
  resizeObserver = new ResizeObserver(() => resize())
  resizeObserver.observe(canvasRef.value)
  render()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  if (resizeObserver) resizeObserver.disconnect()
})

watch(
  () => props.mode,
  () => resize()
)
</script>

<template>
  <canvas ref="canvasRef" class="spectrum-canvas" />
</template>

<style scoped>
.spectrum-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
