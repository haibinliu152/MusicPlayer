// WebAudio 音频引擎 —— 不依赖 <audio> 标签，使用 AudioBufferSourceNode 播放
export class AudioEngine {
  constructor() {
    this.ctx = null
    this.gain = null
    this.analyser = null
    this.source = null
    this.buffer = null

    this.volume = 0.75
    this.isPlaying = false
    this.startTime = 0 // ctx.currentTime 起始点
    this.pausedAt = 0 // 暂停时的时间偏移（秒）
    this.duration = 0

    this.onEnded = null
    this._endedFired = false
  }

  // 惰性初始化 AudioContext（需在用户手势后调用）
  init() {
    if (this.ctx) return
    const Ctx = window.AudioContext || window.webkitAudioContext
    this.ctx = new Ctx()
    this.gain = this.ctx.createGain()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.8

    this.gain.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)
    this.gain.gain.value = this.volume
  }

  // 在用户手势内调用，确保 AudioContext 处于可播放状态
  unlock() {
    this.init()
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  setVolume(v) {
    this.volume = v
    if (this.gain) this.gain.gain.value = v
  }

  async loadFromArrayBuffer(arrayBuffer) {
    this.init()
    const audioData = await this.ctx.decodeAudioData(arrayBuffer.slice(0))
    this.buffer = audioData
    this.duration = audioData.duration
    return this.duration
  }

  async loadFromUrl(url) {
    this.init()
    const res = await fetch(url)
    if (!res.ok) throw new Error(`加载音频失败：${res.status}`)
    const arrayBuffer = await res.arrayBuffer()
    return this.loadFromArrayBuffer(arrayBuffer)
  }

  // 停止当前 source（不触发 onended）
  _stopSource() {
    if (this.source) {
      try {
        this.source.onended = null
        this.source.stop()
      } catch (e) {
        /* 已停止 */
      }
      this.source.disconnect()
      this.source = null
    }
  }

  play(offset = this.pausedAt) {
    if (!this.buffer) return
    this.init()
    this.ctx.resume()
    this._stopSource()

    const source = this.ctx.createBufferSource()
    source.buffer = this.buffer
    source.connect(this.gain)

    this._endedFired = false
    source.onended = () => {
      // 仅在自然播完时回调（stop/seek 会先把 onended 置空）
      if (this.source === source && !this._endedFired) {
        this._endedFired = true
        this.isPlaying = false
        if (this.onEnded) this.onEnded()
      }
    }

    source.start(0, offset)
    this.source = source
    this.startTime = this.ctx.currentTime - offset
    this.isPlaying = true
  }

  pause() {
    if (!this.isPlaying || !this.buffer) return
    this.pausedAt = this.getCurrentTime()
    this._stopSource()
    this.isPlaying = false
  }

  stop() {
    this.pausedAt = 0
    this._stopSource()
    this.isPlaying = false
  }

  seek(time) {
    if (!this.buffer) return
    const t = Math.max(0, Math.min(time, this.duration))
    if (this.isPlaying) {
      this._stopSource()
      this.play(t)
    } else {
      this.pausedAt = t
    }
  }

  getCurrentTime() {
    if (!this.buffer) return 0
    if (this.isPlaying) {
      const t = this.ctx.currentTime - this.startTime
      return Math.max(0, Math.min(t, this.duration))
    }
    return this.pausedAt
  }

  // 获取频谱数据（0-255）
  getFrequencyData(array) {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array)
    } else {
      array.fill(0)
    }
  }

  dispose() {
    this._stopSource()
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
      this.gain = null
      this.analyser = null
    }
  }
}

export const audioEngine = new AudioEngine()
