import { doorCenter } from '../src/dungeon.ts'
import { createGame, startRun, tick } from '../src/sim.ts'
import type { Game } from '../src/types.ts'
import { TILE } from '../src/types.ts'

function goal(g: Game): { x: number; y: number } | null {
  const foe = g.enemies.find((e) => !e.dead)
  if (foe) return foe
  const here = g.rooms[g.roomIndex]
  if (!here) return null
  if (here.stair) return { x: (here.w * TILE) / 2, y: (here.h * TILE) / 2 + 70 }
  const door =
    here.doors.find((item) => {
      const next = g.rooms[item.to]
      return next && !next.cleared
    }) ??
    here.doors.find((item) => {
      const next = g.rooms[item.to]
      return next && !next.visited
    }) ??
    here.doors[0]
  return door ? doorCenter(door) : null
}

function run(seed: number): { dungeon: number; time: number; state: string; kills: number; heat: number } {
  const g = createGame()
  startRun(g, { mode: 'endless', seed, bestAtStart: 0, tutor: false })
  let steps = 0
  let stuck = 0
  let wander = 0
  let lastX = g.player.x
  let lastY = g.player.y
  const limit = 90 * 60
  while (steps < limit && g.state !== 'dead') {
    const target = goal(g)
    let ax = 0
    let ay = 0
    if (target) {
      const dx = target.x - g.player.x
      const dy = target.y - g.player.y
      const d = Math.hypot(dx, dy) || 1
      const tooClose = d < 70 && g.enemies.some((e) => !e.dead && e.x === target.x && e.y === target.y)
      ax = (tooClose ? -dx : dx) / d
      ay = (tooClose ? -dy : dy) / d
    }
    if (Math.hypot(g.player.x - lastX, g.player.y - lastY) < 0.4) stuck += 1
    else stuck = 0
    lastX = g.player.x
    lastY = g.player.y
    if (stuck > 18) {
      wander += 1
      const here = g.rooms[g.roomIndex]
      const door = here?.doors[Math.floor(wander / 20) % Math.max(1, here.doors.length)]
      if (door) {
        const at = doorCenter(door)
        const dx = at.x - g.player.x
        const dy = at.y - g.player.y
        const d = Math.hypot(dx, dy) || 1
        ax = dx / d
        ay = dy / d
      }
    }
    const burst = steps % 150 === 0 && g.heat > 55 && g.enemies.some((e) => !e.dead)
    tick(g, { ax, ay, burst, use: false, interact: steps % 30 === 0 }, 1 / 60)
    steps += 1
  }
  return { dungeon: g.dungeon, time: g.time, state: g.state, kills: g.kills, heat: g.heat }
}

for (const seed of [1, 99, 404040]) {
  const result = run(seed)
  console.log(JSON.stringify(result))
  if (result.kills < 1 || result.time < 8 || (result.state === 'dead' && result.time < 12)) {
    throw new Error(`Seed ${seed} died on arrival ${JSON.stringify(result)}`)
  }
}
