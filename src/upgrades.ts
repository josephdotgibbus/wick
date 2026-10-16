/**
 * The upgrade shelf starts empty on purpose.
 * Add an object to UPGRADES and it can show up on a treasure pedestal or, rarely, in a chest.
 *
 * Passive entries change Isaac stats and stay for the run.
 * Active entries go in the one active slot. Using it calls `use` from sim.ts once it is charged.
 * Charges fill by 1 each time a room is cleared. The slot starts empty.
 *
 * Stat fields are added to the player. maxHeat raises the wick, which is your life.
 * Leave a field out to leave that stat alone.
 */
export interface UpgradeDef {
  id: string
  name: string
  description: string
  kind: 'passive' | 'active'
  damage?: number
  tears?: number
  speed?: number
  range?: number
  shotSpeed?: number
  luck?: number
  maxHeat?: number
  charges?: number
  use?: string
}

export const UPGRADES: UpgradeDef[] = []

export function upgradeById(id: string): UpgradeDef | undefined {
  return UPGRADES.find((item) => item.id === id)
}

export function signed(n: number): string {
  const text = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, '')
  return n > 0 ? `+${text}` : text
}

export function upgradeDetail(def: UpgradeDef): string {
  const parts: string[] = []
  if (def.damage) parts.push(`Damage ${signed(def.damage)}`)
  if (def.tears) parts.push(`Tears ${signed(def.tears)}`)
  if (def.speed) parts.push(`Speed ${signed(def.speed)}`)
  if (def.range) parts.push(`Range ${signed(def.range)}`)
  if (def.shotSpeed) parts.push(`Shot speed ${signed(def.shotSpeed)}`)
  if (def.luck) parts.push(`Luck ${signed(def.luck)}`)
  if (def.maxHeat) parts.push(`Heat ${signed(def.maxHeat)}`)
  if (def.kind === 'active') parts.push(`Active item. Charges in ${def.charges ?? 1} cleared rooms.`)
  return parts.join(' · ')
}
