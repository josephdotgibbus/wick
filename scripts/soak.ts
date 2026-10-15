import { chooseUpgrade, createGame, startRun, tick } from '../src/sim.ts'
import type { Game, UpgradeId } from '../src/types.ts'

const prefer: UpgradeId[] = [
  'kindling',
  'hearth',
  'moth',
  'orbit',
  'leech',
  'halo',
  'split',
  'pierce',
  'pop',
  'lure',
  'slowburn',
  'step',
  'brand',
  'coal',
  'back',
  'nova',
  'glass',
]

function pick(g: Game): void {
  let best = 0
  let rank = 999
  g.offers.forEach((offer, index) => {
    if (offer.kind === 'curse') {
      best = index
      rank = -1
      return
    }
    const at = prefer.indexOf(offer.id as UpgradeId)
    const score = at === -1 ? 50 : at
    if (rank >= 0 && score < rank) {
      rank = score
      best = index
    }
  })
  chooseUpgrade(g, best)
}

function nearest(g: Game): { x: number; y: number } | null {
  let chosen: { x: number; y: number } | null = null
  let bestD = Infinity
  for (const spark of g.sparks) {
    if (spark.taken) continue
    const d = Math.hypot(spark.x - g.player.x, spark.y - g.player.y)
    if (d < bestD) {
      bestD = d
      chosen = spark
    }
  }
  if (g.heat / g.mods.maxHeat < 0.45 && chosen) return chosen
  bestD = Infinity
  chosen = null
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

function run(seed: number): { round: number; time: number; state: string; kills: number; heat: number } {
  const g = createGame()
  startRun(g, { mode: 'endless', seed, blessing: 'bare', bestAtStart: 0, tutor: false })
  let steps = 0
  const limit = 90 * 60
  while (steps < limit && g.state !== 'dead') {
    if (g.state === 'levelup') pick(g)
    const target = nearest(g)
    let ax = 0
    let ay = 0
    if (target) {
      const dx = target.x - g.player.x
      const dy = target.y - g.player.y
      const d = Math.hypot(dx, dy) || 1
      const tooClose = d < 90 && g.enemies.includes(target as never)
      ax = (tooClose ? -dx : dx) / d
      ay = (tooClose ? -dy : dy) / d
    }
    tick(g, { ax, ay, burst: steps % 90 === 0 }, 1 / 60)
    steps += 1
  }
  return { round: g.round, time: g.time, state: g.state, kills: g.kills, heat: g.heat }
}

for (const seed of [1, 99, 404040]) {
  const result = run(seed)
  console.log(JSON.stringify(result))
  if (result.kills < 3 || result.time < 8) {
    throw new Error(`Seed ${seed} died on arrival ${JSON.stringify(result)}`)
  }
}
