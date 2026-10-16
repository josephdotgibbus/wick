import type { EventId, Kind, Stats } from './types.ts'
import type { UpgradeDef } from './upgrades.ts'
import { upgradeDetail } from './upgrades.ts'

export const EVENTS: EventId[] = ['strong', 'slip', 'rubble', 'haste', 'starve', 'fog', 'vents', 'surge']

export function baseStats(): Stats {
  return {
    damage: 3.5,
    tears: 1.82,
    speed: 0.85,
    range: 6.5,
    shotSpeed: 1,
    luck: 0,
    magnet: 0,
  }
}

export function applyUpgrade(stats: Stats, def: UpgradeDef): void {
  if (def.kind !== 'passive') return
  if (def.damage) stats.damage += def.damage
  if (def.tears) stats.tears += def.tears
  if (def.speed) stats.speed += def.speed
  if (def.range) stats.range += def.range
  if (def.shotSpeed) stats.shotSpeed += def.shotSpeed
  if (def.luck) stats.luck += def.luck
  if (def.magnet) stats.magnet += def.magnet
  stats.damage = Math.max(0.5, stats.damage)
  stats.tears = Math.max(0.5, Math.min(15, stats.tears))
  stats.speed = Math.max(0.4, Math.min(2, stats.speed))
  stats.range = Math.max(2, stats.range)
  stats.shotSpeed = Math.max(0.4, stats.shotSpeed)
}

export function statLines(stats: Stats): { label: string; value: string }[] {
  const num = (n: number) => n.toFixed(2)
  return [
    { label: 'Speed', value: num(stats.speed) },
    { label: 'Tears', value: num(stats.tears) },
    { label: 'Damage', value: num(stats.damage) },
    { label: 'Range', value: num(stats.range) },
    { label: 'Shot speed', value: num(stats.shotSpeed) },
    { label: 'Luck', value: num(stats.luck) },
    { label: 'Magnet', value: `${Math.round(28 + stats.magnet)}` },
  ]
}

export function pedestalCopy(def: UpgradeDef | undefined): { name: string; text: string; detail: string } {
  if (!def) return { name: 'Bare pedestal', text: 'Nothing is set out. Add upgrades in src/upgrades.ts and they will appear here.', detail: '' }
  return { name: def.name, text: def.description, detail: upgradeDetail(def) }
}

export function tierLabel(def: UpgradeDef): string {
  const kind = def.kind === 'active' ? 'Active' : 'Passive'
  return `${kind} · Tier ${def.tier}`
}

export const EVENT_COPY: Record<EventId, { title: string; sub: string }> = {
  strong: { title: 'Tougher enemies', sub: 'They have more health, and a touch spends more heat.' },
  slip: { title: 'Slick ground', sub: 'You slide. Letting go does not stop you at once.' },
  rubble: { title: 'Extra stones', sub: 'More rocks sit on the floor and block the way.' },
  haste: { title: 'Faster enemies', sub: 'Wisps and red enemies close in quicker.' },
  starve: { title: 'Heat drains faster', sub: 'The wick burns about 50% faster in this dungeon.' },
  fog: { title: 'Smaller light', sub: 'The light around you shrinks.' },
  vents: { title: 'Extra hazards', sub: 'Pits drain heat. Bramble spends heat when you touch it.' },
  surge: { title: 'Extra enemies', sub: 'Combat rooms hold two more enemies.' },
}

export function lightOf(heat: number, maxHeat: number, base: number): number {
  const h = maxHeat <= 0 ? 0 : Math.max(0, heat) / maxHeat
  return base * (0.74 + 0.26 * h)
}

export const KIND_COLOR: Record<Kind, string> = {
  wisp: '#c9b8ae',
  great: '#8a7c76',
  cinder: '#ff4d3a',
  boss: '#f2e6dc',
}

export function eulogyFor(cause: string): string {
  if (cause === 'hunger') return 'The wick burned out.'
  if (cause === 'a pit') return 'A pit drained the last of the wick.'
  if (cause === 'bramble') return 'Bramble took the last of the heat.'
  if (cause === 'a red glare') return 'A red beam took the last of the heat. The warning line does not hurt. The bright beam does.'
  if (cause === 'a spike') return 'A Briar spike took the last of the heat.'
  if (cause === 'you let go') return 'You ended the run.'
  if (cause === 'Wisp') return 'A wisp took the last of the heat.'
  if (cause === 'Great wisp') return 'A great wisp took the last of the heat.'
  if (cause === 'Cinder wisp') return 'A red enemy took the last of the heat.'
  if (cause === 'The Briar') return 'The Briar took the last of the heat.'
  if (!cause) return 'The flame went out.'
  return `${cause} took the last of the heat.`
}
