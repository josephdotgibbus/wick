import type { EventId, Kind, Stats } from './types.ts'
import type { UpgradeDef } from './upgrades.ts'
import { upgradeDetail } from './upgrades.ts'

export const EVENTS: EventId[] = ['strong', 'slip', 'rubble', 'haste', 'starve', 'fog', 'vents', 'surge']

export function baseStats(): Stats {
  return {
    damage: 3.5,
    tears: 2.73,
    speed: 1,
    range: 6.5,
    shotSpeed: 1,
    luck: 0,
    red: 6,
    redMax: 6,
    soul: 0,
  }
}

export function applyBlessing(stats: Stats, id: string): void {
  if (id === 'hearth') {
    stats.redMax += 2
    stats.red += 2
  }
  if (id === 'step') stats.speed += 0.2
  if (id === 'kindling') stats.damage += 1
  if (id === 'slowburn') stats.luck += 1
}

export function applyUpgrade(stats: Stats, def: UpgradeDef): void {
  if (def.kind !== 'passive') return
  if (def.damage) stats.damage += def.damage
  if (def.tears) stats.tears += def.tears
  if (def.speed) stats.speed += def.speed
  if (def.range) stats.range += def.range
  if (def.shotSpeed) stats.shotSpeed += def.shotSpeed
  if (def.luck) stats.luck += def.luck
  if (def.redHearts) {
    stats.redMax += def.redHearts * 2
    stats.red += def.redHearts * 2
  }
  if (def.soulHearts) stats.soul += def.soulHearts * 2
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
  ]
}

export function pedestalCopy(def: UpgradeDef | undefined): { name: string; text: string; detail: string } {
  if (!def) return { name: 'Bare pedestal', text: 'Nothing is set out. Add upgrades in src/upgrades.ts and they will appear here.', detail: '' }
  return { name: def.name, text: def.description, detail: upgradeDetail(def) }
}

export const EVENT_COPY: Record<EventId, { title: string; sub: string }> = {
  strong: { title: 'Tougher enemies', sub: 'They have more health, and a touch takes an extra half heart.' },
  slip: { title: 'Slick ground', sub: 'You slide. Letting go does not stop you at once.' },
  rubble: { title: 'Extra stones', sub: 'More rocks sit on the floor and block the way.' },
  haste: { title: 'Faster enemies', sub: 'Wisps and red enemies close in quicker.' },
  starve: { title: 'Heat drains faster', sub: 'The wick burns about 50% faster in this dungeon.' },
  fog: { title: 'Smaller light', sub: 'The light around you shrinks.' },
  vents: { title: 'Extra hazards', sub: 'Pits drain heat. Bramble takes a half heart when you touch it.' },
  surge: { title: 'Extra enemies', sub: 'Combat rooms hold two more enemies.' },
}

export function lightOf(heat: number, maxHeat: number, base: number): number {
  const h = maxHeat <= 0 ? 0 : Math.max(0, heat) / maxHeat
  return base * (0.74 + 0.26 * h)
}

export const KIND_COLOR: Record<Kind, string> = {
  wisp: '#c9b8ae',
  cinder: '#ff4d3a',
  boss: '#f2e6dc',
}

export interface BestMarks {
  round: number
  time: number
  bosses: number
}

export interface Blessing {
  id: string
  name: string
  desc: string
  need: string
  met: (marks: BestMarks) => boolean
}

export const BLESSINGS: Blessing[] = [
  { id: 'bare', name: 'None', desc: 'Start with Isaac’s base stats. 3 red hearts, damage 3.50.', need: '', met: () => true },
  {
    id: 'hearth',
    name: 'Heart',
    desc: 'Start with 4 red hearts instead of 3.',
    need: 'Reach dungeon 2',
    met: (m) => m.round >= 2,
  },
  {
    id: 'step',
    name: 'Speed',
    desc: 'Start at speed 1.20 instead of 1.00.',
    need: 'Reach dungeon 3',
    met: (m) => m.round >= 3,
  },
  {
    id: 'kindling',
    name: 'Damage',
    desc: 'Start at damage 4.50 instead of 3.50.',
    need: 'Reach dungeon 4',
    met: (m) => m.round >= 4,
  },
  {
    id: 'slowburn',
    name: 'Luck',
    desc: 'Start at luck 1.00 instead of 0. Room drops and chests get a little kinder.',
    need: 'Reach dungeon 5, or survive 3:00',
    met: (m) => m.round >= 5 || m.time >= 180,
  },
]

export function blessingById(id: string): Blessing | undefined {
  return BLESSINGS.find((b) => b.id === id)
}

export function eulogyFor(cause: string): string {
  if (cause === 'hunger') return 'The wick burned out.'
  if (cause === 'a pit') return 'A pit drained the last of the wick.'
  if (cause === 'hearts') return 'Your hearts hit zero.'
  if (cause === 'bramble') return 'Bramble took the last heart.'
  if (cause === 'a red glare') return 'A red beam took the last heart. The warning line does not hurt. The bright beam does.'
  if (cause === 'a spike') return 'A Briar spike took the last heart.'
  if (cause === 'you let go') return 'You ended the run.'
  if (cause === 'Wisp') return 'A wisp took the last heart.'
  if (cause === 'Cinder wisp') return 'A red enemy took the last heart.'
  if (cause === 'The Briar') return 'The Briar took the last heart.'
  if (!cause) return 'The flame went out.'
  return `${cause} took the last heart.`
}
