<script setup>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { usePlayerStore } from '../store/player'

const store = usePlayerStore()
const scrollRef = ref(null)

const OVERSCAN = 6
const FONT_MIN = 12
const FONT_MAX = 30

const lines = computed(() => store.lyricData.lines)
const total = computed(() => lines.value.length)

const viewportH = ref(0)
const scrollTop = ref(0)
const fontSize = ref(Number(localStorage.getItem('mp-lyric-font')) || 16)

// 行高随字号联动（约 3.5 倍字高，保留舒适行距）
const itemHeight = computed(() => Math.round(fontSize.value * 3.5))

let ro = null
function measure() {
  if (scrollRef.value) viewportH.value = scrollRef.value.clientHeight
}

onMounted(() => {
  measure()
  ro = new ResizeObserver(measure)
  if (scrollRef.value) ro.observe(scrollRef.value)
})
onBeforeUnmount(() => ro?.disconnect())

const activeIndex = computed(() => {
  const t = store.currentTime
  const ls = lines.value
  for (let i = 0; i < ls.length; i++) {
    if (t >= ls[i].time && t < ls[i].end) return i
  }
  return -1
})

// 计算某个字当前的演唱进度（0~100），用于 mask-image 按比例填充
function wordProgress(w) {
  const t = store.currentTime
  if (t >= w.end) return 100
  if (t < w.start) return 0
  const dur = w.end - w.start
  if (dur <= 0) return 100
  return Math.max(0, Math.min(100, ((t - w.start) / dur) * 100))
}

// 上下各留半屏内边距，使首尾行也能居中
const topPad = computed(() => Math.floor(viewportH.value / 2))
const contentHeight = computed(() => topPad.value * 2 + total.value * itemHeight.value)

// 仅渲染可视区内的歌词行（外加少量缓冲）
const startIndex = computed(() => {
  const s = Math.floor((scrollTop.value - topPad.value) / itemHeight.value)
  return Math.max(0, s - OVERSCAN)
})
const endIndex = computed(() => {
  const e = Math.ceil((scrollTop.value + viewportH.value - topPad.value) / itemHeight.value)
  return Math.min(total.value - 1, e + OVERSCAN)
})
const visibleLines = computed(() => {
  const arr = []
  for (let i = startIndex.value; i <= endIndex.value; i++) {
    arr.push({ index: i, line: lines.value[i] })
  }
  return arr
})
const offsetY = computed(() => topPad.value + startIndex.value * itemHeight.value)

function onScroll(e) {
  scrollTop.value = e.target.scrollTop
}

// 让第 idx 行精确居中：行顶坐标 + 半行高 - 半视口
function targetFor(idx) {
  return topPad.value + idx * itemHeight.value - (viewportH.value - itemHeight.value) / 2
}

function scrollToActive(smooth = true) {
  const idx = activeIndex.value
  if (idx < 0 || !scrollRef.value) return
  nextTick(() => {
    const c = scrollRef.value
    const el = c.querySelector('.lyric-line.active')
    let top
    if (el) {
      // 用实际渲染位置对齐视觉中心，避免受缩放/偏移影响
      const cRect = c.getBoundingClientRect()
      const eRect = el.getBoundingClientRect()
      top = c.scrollTop + (eRect.top + eRect.height / 2) - (cRect.top + cRect.height / 2)
    } else {
      top = targetFor(idx)
    }
    c.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })
  })
}

function zoomFont(delta) {
  fontSize.value = Math.min(FONT_MAX, Math.max(FONT_MIN, fontSize.value + delta))
  localStorage.setItem('mp-lyric-font', String(fontSize.value))
  nextTick(() => scrollToActive(true))
}

// 跟随播放进度自动滚动到当前行（居中）
watch(activeIndex, () => scrollToActive(true))

// 切换歌曲时回到顶部
watch(
  () => store.currentTrack?.id,
  () => {
    scrollTop.value = 0
    if (scrollRef.value) scrollRef.value.scrollTop = 0
  }
)
</script>

<template>
  <div class="lyric-panel">
    <div v-if="!lines.length" class="lyric-empty">
      <p class="empty-title">暂无歌词</p>
      <p class="empty-sub">加载音频时可同时选择 .lrc 歌词文件，或为网络音频填写歌词地址</p>
    </div>

    <template v-else>
      <div class="lyric-tools">
        <button class="font-btn" title="减小字号" @click="zoomFont(-1)">A−</button>
        <span class="font-size">{{ fontSize }}</span>
        <button class="font-btn" title="增大字号" @click="zoomFont(1)">A+</button>
      </div>

      <div ref="scrollRef" class="lyric-scroll" @scroll.passive="onScroll">
        <div class="lyric-spacer" :style="{ height: contentHeight + 'px' }">
          <div class="lyric-window" :style="{ transform: `translateY(${offsetY}px)` }">
            <div
              v-for="item in visibleLines"
              :key="item.index"
              class="lyric-line"
              :class="{ active: item.index === activeIndex }"
              :style="{
                height: itemHeight + 'px',
                fontSize: (item.index === activeIndex ? fontSize * 1.25 : fontSize) + 'px'
              }"
            >
              <template v-if="item.index === activeIndex">
                <span
                  v-for="(w, j) in item.line.words"
                  :key="j"
                  class="lyric-word"
                  :class="{
                    played: store.currentTime >= w.end,
                    current: store.currentTime >= w.start && store.currentTime < w.end
                  }"
                >
                  <span class="word-base">{{ w.text }}</span>
                  <span class="word-fill" :style="{ '--p': wordProgress(w) + '%' }">{{ w.text }}</span>
                </span>
              </template>
              <span v-else class="lyric-word plain">{{ item.line.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.lyric-panel {
  position: relative;
  height: 100%;
  overflow: hidden;
}
.lyric-tools {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 6px;
}
.font-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--text-dim);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease, background 0.2s ease;
}
.font-btn:hover {
  color: var(--text);
  background: var(--panel-strong);
}
.font-size {
  font-size: 12px;
  color: var(--text-dim);
  min-width: 22px;
  text-align: center;
}
.lyric-scroll {
  height: 100%;
  overflow-y: auto;
}
.lyric-spacer {
  position: relative;
  width: 100%;
}
.lyric-window {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform;
}
.lyric-line {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  text-align: center;
  line-height: 1.4;
  padding: 0 16px;
  color: var(--text-dim);
  transition: color 0.35s ease, font-size 0.35s ease;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lyric-line.active {
  color: var(--text);
  font-weight: 700;
  transform: scale(1.1);
}
.lyric-word {
  transition: transform 0.2s ease;
  position: relative;
  display: inline-block;
}
.lyric-word.plain {
  display: inline;
}
.word-base {
  color: var(--text-dim);
  white-space: nowrap;
  transition: color 0.2s ease;
}
.lyric-word.current .word-base {
  color: var(--text);
  text-shadow: 0 0 16px rgba(236, 72, 153, 0.35);
}
.word-fill {
  position: absolute;
  inset: 0;
  white-space: nowrap;
  background: var(--gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  -webkit-mask-image: linear-gradient(to right, #000, #000);
  mask-image: linear-gradient(to right, #000, #000);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: var(--p, 0%) 100%;
  mask-size: var(--p, 0%) 100%;
  transition: -webkit-mask-size 0.2s linear, mask-size 0.2s linear;
}
.lyric-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-faint);
}
.empty-title {
  font-size: 18px;
  color: var(--text-dim);
}
.empty-sub {
  font-size: 13px;
  max-width: 320px;
  text-align: center;
  line-height: 1.6;
}
</style>
