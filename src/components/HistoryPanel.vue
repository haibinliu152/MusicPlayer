<script setup>
import { usePlayerStore } from '../store/player'
import { formatTime } from '../utils/lyric'
import Icon from './Icon.vue'

const store = usePlayerStore()

function fmtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return sameDay ? hm : `${d.getMonth() + 1}/${d.getDate()} ${hm}`
}
</script>

<template>
  <div class="history-panel">
    <div class="history-header">
      <span class="title">历史记录</span>
      <button v-if="store.history.length" class="clear-btn" @click="store.clearHistory()">
        清空
      </button>
    </div>

    <div class="history-body">
      <div v-if="!store.history.length" class="empty">
        <Icon name="clock" :size="40" />
        <p>暂无播放记录</p>
      </div>

      <div v-for="h in store.history" :key="h.lastPlayedAt + h.name" class="item">
        <div class="item-cover">
          <img v-if="h.cover" :src="h.cover" alt="" />
          <Icon v-else name="music" :size="16" />
        </div>
        <div class="item-info">
          <div class="item-name">{{ h.name }}</div>
          <div class="item-meta">
            <span>{{ h.type === 'network' ? '网络' : '本地' }}</span>
            <span v-if="h.duration">· {{ formatTime(h.duration) }}</span>
            <span>· {{ fmtTime(h.lastPlayedAt) }}</span>
          </div>
        </div>
        <button class="play-btn" title="播放" @click="store.playFromHistory(h)">
          <Icon name="play" :size="15" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.history-header {
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
.history-body {
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
.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 14px;
  transition: background 0.2s ease;
}
.item:hover {
  background: var(--panel-strong);
}
.item-cover {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--panel-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-dim);
}
.item-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.item-info {
  flex: 1;
  min-width: 0;
}
.item-name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-meta {
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 2px;
}
.play-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: var(--panel-strong);
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.play-btn:hover {
  background: var(--gradient);
}
</style>
