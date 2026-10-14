import { chooseUpgrade, createGame, startRun, tick } from '../src/sim.ts'
import type { Game, UpgradeId } from '../src/types.ts'

const prefer: UpgradeId[] = [
  'hunger',
  'wick',
  'wisp',
  'temper',
  'reach',
  'feast',
  'drift',
  'heart',
  'fan',
  'trail',
  'bellows',
  'arc',
  'emberheart',
  'hush',
  'nova',
  'glass',
]

function pick(g: Game): void {
  let best = 0
  let rank = 999
  g.offers.forEach((offer, index) => {
    const at = prefer.indexOf(offer.id as UpgradeId)
    const score = at === -1 ? 50 : at
    if (score < rank) {
      rank = score
      best = index
    }
  })
  chooseUpgrade(g, best)
}

function nearest(g: Game, wantEmber: boolean): { x: number; y: number } | null {
  if (wantEmber && g.embers.length) {
    let best = g.embers[0]!
    let bestD = Infinity
    for (const em of g.embers) {
      const d = Math.hypot(em.x - g.player.x, em.y - g.player.y)
      if (d < bestD) {
        bestD = d
        best = em
      }
    }
    return best
  }
  let chosen: { x: number; y: number } | null = null
  let bestD = Infinity
  for (const e of g.enemies) {
    if (e.dead) continue
    const d = Math.hypot(e.x - g.player.x, e.y - g.player.y)
    if (d < bestD) {
      bestD = d
      chosen = e
    }
  }
  return chosen
}

function run(seed: number): { score: number; time: number; state: string; level: number; kills: number; heat: number } {
  const g = createGame()
  startRun(g, { mode: 'endless', seed, blessing: 'bare', bestAtStart: 0, tutor: false })
  let steps = 0
  const limit = 180 * 60
  while (steps < limit && g.state !== 'dead') {
    if (g.state === 'levelup') pick(g)
    const heat = g.heat / g.mods.maxHeat
    const target = nearest(g, heat < 0.62)
    let ax = 0
    let ay = 0
    let burst = false
    if (target) {
      const dx = target.x - g.player.x
      const dy = target.y - g.player.y
      const d = Math.hypot(dx, dy) || 1
      const tooClose = d < 78 && !('value' in target)
      ax = (tooClose ? -dx : dx) / d
      ay = (tooClose ? -dy : dy) / d
      let close = 0
      for (const e of g.enemies) {
        if (Math.hypot(e.x - g.player.x, e.y - g.player.y) < 52) close += 1
      }
      burst = g.burstCd <= 0 && close >= 2
    }
    tick(g, { ax, ay, burst }, 1 / 60)
    if (!Number.isFinite(g.score) || !Number.isFinite(g.player.x) || !Number.isFinite(g.heat)) {
      throw new Error(`non-finite state at t=${g.time}`)
    }
    steps += 1
  }
  return {
    score: Math.round(g.score),
    time: Math.round(g.time),
    state: g.state,
    level: g.level,
    kills: g.kills,
    heat: Math.round(g.heat),
    bosses: g.bossKills,
    combo: g.comboBest,
    build: Object.entries(g.ranks)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${k}${n}`)
      .join(','),
  }
}

let failed = false
for (const seed of [1, 99, 404040]) {
  const result = run(seed)
  console.log(JSON.stringify(result))
  if (result.kills < 3 || result.score <= 0 || result.time < 8) failed = true
}
if (failed) {
  console.error('soak: a run died before it could teach the wick')
  process.exit(1)
}
