<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { usePlayerStore } from './store/player'
import { readLocalText } from './utils/lyric'
import Icon from './components/Icon.vue'
import PlaylistPanel from './components/PlaylistPanel.vue'
import HistoryPanel from './components/HistoryPanel.vue'
import PlayerControls from './components/PlayerControls.vue'
import Spectrum from './components/Spectrum.vue'
import LyricPanel from './components/LyricPanel.vue'
import NetworkModal from './components/NetworkModal.vue'
import logoCD from './assets/CD.svg'


const store = usePlayerStore()
const activeTab = ref('playlist')
const spectrumMode = ref('bar')
const showNetwork = ref(false)
const fileInput = ref(null)
const lyricInput = ref(null)
const toast = ref('')
const isDragging = ref(false)
let dragDepth = 0

const cover = computed(() => store.currentTrack?.cover || '')
const title = computed(() => store.currentTrack?.name || '')
const artist = computed(() => store.currentTrack?.artist || '')

onMounted(() => store.init())

function onLocalFiles(e) {
  const files = Array.from(e.target.files || [])
  if (files.length) store.addLocalFiles(files)
  e.target.value = ''
}

function onImportLyric() {
  if (!store.currentTrack) return
  lyricInput.value?.click()
}

function onLyricFile(e) {
  const file = e.target.files[0]
  if (file && store.currentTrack) {
    readLocalText(file).then((t) => store.setTrackLyric(store.currentTrack.id, t))
  }
  e.target.value = ''
}

function onDragEnter() {
  dragDepth++
  isDragging.value = true
}
function onDragOver(e) {
  e.preventDefault()
}
function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) isDragging.value = false
}
function onDrop(e) {
  e.preventDefault()
  dragDepth = 0
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files || [])
  if (files.length) store.addLocalFiles(files)
}

watch(
  () => store.error,
  (err) => {
    if (err) {
      toast.value = err
      setTimeout(() => {
        toast.value = ''
        store.error = ''
      }, 4000)
    }
  }
)
</script>

<template>
  <div class="app">
    <div class="bg-blobs">
      <span class="b1"></span>
      <span class="b2"></span>
      <span class="b3"></span>
    </div>

    <div class="shell">
      <!-- 顶部栏 -->
      <header class="topbar">
        <div class="brand">
          <div class="brand-logo">
            <img :src="logoCD" alt="logo" />
          </div>
          <span class="brand-name gradient-text">音乐播放器</span>
        </div>

        <div class="topbar-actions">
          <button class="btn" @click="spectrumMode = spectrumMode === 'bar' ? 'ring' : 'bar'">
            <Icon :name="spectrumMode === 'bar' ? 'spectrum-ring' : 'spectrum-bar'" :size="16" />
            <span>{{ spectrumMode === 'bar' ? '环形频谱' : '柱状频谱' }}</span>
          </button>
          <button class="btn" @click="store.toggleTheme()">
            <Icon :name="store.theme === 'dark' ? 'theme-light' : 'theme-dark'" :size="16" />
          </button>
        </div>
      </header>

      <!-- 主体 -->
      <main class="main">
        <!-- 左侧：列表/历史 -->
        <aside
          class="sidebar glass"
          @dragenter.prevent="onDragEnter"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
        >
          <div v-if="isDragging" class="drop-overlay">
            <Icon name="folder" :size="36" />
            <p>松开以导入音乐 / 歌词 / 封面</p>
          </div>

          <div class="sidebar-actions">
            <button class="btn primary-btn" @click="fileInput.click()">
              <Icon name="folder" :size="16" />
              <span>本地音乐</span>
            </button>
            <button class="btn" @click="showNetwork = true">
              <Icon name="link" :size="16" />
              <span>网络音频</span>
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="audio/*,.lrc,image/*"
              multiple
              hidden
              @change="onLocalFiles"
            />
          </div>

          <div class="tabs">
            <button
              class="tab"
              :class="{ active: activeTab === 'playlist' }"
              @click="activeTab = 'playlist'"
            >
              播放列表
            </button>
            <button
              class="tab"
              :class="{ active: activeTab === 'history' }"
              @click="activeTab = 'history'"
            >
              历史记录
            </button>
          </div>

          <div class="tab-body">
            <PlaylistPanel v-if="activeTab === 'playlist'" />
            <HistoryPanel v-else />
          </div>
        </aside>

        <!-- 右侧：封面 + 频谱 + 歌词 -->
        <section class="stage">
          <div class="stage-top glass">
            <div class="disc-wrap">
              <div class="disc" :class="{ spinning: store.isPlaying }">
                <div class="disc-cover">
                  <img v-if="cover" :src="cover" alt="" />
                  <Icon v-else name="music" :size="52" />
                </div>
                <div class="disc-hole"></div>
              </div>
            </div>

            <div class="stage-info">
              <h1 class="song-title">{{ title }}</h1>
              <p class="song-artist">{{ artist }}</p>
              <div v-if="store.currentTrack" class="stage-actions">
                <button class="btn" @click="onImportLyric">
                  <Icon name="lyrics" :size="16" />
                  <span>导入歌词</span>
                </button>
                <input
                  ref="lyricInput"
                  type="file"
                  accept=".lrc"
                  hidden
                  @change="onLyricFile"
                />
              </div>
            </div>
          </div>

          <div class="stage-lyrics glass">
            <div class="lyric-body">
              <LyricPanel />
            </div>
            <div class="spectrum-box">
              <Spectrum :mode="spectrumMode" />
            </div>
          </div>
        </section>
      </main>

      <!-- 底部控制栏 -->
      <footer class="bottombar glass">
        <PlayerControls />
      </footer>
    </div>

    <!-- 提示 -->
    <transition name="toast">
      <div v-if="toast" class="toast glass">{{ toast }}</div>
    </transition>

    <NetworkModal v-if="showNetwork" @close="showNetwork = false" />
  </div>
</template>

<style scoped>
.app {
  position: relative;
  height: 100%;
  overflow: hidden;
}
.shell {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 14px;
  max-width: 1440px;
  margin: 0 auto;
}

/* 顶部栏 */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-logo {
  /* width: 38px;
  height: 38px; */
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-logo >img{
  width: 48px;
}
.brand-name {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 1px;
}
.topbar-actions {
  display: flex;
  gap: 10px;
}

/* 主体 */
.main {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 14px;
  min-height: 0;
}
.sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
.drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #fff;
  background: rgba(124, 58, 237, 0.25);
  border: 2px dashed rgba(236, 72, 153, 0.7);
  border-radius: 20px;
  backdrop-filter: blur(4px);
  pointer-events: none;
}
.drop-overlay p {
  font-size: 14px;
}
.sidebar-actions {
  display: flex;
  gap: 10px;
  padding: 16px 16px 12px;
}
.primary-btn {
  background: var(--gradient);
  color: #fff;
  border: none;
  flex: 1;
}
.primary-btn:hover {
  filter: brightness(1.1);
}
.tabs {
  display: flex;
  gap: 4px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border);
}
.tab {
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 14px;
  padding: 10px 12px;
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
}
.tab.active {
  color: var(--text);
  font-weight: 600;
}
.tab.active::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -1px;
  height: 2px;
  background: var(--gradient);
  border-radius: 2px;
}
.tab-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 右侧舞台 */
.stage {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}
.stage-top {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 24px;
  min-height: 0;
}
.disc-wrap {
  flex-shrink: 0;
}
.disc {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: conic-gradient(#111, #333, #111);
  padding: 12px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
}
.disc.spinning {
  animation: spin 12s linear infinite;
}
.disc-cover {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: var(--panel-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
}
.disc-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.disc-hole {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--bg-1);
  border: 3px solid var(--accent-2);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.stage-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.song-title {
  font-size: 24px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.song-artist {
  color: var(--text-dim);
  margin-top: 4px;
  font-size: 14px;
}
.stage-actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}
.spectrum-box {
  flex-shrink: 0;
  height: 110px;
  margin: 0 16px 16px;
  filter: blur(12px) saturate(160%);
  -webkit-filter: blur(12px) saturate(160%);
  position: absolute;
  z-index: -1;
  bottom: 0;
  width: calc(100% - 32px);
}

.stage-lyrics {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
.lyric-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 底部 */
.bottombar {
  padding: 14px 24px;
}

/* 提示 */
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  padding: 12px 20px;
  font-size: 14px;
  color: #fff;
  background: rgba(30, 20, 40, 0.9);
  border-color: rgba(236, 72, 153, 0.4);
  max-width: 80vw;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-16px);
}

@media (max-width: 860px) {
  .main {
    grid-template-columns: 1fr;
  }
  .sidebar {
    max-height: 220px;
  }
  .stage-top {
    flex-direction: column;
    text-align: center;
  }
  .song-title {
    text-align: center;
  }
}
</style>
