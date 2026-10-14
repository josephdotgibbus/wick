export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function formatScore(n: number): string {
  return Math.max(0, Math.floor(n)).toLocaleString('en-US')
}
