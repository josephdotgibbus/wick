export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function formatSeed(n: number): string {
  const hex = (n >>> 0).toString(16).toUpperCase().padStart(8, '0')
  return `WICK-${hex.slice(0, 4)}-${hex.slice(4)}`
}

export function parseSeed(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const hex = trimmed.toUpperCase().replace(/^WICK-/, '').replace(/[^0-9A-F]/g, '')
  if (/^[0-9A-F]{8}$/.test(hex)) return parseInt(hex, 16) >>> 0
  return hashSeed(trimmed)
}

export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0] || 1
  }
  return (Math.random() * 0xffffffff) >>> 0
}

export function dailyKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export function dailySeed(date = new Date()): number {
  return hashSeed(`wick-daily-v1-${dailyKey(date)}`)
}
