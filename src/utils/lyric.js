// LRC 歌词解析：支持标准 LRC 与带逐字时间戳的增强 LRC，输出逐字时间信息

function parseTimeTag(tag) {
  const m = tag.match(/(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?/)
  if (!m) return 0
  const min = parseInt(m[1], 10)
  const sec = parseInt(m[2], 10)
  let ms = 0
  if (m[3]) {
    const frac = m[3]
    if (frac.length === 1) ms = parseInt(frac, 10) * 100
    else if (frac.length === 2) ms = parseInt(frac, 10) * 10
    else ms = parseInt(frac, 10)
  }
  return min * 60 + sec + ms / 1000
}

const TIME_TAG = '\\[\\d{1,2}:\\d{1,2}(?:[.:]\\d{1,3})?\\]'
const WORD_TAG = '<\\d{1,2}:\\d{1,2}(?:[.:]\\d{1,3})?>'

// 将一句歌词拆分为逐字（或逐词）时间片段
function parseWords(text, lineStart, lineEnd) {
  const wordRe = new RegExp(WORD_TAG, 'g')
  const stamps = []
  let m
  while ((m = wordRe.exec(text))) {
    stamps.push({ time: parseTimeTag(m[1]), index: m.index, len: m[0].length })
  }

  if (stamps.length > 0) {
    const words = []
    for (let i = 0; i < stamps.length; i++) {
      const s = stamps[i]
      const segStart = s.index + s.len
      const segEnd = i + 1 < stamps.length ? stamps[i + 1].index : text.length
      const wordText = text.slice(segStart, segEnd)
      if (!wordText) continue
      const wordEnd = i + 1 < stamps.length ? stamps[i + 1].time : lineEnd
      words.push({ text: wordText, start: s.time, end: wordEnd })
    }
    return words
  }

  // 无逐字时间戳时，按字符平均分配时间
  const chars = Array.from(text)
  if (chars.length === 0) return []
  const dur = (lineEnd - lineStart) / chars.length
  return chars.map((c, i) => ({
    text: c,
    start: lineStart + i * dur,
    end: lineStart + (i + 1) * dur
  }))
}

export function parseLRC(text) {
  const rawLines = text.split(/\r?\n/)
  const meta = { title: '', artist: '', album: '', offset: 0 }
  const entries = []

  for (const raw of rawLines) {
    const line = raw.trim()
    if (!line) continue

    const metaMatch = line.match(/\[(ti|ar|al|by|offset):(.*)\]/i)
    if (metaMatch) {
      const key = metaMatch[1].toLowerCase()
      const val = metaMatch[2].trim()
      if (key === 'offset') meta.offset = parseInt(val, 10) || 0
      else if (key === 'ti') meta.title = val
      else if (key === 'ar') meta.artist = val
      else if (key === 'al') meta.album = val
      continue
    }

    const timeRe = /\[(\d{1,2}:\d{1,2}(?:[.:]\d{1,3})?)\]/g
    const times = []
    let tm
    while ((tm = timeRe.exec(line))) {
      times.push(parseTimeTag(tm[1]))
    }
    if (times.length === 0) continue

    const lastIdx = line.lastIndexOf(']')
    const rawContent = line.slice(lastIdx + 1).trim()
    const cleanText = rawContent.replace(new RegExp(WORD_TAG, 'g'), '').trim()

    for (const t of times) {
      entries.push({
        time: t + meta.offset / 1000,
        text: cleanText,
        rawText: rawContent,
        words: []
      })
    }
  }

  entries.sort((a, b) => a.time - b.time)

  for (let i = 0; i < entries.length; i++) {
    const line = entries[i]
    const nextTime = i + 1 < entries.length ? entries[i + 1].time : line.time + 8
    line.end = nextTime
    line.words = parseWords(line.rawText, line.time, nextTime)
  }

  return { meta, lines: entries }
}

export function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) seconds = 0
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 将字节流解码为文本：优先 UTF-8，失败则回退到 ANSI(GBK)
export function decodeBuffer(buf) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    try {
      return new TextDecoder('gbk').decode(buf)
    } catch {
      return new TextDecoder('utf-8').decode(buf)
    }
  }
}

// 读取本地文本文件（自动识别 UTF-8 / ANSI 编码）
export async function readLocalText(file) {
  const buf = await file.arrayBuffer()
  return decodeBuffer(buf)
}
