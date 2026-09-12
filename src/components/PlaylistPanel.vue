<script setup>
import { usePlayerStore } from '../store/player'
import { formatTime, readLocalText } from '../utils/lyric'
import Icon from './Icon.vue'

const store = usePlayerStore()

function playItem(i) {
  store.playTrack(i)
}

function onLyricFile(e, id) {
  const file = e.target.files[0]
  if (file) readLocalText(file).then((t) => store.setTrackLyric(id, t))
  e.target.value = ''
}

function onCoverFile(e, id) {
  const file = e.target.files[0]
  if (file) store.setTrackCover(id, URL.createObjectURL(file))
  e.target.value = ''
}
</script>

<template>
  <div class="playlist-panel">
    <div class="playlist-header">
      <span class="title">播放列表</span>
      <span class="count">{{ store.playlist.length }} 首</span>
      <button v-if="store.playlist.length" class="clear-btn" @click="store.clearList()">
        清空
      </button>
    </div>

    <div class="playlist-body">
      <div v-if="!store.playlist.length" class="empty">
        <Icon name="music" :size="40" />
        <p>还没有音乐，添加一些吧</p>
      </div>

      <div
        v-for="(t, i) in store.playlist"
        :key="t.id"
        class="track"
        :class="{ active: i === store.currentIndex }"
        @click="playItem(i)"
      >
        <div class="track-cover">
          <img v-if="t.cover" :src="t.cover" alt="" />
          <Icon v-else name="music" :size="18" />
          <div v-if="i === store.currentIndex && store.isPlaying" class="playing-dot">
            <span v-for="n in 3" :key="n" />
          </div>
        </div>

        <div class="track-info">
          <div class="track-name">{{ t.name }}</div>
          <div class="track-meta">
            <span v-if="t.artist">{{ t.artist }}</span>
            <span v-else class="dim">{{ t.type === 'local' ? '本地' : '网络' }}</span>
            <span v-if="t.duration">· {{ formatTime(t.duration) }}</span>
          </div>
        </div>

        <div class="track-actions" @click.stop>
          <label class="mini-btn" title="添加歌词">
            <Icon name="lyrics" :size="15" />
            <input type="file" accept=".lrc" hidden @change="onLyricFile($event, t.id)" />
          </label>
          <label class="mini-btn" title="添加封面">
            <Icon name="image" :size="15" />
            <input type="file" accept="image/*" hidden @change="onCoverFile($event, t.id)" />
          </label>
          <button class="mini-btn" title="移除" @click="store.removeTrack(t.id)">
            <Icon name="trash" :size="15" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playlist-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.playlist-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--border);
}
.title {
  font-size: 16px;
  font-weight: 700;
}
.count {
  font-size: 12px;
  color: var(--text-dim);
}
.clear-btn {
  margin-left: auto;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 12px;
  cursor: pointer;
}
.clear-btn:hover {
  color: var(--text);
}
.playlist-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}
.empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-faint);
  font-size: 14px;
}
.track {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.track:hover {
  background: var(--panel-strong);
}
.track.active {
  background: var(--panel-strong);
}
.track-cover {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--panel-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  color: var(--text-dim);
}
.track-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.playing-dot {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}
.playing-dot span {
  width: 3px;
  height: 14px;
  background: #fff;
  border-radius: 2px;
  animation: bounce 0.8s ease-in-out infinite;
}
.playing-dot span:nth-child(2) {
  animation-delay: 0.15s;
}
.playing-dot span:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes bounce {
  0%,
  100% {
    height: 6px;
  }
  50% {
    height: 16px;
  }
}
.track-info {
  flex: 1;
  min-width: 0;
}
.track-name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.track.active .track-name {
  background: var(--gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
.track-meta {
  font-size: 12px;
  color: var(--text-dim);
  margin-top: 2px;
}
.dim {
  color: var(--text-faint);
}
.track-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.track:hover .track-actions {
  opacity: 1;
}
.mini-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
}
.mini-btn:hover {
  background: var(--panel-strong);
  color: var(--text);
}
</style>
