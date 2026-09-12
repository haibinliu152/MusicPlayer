<script setup>
import { computed, ref } from 'vue'
import { usePlayerStore } from '../store/player'
import { formatTime } from '../utils/lyric'
import Icon from './Icon.vue'

const store = usePlayerStore()
const progressRef = ref(null)
const dragging = ref(false)

const progressPercent = computed(() =>
  store.duration ? (store.currentTime / store.duration) * 100 : 0
)

const volumeIcon = computed(() => {
  if (store.volume <= 0.001) return 'volume-mute'
  if (store.volume < 0.5) return 'volume-low'
  return 'volume'
})

const modeIcon = computed(() => {
  if (store.playMode === 'shuffle') return 'shuffle'
  if (store.playMode === 'loop') return 'loop'
  return 'sequence'
})

const modeTitle = computed(() => {
  if (store.playMode === 'shuffle') return '随机播放'
  if (store.playMode === 'loop') return '单曲循环'
  return '顺序播放'
})

function seekFromEvent(e) {
  const rect = progressRef.value.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  store.seek(ratio * store.duration)
}

function onDown(e) {
  dragging.value = true
  seekFromEvent(e)
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
function onMove(e) {
  if (dragging.value) seekFromEvent(e)
}
function onUp() {
  dragging.value = false
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', onUp)
}

function onVolume(e) {
  store.setVolume(Number(e.target.value))
}
// 鼠标滚轮调整音量
function wheelVolume(e) {
  let val = Math.round((store.volume + Number.EPSILON) * 100) / 100;
  if (e.deltaY === 0) return;
  else if (e.deltaY < 0) {
    if (val >= 1) return;
    store.setVolume(store.volume += 0.01)
  } else {
    // 减少
    if (val <= 0) return;
    store.setVolume(store.volume -= 0.01)
  }
}
</script>

<template>
  <div class="controls">
    <div class="progress-wrap" ref="progressRef" @mousedown="onDown">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }" />
        <div class="progress-thumb" :style="{ left: progressPercent + '%' }" />
      </div>
      <div class="time-row">
        <span>{{ formatTime(store.currentTime) }}</span>
        <span>{{ formatTime(store.duration) }}</span>
      </div>
    </div>

    <div class="controls-row">
      <div class="left">
        <button class="icon-btn mode-btn" :title="modeTitle" @click="store.cyclePlayMode()">
          <Icon :name="modeIcon" :size="19" />
        </button>
      </div>

      <div class="center">
        <button class="icon-btn" title="上一首" @click="store.playPrev()">
          <Icon name="prev" :size="22" />
        </button>
        <button class="play-btn" title="播放/暂停" @click="store.togglePlay()">
          <Icon :name="store.isPlaying ? 'pause' : 'play'" :size="26" />
        </button>
        <button class="icon-btn" title="下一首" @click="store.playNext()">
          <Icon name="next" :size="22" />
        </button>
        <button class="icon-btn" title="停止" @click="store.stop()">
          <Icon name="stop" :size="20" />
        </button>
      </div>

      <div class="right">
        <button class="icon-btn" title="静音" @click="store.setVolume(store.volume > 0 ? 0 : 0.75)">
          <Icon :name="volumeIcon" :size="20" />
        </button>
        <input id="volume-slider" class="volume-slider" type="range" min="0" @wheel.prevent="wheelVolume" max="1"
          step="0.01" :value="store.volume" @input="onVolume" />
        <label for="volume-slider">{{  (Math.abs(store.volume) * 100).toFixed(0) }}%</label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-wrap {
  cursor: pointer;
  padding: 4px 0;
}

.progress-track {
  position: relative;
  height: 6px;
  background: var(--panel-strong);
  border-radius: 3px;
  overflow: visible;
}

.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--gradient);
  border-radius: 3px;
  transition: width 0.1s linear;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 10px rgba(236, 72, 153, 0.8);
  pointer-events: none;
}

.time-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left,
.right {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.right {
  justify-content: flex-end;
}

.center {
  display: flex;
  align-items: center;
  gap: 10px;
}

.play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: none;
  background: var(--gradient);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(236, 72, 153, 0.4);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.play-btn:hover {
  transform: scale(1.06);
  box-shadow: 0 10px 30px rgba(236, 72, 153, 0.55);
}

.play-btn svg {
  width: 26px;
  height: 26px;
}

.mode-btn {
  color: var(--text-dim);
}

.volume-slider {
  width: 90px;
  accent-color: var(--accent-2);
  cursor: pointer;
}
</style>
