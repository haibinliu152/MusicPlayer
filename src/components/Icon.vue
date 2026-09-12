<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 }
})

// 统一的 SVG 图标集合
const icons = {
  play: '<path d="M8 5v14l11-7z"/>',
  pause: '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>',
  stop: '<path d="M6 6h12v12H6z"/>',
  prev: '<path d="M6 6h2v12H6zM20 6l-11 6 11 6z"/>',
  next: '<path d="M16 6h2v12h-2zM4 6l11 6-11 6z"/>',
  volume: '<path d="M3 10v4h4l5 5V5L7 10H3z"/><path d="M16 8a5 5 0 0 1 0 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.5 5.5a9 9 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  'volume-low': '<path d="M3 10v4h4l5 5V5L7 10H3z"/><path d="M16 8a5 5 0 0 1 0 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  'volume-mute': '<path d="M3 10v4h4l5 5V5L7 10H3z"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  shuffle: '<path d="M4 6h3.5c1.4 0 2.1 1.6 1.3 2.7l6.4 6.6c.8.9 2.1 1.4 3.3 1.4H20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 18h3.5c1.4 0 2.1-1.6 1.3-2.7l-.8-.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 7h2m4 0h-4m0 0V5m0 2v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 17h2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  sequence: '<path d="M4 6h12M4 12h12M4 18h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17 14l3 3-3 3M20 17H16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  loop: '<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  'theme-light': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  'theme-dark': '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
  'spectrum-bar': '<path d="M4 20V10M9 20V4M14 20v-8M19 20V7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  'spectrum-ring': '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.5"/><path d="M12 9v-2.5M12 17.5V15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6M10 11v6M14 11v6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  lyrics: '<path d="M4 5h16M4 10h10M4 15h16M4 20h8"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  spinner: '<path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
  cover: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2a10 10 0 0 1 10 10"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>'
}

const icon = computed(() => icons[props.name] || '')

const style = computed(() => ({
  width: typeof props.size === 'number' ? props.size + 'px' : props.size,
  height: typeof props.size === 'number' ? props.size + 'px' : props.size
}))
</script>

<template>
  <svg
    :style="style"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    v-html="icon"
  />
</template>
