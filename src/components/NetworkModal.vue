<script setup>
import { reactive, ref } from 'vue'
import { usePlayerStore } from '../store/player'
import Icon from './Icon.vue'

const emit = defineEmits(['close'])
const store = usePlayerStore()

const form = reactive({
  url: '',
  name: '',
  artist: '',
  coverUrl: '',
  lyricUrl: ''
})
const loading = ref(false)

async function submit() {
  if (!form.url.trim()) return
  loading.value = true
  try {
    await store.addNetworkTrack({ ...form })
    emit('close')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal glass">
      <div class="modal-header">
        <span class="modal-title">添加网络音频</span>
        <button class="icon-btn" @click="emit('close')">
          <Icon name="close" :size="18" />
        </button>
      </div>

      <div class="modal-body">
        <label class="field">
          <span>音频地址 *</span>
          <input v-model="form.url" type="text" placeholder="https://example.com/music.mp3" />
        </label>
        <label class="field">
          <span>歌曲名称</span>
          <input v-model="form.name" type="text" placeholder="留空则取文件名" />
        </label>
        <label class="field">
          <span>歌手</span>
          <input v-model="form.artist" type="text" placeholder="可选" />
        </label>
        <label class="field">
          <span>专辑封面地址</span>
          <input v-model="form.coverUrl" type="text" placeholder="https://example.com/cover.jpg（可选）" />
        </label>
        <label class="field">
          <span>歌词地址（LRC）</span>
          <input v-model="form.lyricUrl" type="text" placeholder="https://example.com/lyric.lrc（可选）" />
        </label>
      </div>

      <div class="modal-footer">
        <button class="btn" @click="emit('close')">取消</button>
        <button class="btn primary" :disabled="!form.url.trim() || loading" @click="submit">
          <Icon v-if="loading" name="spinner" :size="16" class="spin" />
          <span>{{ loading ? '加载中…' : '添加并播放' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@mixin animate($name) {
  animation-name: $name;
  animation-delay: 0s;
  animation-duration: 200ms;
  animation-fill-mode: forwards;
  animation-iteration-count: 1;
}


.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(0);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  @include animate(show);

  .modal {
    width: 100%;
    max-width: 440px;
    padding: 20px;
    transform: scale(0.65);
    @include animate(toBig);
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 14px;

      .primary {
        background: var(--gradient);
        color: #fff;
        border: none;

        :disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 13px;
        color: var(--text-dim);

        input {
          height: 40px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--panel);
          color: var(--text);
          font-size: 14px;
          outline: none;
          transition: border 0.2s ease;

          :focus {
            border-color: var(--accent-2);
          }
        }
      }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      .modal-title {
        font-size: 17px;
        font-weight: 700;
      }
    }
  }
}

html[data-thme=light] {
  .primary:hover {
    color: black;
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes show {

  to {
    backdrop-filter: blur(20px);
  }
}

@keyframes toBig {
  to {
    transform: scale(1);
  }
}
</style>
