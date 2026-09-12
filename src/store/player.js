import { defineStore } from 'pinia'
import { audioEngine } from '../audio/engine'
import { parseLRC, readLocalText, decodeBuffer } from '../utils/lyric'

let uid = 0

const baseName = (name) => name.replace(/\.[^.]+$/, '')

const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'opus', 'webm']
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem('mp-history') || '[]')
  } catch {
    return []
  }
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    playlist: [],
    currentIndex: -1,
    isPlaying: false,
    volume: Number(localStorage.getItem('mp-volume')) || 0.75,
    currentTime: 0,
    duration: 0,
    playMode: localStorage.getItem('mp-mode') || 'sequence', // sequence | shuffle | loop
    theme: localStorage.getItem('mp-theme') || 'dark',
    history: loadHistory(),
    error: '',
    _rafId: null
  }),

  getters: {
    currentTrack: (s) => s.playlist[s.currentIndex] || null,
    lyricData: (s) => {
      const t = s.playlist[s.currentIndex]
      if (t && t.lyricText) return parseLRC(t.lyricText)
      return { meta: {}, lines: [] }
    }
  },

  actions: {
    init() {
      try{
        audioEngine.onEnded = () => this._onEnded()
      }catch(e){
        return;
      }
      audioEngine.setVolume(this.volume)
      this._applyTheme()
      const tick = () => {
        if (this.isPlaying) {
          this.currentTime = audioEngine.getCurrentTime()
        }
        this._rafId = requestAnimationFrame(tick)
      }
      this._rafId = requestAnimationFrame(tick)
    },

    _applyTheme() {
      document.documentElement.setAttribute('data-theme', this.theme)
    },

    _clearError() {
      this.error = ''
    },

    async _loadTrack(track) {
      await audioEngine.loadFromUrl(track.url)
      this.duration = audioEngine.duration
      track.duration = audioEngine.duration
    },

    async playTrack(index, autoplay = true) {
      const track = this.playlist[index]
      if (!track) return
      audioEngine.unlock()
      this._clearError()
      this.currentIndex = index
      this.currentTime = 0
      this.duration = track.duration || 0

      try {
        await this._loadTrack(track)
        if (autoplay) {
          audioEngine.play(0)
          this.isPlaying = true
        }
        this._recordHistory(track)
      } catch (e) {
        this.isPlaying = false
        this.error = `无法播放「${track.name}」：${e.message || e}`
      }
    },

    togglePlay() {
      if (!this.currentTrack) return
      audioEngine.unlock()
      this._clearError()
      if (this.isPlaying) {
        audioEngine.pause()
        this.isPlaying = false
      } else {
        audioEngine.play()
        this.isPlaying = true
      }
    },

    stop() {
      audioEngine.stop()
      this.isPlaying = false
      this.currentTime = 0
    },

    playNext() {
      if (!this.playlist.length) return
      let next
      if (this.playMode === 'shuffle') {
        do {
          next = Math.floor(Math.random() * this.playlist.length)
        } while (this.playlist.length > 1 && next === this.currentIndex)
      } else {
        next = (this.currentIndex + 1) % this.playlist.length
      }
      this.playTrack(next)
    },

    playPrev() {
      if (!this.playlist.length) return
      let prev
      if (this.playMode === 'shuffle') {
        prev = Math.floor(Math.random() * this.playlist.length)
      } else {
        prev = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length
      }
      this.playTrack(prev)
    },

    seek(time) {
      audioEngine.seek(time)
      this.currentTime = time
    },

    setVolume(v) {
      this.volume = v
      audioEngine.setVolume(v)
      localStorage.setItem('mp-volume', String(v))
    },

    cyclePlayMode() {
      const modes = ['sequence', 'shuffle', 'loop']
      const idx = modes.indexOf(this.playMode)
      this.playMode = modes[(idx + 1) % modes.length]
      localStorage.setItem('mp-mode', this.playMode)
    },

    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('mp-theme', this.theme)
      this._applyTheme()
    },

    // 加载本地文件（音频 + 可选同名 .lrc 歌词与图片封面）
    async addLocalFiles(files) {
      audioEngine.unlock()
      const audioFiles = []
      const lrcMap = {}
      const imgMap = {}

      for (const f of files) {
        const ext = f.name.split('.').pop().toLowerCase()
        if (AUDIO_EXTS.includes(ext)) audioFiles.push(f)
        else if (ext === 'lrc') lrcMap[baseName(f.name)] = await readLocalText(f)
        else if (IMAGE_EXTS.includes(ext)) imgMap[baseName(f.name)] = URL.createObjectURL(f)
      }

      if (!audioFiles.length) return

      const startIndex = this.playlist.length
      const tracks = audioFiles.map((f) => {
        const base = baseName(f.name)
        return {
          id: ++uid,
          type: 'local',
          name: base,
          artist: '',
          url: URL.createObjectURL(f),
          cover: imgMap[base] || '',
          lyricText: lrcMap[base] || '',
          duration: 0
        }
      })
      this.playlist.push(...tracks)

      if (this.currentIndex === -1) {
        this.playTrack(startIndex)
      }
    },

    // 加载网络音频（歌词 URL、封面 URL 可选）
    async addNetworkTrack({ url, name, artist, coverUrl, lyricUrl }) {
      audioEngine.unlock()
      this._clearError()
      let lyricText = ''
      if (lyricUrl) {
        try {
          const res = await fetch(lyricUrl)
          const buf = await res.arrayBuffer()
          lyricText = decodeBuffer(buf)
        } catch (e) {
          this.error = '歌词加载失败：' + e.message
        }
      }
      const track = {
        id: ++uid,
        type: 'network',
        name: name || url.split('/').pop() || '网络音频',
        artist: artist || '',
        url,
        cover: coverUrl || '',
        lyricText,
        duration: 0
      }
      this.playlist.push(track)
      this.playTrack(this.playlist.length - 1)
    },

    setTrackLyric(id, text) {
      const t = this.playlist.find((x) => x.id === id)
      if (t) t.lyricText = text
    },

    setTrackCover(id, url) {
      const t = this.playlist.find((x) => x.id === id)
      if (t) t.cover = url
    },

    removeTrack(id) {
      const idx = this.playlist.findIndex((x) => x.id === id)
      if (idx === -1) return
      const wasCurrent = idx === this.currentIndex
      this.playlist.splice(idx, 1)
      if (this.playlist.length === 0) {
        this.currentIndex = -1
        this.stop()
        return
      }
      if (wasCurrent) {
        this.currentIndex = Math.min(idx, this.playlist.length - 1)
        this.playTrack(this.currentIndex)
      } else if (idx < this.currentIndex) {
        this.currentIndex -= 1
      }
    },

    clearList() {
      this.stop()
      this.playlist = []
      this.currentIndex = -1
      this.currentTime = 0
      this.duration = 0
    },

    _recordHistory(track) {
      const entry = {
        id: track.id,
        name: track.name,
        artist: track.artist,
        type: track.type,
        url: track.type === 'network' ? track.url : '',
        cover: track.cover,
        duration: track.duration,
        lastPlayedAt: Date.now()
      }
      this.history = [
        entry,
        ...this.history.filter(
          (h) => !(h.type === 'network' && h.url && h.url === track.url)
        )
      ].slice(0, 50)
      localStorage.setItem('mp-history', JSON.stringify(this.history))
    },

    clearHistory() {
      this.history = []
      localStorage.removeItem('mp-history')
    },

    // 从历史记录重新播放（仅网络音频可直接恢复）
    playFromHistory(entry) {
      if (entry.type === 'network' && entry.url) {
        this.addNetworkTrack({
          url: entry.url,
          name: entry.name,
          artist: entry.artist,
          coverUrl: entry.cover
        })
      } else {
        this.error = '本地音频请重新选择文件进行播放'
      }
    }
  }
})
