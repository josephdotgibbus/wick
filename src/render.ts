import { doorCenter, entryOf, roomOffset } from './dungeon.ts'
import type { Bullet, Decor, Dir, Enemy, Game, Particle, Pedestal, Room } from './types.ts'
import { SLIDE_TIME, TILE } from './types.ts'
import { upgradeById } from './upgrades.ts'

const TAU = Math.PI * 2

export interface SteerWidget {
  ox: number
  oy: number
  ax: number
  ay: number
}

export interface RenderView {
  wall: number
  dpr: number
  width: number
  height: number
  steer: SteerWidget | null
}

export function render(ctx: CanvasRenderingContext2D, g: Game, view: RenderView): void {
  const { width: w, height: h, dpr } = view
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#100c0a'
  ctx.fillRect(0, 0, w, h)

  const shake = g.shake
  const sx = (Math.random() - 0.5) * shake
  const sy = (Math.random() - 0.5) * shake
  const menu = g.state === 'menu' || g.state === 'steer'
  const cam = menu ? { x: g.player.x, y: g.player.y - h * 0.28, zoom: 1 } : camera(g, w, h)

  ctx.save()
  ctx.translate(w / 2 + sx, h / 2 + sy)
  ctx.scale(cam.zoom, cam.zoom)
  ctx.translate(-cam.x, -cam.y)

  const pose = menu ? null : slidePose(g)
  const here = g.rooms[g.roomIndex]
  ctx.beginPath()
  if (pose) {
    const keepFrom = pose.u < 1
    const x0 = keepFrom ? Math.min(0, pose.off.x) : pose.off.x
    const y0 = keepFrom ? Math.min(0, pose.off.y) : pose.off.y
    const x1 = keepFrom ? Math.max(pose.from.w * TILE, pose.off.x + pose.to.w * TILE) : pose.off.x + pose.to.w * TILE
    const y1 = keepFrom ? Math.max(pose.from.h * TILE, pose.off.y + pose.to.h * TILE) : pose.off.y + pose.to.h * TILE
    ctx.rect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4)
  } else if (!menu && here) {
    ctx.rect(-2, -2, here.w * TILE + 4, here.h * TILE + 4)
  } else {
    ctx.rect(-8000, -8000, 16000, 16000)
  }
  ctx.clip()

  if (menu) drawGround(ctx, g.player.x, g.player.y, w, h)
  else if (pose) {
    if (pose.u < 1) drawRoom(ctx, pose.from, view.wall, 0, 0)
    drawRoom(ctx, pose.to, view.wall, pose.off.x, pose.off.y)
  } else if (here) {
    drawRoom(ctx, here, view.wall, 0, 0)
  }
  if (!pose) {
    for (const wline of g.warnings) drawWarning(ctx, wline.x, wline.y, wline.ang, wline.len, wline.life / wline.max, wline.thin)
    for (const beam of g.beams) drawBeam(ctx, beam.x, beam.y, beam.ang, beam.len, beam.width, beam.life / beam.max, beam.color)
  }
  for (const p of g.particles) if (p.behind) drawParticle(ctx, p)
  ctx.globalAlpha = 1
  if (menu) {
    for (const d of g.decor) drawDecor(ctx, d, g.menuT)
  }
  if (!pose) {
    for (const e of g.enemies) drawEnemy(ctx, e, view.wall)
    for (const b of g.bullets) drawBullet(ctx, b)
  }
  const flameX = pose ? pose.px : g.player.x
  const flameY = pose ? pose.py : g.player.y
  drawFlame(ctx, g, view.wall, flameX, flameY)
  for (const p of g.particles) if (!p.behind) drawParticle(ctx, p)
  ctx.globalAlpha = 1
  for (const f of g.floaters) {
    ctx.globalAlpha = Math.max(0, f.life / f.max)
    ctx.fillStyle = f.color
    ctx.font = '600 14px "Outfit Variable", Outfit, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(f.text, f.x, f.y)
  }
  ctx.globalAlpha = 1
  const reveal = pose ? Math.max(0, (pose.u - 0.62) / 0.38) : 1
  if (!menu && g.state !== 'dead' && reveal > 0) {
    const lx = pose ? pose.px : g.player.x
    const ly = pose ? pose.py : g.player.y
    const span = Math.max(w, h) / cam.zoom
    const radius = g.light * 1.45
    const glow = ctx.createRadialGradient(lx, ly, radius * 0.62, lx, ly, radius)
    glow.addColorStop(0, 'rgba(0,0,0,0)')
    glow.addColorStop(1, `rgba(0,0,0,${0.22 * reveal})`)
    ctx.fillStyle = glow
    ctx.fillRect(lx - span, ly - span, span * 2, span * 2)
  }
  ctx.restore()

  if (!menu && !pose) drawMarkers(ctx, g, w, h)
  drawVignette(ctx, g, w, h)
  if (g.slip && g.state === 'playing') {
    ctx.fillStyle = 'rgba(180, 200, 220, 0.04)'
    ctx.fillRect(0, 0, w, h)
  }
  if (g.hurtFlash > 0) {
    ctx.fillStyle = `rgba(255, 244, 230, ${Math.min(0.35, g.hurtFlash)})`
    ctx.fillRect(0, 0, w, h)
  }
  if (g.whiteFlash > 0 && g.whiteFlashMax > 0) {
    const along = 1 - g.whiteFlash / g.whiteFlashMax
    const alpha = Math.sin(Math.min(1, Math.max(0, along)) * Math.PI) ** 0.65 * 0.82
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.fillRect(0, 0, w, h)
  }
  if (g.state === 'dying' || g.state === 'dead') {
    const a = g.state === 'dead' ? 0.38 : (1 - g.snuff) * 0.45
    ctx.fillStyle = `rgba(6, 8, 12, ${a})`
    ctx.fillRect(0, 0, w, h)
  }
  if (view.steer && g.control === 'mouse') drawStick(ctx, view.steer)
}

function camera(g: Game, w: number, h: number): { x: number; y: number; zoom: number } {
  const pose = slidePose(g)
  if (pose) {
    const start = fitted(pose.from, g.player.x, g.player.y, w, h)
    const endLocal = fitted(pose.to, pose.ax, pose.ay, w, h)
    const end = { x: endLocal.x + pose.off.x, y: endLocal.y + pose.off.y, zoom: endLocal.zoom }
    const along = start.zoom + (end.zoom - start.zoom) * pose.u
    const open = Math.sin(pose.u * Math.PI)
    const wide = Math.min(along, boundsZoom(pose, w, h))
    return {
      x: start.x + (end.x - start.x) * pose.u,
      y: start.y + (end.y - start.y) * pose.u,
      zoom: along + (wide - along) * open,
    }
  }
  const here = g.rooms[g.roomIndex]
  if (!here) return { x: g.player.x, y: g.player.y, zoom: 1 }
  return fitted(here, g.player.x, g.player.y, w, h)
}

function fitted(room: Room, focusX: number, focusY: number, w: number, h: number): { x: number; y: number; zoom: number } {
  const zoom = zoomFor(room, w, h)
  const rw = room.w * TILE
  const rh = room.h * TILE
  if (rw * zoom <= w && rh * zoom <= h) return { x: rw / 2, y: rh / 2, zoom }
  const viewW = w / zoom
  const viewH = h / zoom
  return {
    x: Math.min(rw - viewW / 2, Math.max(viewW / 2, focusX)),
    y: Math.min(rh - viewH / 2, Math.max(viewH / 2, focusY)),
    zoom,
  }
}

function boundsZoom(
  pose: { from: Room; to: Room; off: { x: number; y: number } },
  w: number,
  h: number,
): number {
  const x0 = Math.min(0, pose.off.x)
  const y0 = Math.min(0, pose.off.y)
  const x1 = Math.max(pose.from.w * TILE, pose.off.x + pose.to.w * TILE)
  const y1 = Math.max(pose.from.h * TILE, pose.off.y + pose.to.h * TILE)
  const fit = Math.min((w - 48) / Math.max(1, x1 - x0), (h - 160) / Math.max(1, y1 - y0))
  return Math.max(0.45, fit)
}

function zoomFor(room: Room, w: number, h: number): number {
  const fit = Math.min((w - 36) / (room.w * TILE), (h - 150) / (room.h * TILE))
  return Math.min(2.8, Math.max(1, fit))
}

function slidePose(g: Game): {
  from: Room
  to: Room
  off: { x: number; y: number }
  px: number
  py: number
  ax: number
  ay: number
  u: number
} | null {
  const slide = g.slide
  if (!slide) return null
  const from = g.rooms[slide.from]
  const to = g.rooms[slide.to]
  if (!from || !to) return null
  const off = roomOffset(from, to, slide.dir)
  const u = smooth(Math.min(1, slide.t / SLIDE_TIME))
  const arrive = entryOf(to, oppositeDir(slide.dir))
  return {
    from,
    to,
    off,
    u,
    ax: arrive.x,
    ay: arrive.y,
    px: g.player.x + (arrive.x + off.x - g.player.x) * u,
    py: g.player.y + (arrive.y + off.y - g.player.y) * u,
  }
}

function smooth(u: number): number {
  return u * u * (3 - 2 * u)
}

function oppositeDir(dir: Dir): Dir {
  if (dir === 'n') return 's'
  if (dir === 's') return 'n'
  if (dir === 'e') return 'w'
  return 'e'
}

function drawRoom(ctx: CanvasRenderingContext2D, here: Room, t: number, ox: number, oy: number): void {
  ctx.save()
  ctx.translate(ox, oy)
  for (let y = 0; y < here.h; y++) {
    for (let x = 0; x < here.w; x++) {
      const tile = here.tiles[y * here.w + x] ?? 1
      const px = x * TILE
      const py = y * TILE
      if (tile === 1) {
        ctx.fillStyle = '#4a3b34'
        ctx.fillRect(px, py, TILE + 0.5, TILE + 0.5)
        ctx.fillStyle = 'rgba(246, 239, 228, 0.16)'
        ctx.fillRect(px, py, TILE, 4)
      } else if (tile === 2) {
        ctx.fillStyle = '#6a5348'
        ctx.fillRect(px, py, TILE, TILE)
        drawStoneTile(ctx, px + TILE / 2, py + TILE / 2)
      } else {
        const shade = ((x * 17 + y * 9) % 5) / 80
        ctx.fillStyle = `rgb(${78 + shade * 50}, ${52 + shade * 28}, ${40 + shade * 16})`
        ctx.fillRect(px, py, TILE + 0.5, TILE + 0.5)
        if (tile === 3) drawHazard(ctx, px + TILE / 2, py + TILE / 2, 12, 'pit', t)
        if (tile === 4) drawHazard(ctx, px + TILE / 2, py + TILE / 2, 11, 'bramble', t)
      }
    }
  }
  for (const door of here.doors) drawDoor(ctx, here, door.dir, door.tx, door.ty, here.cleared)
  for (const coin of here.coins) if (!coin.taken) drawPickup(ctx, coin.x, coin.y, coin.kind, t)
  for (const pedestal of here.pedestals) drawPedestal(ctx, pedestal, t)
  if (here.chest && (here.kind !== 'boss' || here.cleared)) drawChest(ctx, here.chest.x, here.chest.y, here.chest.opened, t)
  if (here.stair) drawStair(ctx, (here.w * TILE) / 2, (here.h * TILE) / 2 + 70, t)
  ctx.restore()
}

function drawDoor(
  ctx: CanvasRenderingContext2D,
  here: Room,
  dir: 'n' | 'e' | 's' | 'w',
  tx: number,
  ty: number,
  open: boolean,
): void {
  const at = doorCenter({ dir, to: 0, tx, ty })
  ctx.save()
  ctx.translate(at.x, at.y)
  ctx.fillStyle = open ? 'rgba(240, 180, 90, 0.85)' : 'rgba(90, 70, 64, 0.9)'
  if (dir === 'n' || dir === 's') ctx.fillRect(-TILE, -4, TILE * 2, 8)
  else ctx.fillRect(-4, -TILE, 8, TILE * 2)
  ctx.restore()
  void here
}

function drawStoneTile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath()
  ctx.arc(x, y, 11, 0, TAU)
  ctx.fillStyle = '#3a302c'
  ctx.fill()
  ctx.strokeStyle = 'rgba(246, 239, 228, 0.18)'
  ctx.stroke()
}

function drawPickup(ctx: CanvasRenderingContext2D, x: number, y: number, kind: 'coin' | 'spark', t: number): void {
  if (kind === 'spark') {
    drawSpark(ctx, x, y, t)
    return
  }
  drawCoin(ctx, x, y, t)
}

function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  const bob = Math.sin(t * 3.2 + x * 0.08) * 1.4
  const cy = y + bob
  ctx.beginPath()
  ctx.arc(x, cy, 5.8, 0, TAU)
  ctx.fillStyle = '#a86a1c'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x, cy, 4.3, 0, TAU)
  ctx.fillStyle = '#f0b45a'
  ctx.fill()
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, cy, 4.3, 0, TAU)
  ctx.clip()
  const sweep = ((t * 0.65 + x * 0.017) % 1) * 18 - 9
  const glint = ctx.createLinearGradient(x + sweep - 3, cy, x + sweep + 3, cy)
  glint.addColorStop(0, 'rgba(255,255,255,0)')
  glint.addColorStop(0.5, 'rgba(255,252,240,0.95)')
  glint.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glint
  ctx.fillRect(x + sweep - 3, cy - 6, 6, 12)
  ctx.restore()
}

const TIER_GEM = ['#c4b4a4', '#f0b45a', '#9eb7d8', '#ffe1a3', '#fffaf2']

function drawPedestal(ctx: CanvasRenderingContext2D, pedestal: Pedestal, t: number): void {
  const x = pedestal.x
  const y = pedestal.y
  const full = !!pedestal.upgradeId && !pedestal.taken
  const def = full && pedestal.upgradeId ? upgradeById(pedestal.upgradeId) : undefined
  ctx.fillStyle = '#2a211c'
  ctx.fillRect(x - 10, y - 4, 20, 16)
  ctx.fillStyle = pedestal.taken ? '#4a403a' : '#6a5348'
  ctx.fillRect(x - 7, y - 16, 14, 14)
  if (!def) return
  const gem = TIER_GEM[def.tier] ?? '#ffe1a3'
  const orbY = y - 22
  if (def.tier === 2 && pedestal.reveal > 0) drawTier2Glow(ctx, x, orbY, pedestal.reveal)
  ctx.beginPath()
  ctx.arc(x, orbY, 10, 0, TAU)
  ctx.fillStyle = 'rgba(18, 12, 10, 0.72)'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x, orbY, 10, 0, TAU)
  ctx.strokeStyle = gem
  ctx.lineWidth = 1.25
  ctx.stroke()
  drawUpgradeIcon(ctx, def.icon, x, orbY, 15)
  if (def.tier === 4 && pedestal.reveal > 0) drawTier4Reveal(ctx, x, orbY, pedestal.reveal, t)
  if (def.tier === 3 && pedestal.reveal > 0) drawTier3Sparkles(ctx, x, orbY, pedestal.reveal, t)
  ctx.globalAlpha = 1
}

export function drawUpgradeIcon(ctx: CanvasRenderingContext2D, icon: string, x: number, y: number, size: number): void {
  ctx.save()
  ctx.translate(x, y)
  const s = size
  if (icon === 'crumb') {
    ctx.fillStyle = '#d9cdc2'
    ctx.beginPath()
    ctx.moveTo(-s * 0.08, -s * 0.46)
    ctx.lineTo(s * 0.44, -s * 0.02)
    ctx.lineTo(s * 0.12, s * 0.42)
    ctx.lineTo(-s * 0.42, s * 0.16)
    ctx.closePath()
    ctx.fill()
  } else if (icon === 'splinter') {
    ctx.rotate(-0.7)
    ctx.fillStyle = '#f0b45a'
    ctx.fillRect(-s * 0.09, -s * 0.48, s * 0.18, s * 0.96)
    ctx.fillStyle = '#fff1d0'
    ctx.fillRect(-s * 0.03, -s * 0.36, s * 0.05, s * 0.28)
  } else if (icon === 'wick') {
    ctx.strokeStyle = '#9eb7d8'
    ctx.lineWidth = Math.max(1.6, s * 0.12)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(0, s * 0.42)
    ctx.quadraticCurveTo(s * 0.28, s * 0.05, 0, -s * 0.12)
    ctx.stroke()
    ctx.fillStyle = '#e7f1fb'
    ctx.beginPath()
    ctx.ellipse(0, -s * 0.3, s * 0.16, s * 0.22, 0, 0, TAU)
    ctx.fill()
  } else if (icon === 'coal') {
    ctx.fillStyle = '#ffe1a3'
    ctx.beginPath()
    ctx.moveTo(0, -s * 0.44)
    ctx.lineTo(s * 0.4, -s * 0.1)
    ctx.lineTo(s * 0.26, s * 0.38)
    ctx.lineTo(-s * 0.24, s * 0.4)
    ctx.lineTo(-s * 0.44, -s * 0.02)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#fffaf2'
    ctx.fillRect(-s * 0.06, -s * 0.06, s * 0.12, s * 0.12)
  } else if (icon === 'dawn') {
    ctx.fillStyle = '#fffaf2'
    ctx.beginPath()
    ctx.moveTo(0, -s * 0.5)
    ctx.lineTo(s * 0.12, -s * 0.12)
    ctx.lineTo(s * 0.5, 0)
    ctx.lineTo(s * 0.12, s * 0.12)
    ctx.lineTo(0, s * 0.5)
    ctx.lineTo(-s * 0.12, s * 0.12)
    ctx.lineTo(-s * 0.5, 0)
    ctx.lineTo(-s * 0.12, -s * 0.12)
    ctx.closePath()
    ctx.fill()
  } else {
    ctx.fillStyle = '#ffe1a3'
    ctx.beginPath()
    ctx.moveTo(0, -s * 0.4)
    ctx.lineTo(s * 0.4, 0)
    ctx.lineTo(0, s * 0.4)
    ctx.lineTo(-s * 0.4, 0)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

function drawTier2Glow(ctx: CanvasRenderingContext2D, x: number, y: number, reveal: number): void {
  const along = 1 - reveal / 0.9
  const alpha = Math.sin(Math.min(1, Math.max(0, along)) * Math.PI) * 0.16
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 34)
  glow.addColorStop(0, `rgba(168, 196, 230, ${alpha})`)
  glow.addColorStop(1, 'rgba(168, 196, 230, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(x, y, 34, 0, TAU)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x, y, 9, 0, TAU)
  ctx.strokeStyle = `rgba(186, 210, 236, ${alpha * 2.4})`
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawTier3Sparkles(ctx: CanvasRenderingContext2D, x: number, y: number, reveal: number, t: number): void {
  const burst = reveal > 0 ? reveal / 1.5 : 0
  const count = burst > 0.05 ? 12 : 5
  for (let i = 0; i < count; i++) {
    const ang = t * (burst > 0.05 ? 2.6 : 0.85) + (i * TAU) / count
    const orbit = 11 + (i % 3) * 4
    const extra = burst * (8 + (i % 4) * 6)
    const px = x + Math.cos(ang) * (orbit + extra)
    const py = y + Math.sin(ang) * (orbit + extra) * 0.7
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 6 + i * 1.7))
    ctx.globalAlpha = burst > 0.05 ? 0.5 + 0.5 * tw : 0.28 + 0.35 * tw
    ctx.fillStyle = i % 2 === 0 ? '#fffaf2' : '#ffe1a3'
    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(Math.PI / 4 + t * 0.4)
    const s = (burst > 0.05 ? 1.7 : 1.15) * (0.7 + tw * 0.5)
    ctx.fillRect(-s, -s, s * 2, s * 2)
    ctx.restore()
  }
  ctx.globalAlpha = 1
}

function drawTier4Reveal(ctx: CanvasRenderingContext2D, x: number, y: number, reveal: number, t: number): void {
  const life = Math.min(1, Math.max(0, reveal / 2))
  const fade = Math.sin(life * Math.PI)
  ctx.save()
  ctx.translate(x, y)
  const column = ctx.createLinearGradient(0, 8, 0, -78)
  column.addColorStop(0, `rgba(255, 250, 242, ${0.08 * fade})`)
  column.addColorStop(0.45, `rgba(255, 250, 242, ${0.55 * fade})`)
  column.addColorStop(1, 'rgba(255, 250, 242, 0)')
  ctx.fillStyle = column
  ctx.fillRect(-3.5, -78, 7, 86)
  ctx.rotate(t * 1.1)
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * TAU
    const len = 18 + fade * 34 + (i % 3) * 6
    ctx.globalAlpha = (0.25 + (i % 2) * 0.25) * fade
    ctx.strokeStyle = i % 3 === 0 ? '#fffaf2' : '#ffe7b0'
    ctx.lineWidth = i % 2 === 0 ? 1.6 : 1
    ctx.beginPath()
    ctx.moveTo(Math.cos(ang) * 7, Math.sin(ang) * 7)
    ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len)
    ctx.stroke()
  }
  ctx.restore()
  for (let ring = 0; ring < 2; ring++) {
    const pulse = (t * 0.85 + ring * 0.5) % 1
    ctx.beginPath()
    ctx.arc(x, y, 8 + pulse * 48, 0, TAU)
    ctx.strokeStyle = `rgba(255, 250, 242, ${(1 - pulse) * 0.75 * fade})`
    ctx.lineWidth = 1.6
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function drawChest(ctx: CanvasRenderingContext2D, x: number, y: number, opened: boolean, t: number): void {
  ctx.fillStyle = opened ? '#3a2a22' : '#6a3e28'
  ctx.fillRect(x - 12, y - 8, 24, 16)
  ctx.fillStyle = opened ? '#2a201c' : '#f0b45a'
  ctx.fillRect(x - 12, y - 10, 24, 5)
  if (!opened) {
    ctx.globalAlpha = 0.35 + Math.sin(t * 3) * 0.15
    ctx.fillStyle = '#ffe1a3'
    ctx.fillRect(x - 2, y - 4, 4, 8)
    ctx.globalAlpha = 1
  }
}

function drawStair(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  ctx.beginPath()
  ctx.arc(x, y, 16 + Math.sin(t * 3) * 1.5, 0, TAU)
  ctx.strokeStyle = 'rgba(255, 225, 163, 0.8)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#120e10'
  ctx.beginPath()
  ctx.arc(x, y, 8, 0, TAU)
  ctx.fill()
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  ctx.globalAlpha = Math.max(0, p.life / p.max)
  ctx.fillStyle = p.color
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size, 0, TAU)
  ctx.fill()
}

function drawGround(ctx: CanvasRenderingContext2D, px: number, py: number, w: number, h: number): void {
  const gap = 58
  const x0 = Math.floor((px - w / 2 - gap) / gap)
  const y0 = Math.floor((py - h / 2 - gap) / gap)
  const x1 = Math.floor((px + w / 2 + gap) / gap)
  const y1 = Math.floor((py + h / 2 + gap) / gap)
  for (let gx = x0; gx <= x1; gx++) {
    for (let gy = y0; gy <= y1; gy++) {
      const hsh = hash2(gx, gy)
      const jx = ((hsh & 255) / 255) * gap
      const jy = (((hsh >> 8) & 255) / 255) * gap
      const a = 0.035 + ((hsh >> 16) & 255) / 255 * 0.05
      ctx.fillStyle = `rgba(243, 230, 212, ${a})`
      ctx.fillRect(gx * gap + jx, gy * gap + jy, 1.6, 1.6)
    }
  }
}

function hash2(x: number, y: number): number {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return n >>> 0
}

function drawHazard(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, kind: 'pit' | 'bramble', t: number): void {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  if (kind === 'pit') {
    const grad = ctx.createRadialGradient(x, y, r * 0.2, x, y, r)
    grad.addColorStop(0, 'rgba(20, 40, 70, 0.55)')
    grad.addColorStop(1, 'rgba(8, 16, 28, 0.15)')
    ctx.fillStyle = grad
    ctx.fill()
  } else {
    ctx.fillStyle = 'rgba(120, 36, 18, 0.22)'
    ctx.fill()
    ctx.strokeStyle = `rgba(180, 60, 30, ${0.25 + Math.sin(t * 3) * 0.08})`
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

function drawSpark(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  const flick = 0.85 + Math.sin(t * 9 + x) * 0.15
  ctx.fillStyle = `rgba(255, 186, 80, ${0.85 * flick})`
  ctx.beginPath()
  ctx.arc(x, y, 2.4 * flick, 0, TAU)
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 244, 220, 0.9)'
  ctx.beginPath()
  ctx.arc(x, y - 0.4, 1.1, 0, TAU)
  ctx.fill()
}

function drawWarning(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ang: number,
  len: number,
  life: number,
  thin: boolean,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  ctx.strokeStyle = thin ? `rgba(255, 80, 50, ${0.35 + (1 - life) * 0.45})` : `rgba(246, 220, 180, ${0.25 + (1 - life) * 0.4})`
  ctx.lineWidth = thin ? 1.25 : 2.5
  ctx.setLineDash(thin ? [3, 6] : [6, 8])
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(len, 0)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

function drawBeam(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ang: number,
  len: number,
  width: number,
  life: number,
  color: string,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  ctx.globalAlpha = Math.max(0.2, life)
  const fadeAt = 0.58
  const body = ctx.createLinearGradient(0, 0, len, 0)
  body.addColorStop(0, color)
  body.addColorStop(fadeAt, color)
  body.addColorStop(1, clearTint(color))
  ctx.fillStyle = body
  ctx.fillRect(0, -width / 2, len, width)
  const core = ctx.createLinearGradient(0, 0, len, 0)
  core.addColorStop(0, 'rgba(255, 244, 230, 0.9)')
  core.addColorStop(fadeAt, 'rgba(255, 244, 230, 0.65)')
  core.addColorStop(1, 'rgba(255, 244, 230, 0)')
  ctx.fillStyle = core
  ctx.fillRect(0, -0.6, len, 1.2)
  ctx.restore()
  ctx.globalAlpha = 1
}

function clearTint(color: string): string {
  const match = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/)
  if (!match) return 'rgba(255, 70, 48, 0)'
  return `rgba(${match[1]}, ${match[2]}, ${match[3]}, 0)`
}

function drawDecor(ctx: CanvasRenderingContext2D, d: Decor, t: number): void {
  const x = Math.cos(d.spin + t * d.speed) * d.dist
  const y = Math.sin(d.spin + t * d.speed) * d.dist * d.yScale
  drawSpark(ctx, x, y - 10, t)
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, t: number): void {
  const fading = e.arrive < 1
  if (fading) {
    ctx.save()
    ctx.globalAlpha *= e.arrive
  }
  if (e.kind === 'boss') drawBoss(ctx, e, t)
  else drawShadow(ctx, e, t, e.kind === 'cinder')
  if (fading) ctx.restore()
}

function drawShadow(ctx: CanvasRenderingContext2D, e: Enemy, t: number, red: boolean): void {
  const flash = e.flash > 0
  ctx.beginPath()
  ctx.arc(e.x, e.y, e.r * 1.8, 0, TAU)
  ctx.fillStyle = red ? 'rgba(80, 10, 8, 0.28)' : 'rgba(10, 8, 10, 0.35)'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(e.x, e.y, e.r, 0, TAU)
  ctx.fillStyle = flash ? '#f6efe4' : red ? '#6a1a14' : '#161214'
  ctx.fill()
  ctx.strokeStyle = red ? 'rgba(255, 90, 60, 0.55)' : 'rgba(80, 70, 74, 0.8)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  const blink = Math.sin(t * 2.2 + e.id) > 0.92
  const eye = blink ? 0.45 : 3
  ctx.strokeStyle = red ? '#ffb0a4' : '#ff5a4a'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(e.x - e.r * 0.55, e.y - e.r * 0.42)
  ctx.lineTo(e.x - e.r * 0.12, e.y - e.r * 0.22)
  ctx.moveTo(e.x + e.r * 0.55, e.y - e.r * 0.42)
  ctx.lineTo(e.x + e.r * 0.12, e.y - e.r * 0.22)
  ctx.stroke()
  ctx.fillStyle = red ? '#ffd0c8' : '#ff3b32'
  ctx.shadowColor = '#ff2a22'
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.ellipse(e.x - e.r * 0.32, e.y - e.r * 0.02, eye * 0.72, eye, 0.4, 0, TAU)
  ctx.ellipse(e.x + e.r * 0.32, e.y - e.r * 0.02, eye * 0.72, eye, -0.4, 0, TAU)
  ctx.fill()
  ctx.shadowBlur = 0
}

function drawBoss(ctx: CanvasRenderingContext2D, e: Enemy, t: number): void {
  const shut = e.eyes > 0
  ctx.beginPath()
  ctx.arc(e.x, e.y, e.r * 1.35, 0, TAU)
  ctx.fillStyle = 'rgba(8, 6, 8, 0.4)'
  ctx.fill()
  if (!shut) {
    const n = Math.max(1, e.spikes.length)
    e.spikes.forEach((slot, i) => {
      const aimed = e.mode === 2 && slot.warn > 0
      const grow = slot.cool > 0 ? Math.max(0, 1 - slot.cool / 1.85) : 1
      if (e.mode !== 2 && grow < 0.06) return
      const ang = e.mode === 2 ? slot.show : e.aim + (i / n) * TAU
      const len = e.r * (0.72 + (aimed ? 1 : grow) * 0.55)
      ctx.save()
      ctx.translate(e.x, e.y)
      ctx.rotate(ang)
      ctx.beginPath()
      ctx.moveTo(e.r * 0.46, -3.2)
      ctx.lineTo(e.r * 0.5 + len, -1.4)
      ctx.lineTo(e.r * 0.5 + len + 7, 0)
      ctx.lineTo(e.r * 0.5 + len, 1.4)
      ctx.lineTo(e.r * 0.46, 3.2)
      ctx.closePath()
      ctx.fillStyle = i % 2 === 0 ? '#e4dcd4' : '#9a8e84'
      ctx.fill()
      ctx.restore()
    })
  }
  ctx.beginPath()
  ctx.arc(e.x, e.y, e.r, 0, TAU)
  ctx.fillStyle = e.flash > 0 ? '#f6efe4' : '#120e10'
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = shut ? 'rgba(240, 180, 90, 0.45)' : 'rgba(246, 239, 228, 0.35)'
  ctx.stroke()
  const eye = shut ? 0.7 : 4.2 + Math.sin(t * 3) * 0.3
  ctx.fillStyle = shut ? '#5a4038' : '#ff2a22'
  ctx.shadowColor = shut ? 'transparent' : '#ff2a22'
  ctx.shadowBlur = shut ? 0 : 14
  ctx.beginPath()
  ctx.ellipse(e.x - e.r * 0.28, e.y - e.r * 0.02, eye, eye * 0.72, 0, 0, TAU)
  ctx.ellipse(e.x + e.r * 0.28, e.y - e.r * 0.02, eye, eye * 0.72, 0, 0, TAU)
  ctx.fill()
  ctx.shadowBlur = 0
  if (!shut) {
    ctx.strokeStyle = 'rgba(255, 60, 40, 0.7)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(e.x, e.y + e.r * 0.22, e.r * 0.18, 0.2, Math.PI - 0.2)
    ctx.stroke()
  }
}

function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet): void {
  const ang = Math.atan2(b.vy, b.vx)
  ctx.save()
  ctx.translate(b.x, b.y)
  ctx.rotate(ang)
  if (b.fade > 0) {
    const along = Math.max(0, b.fade / 0.14)
    ctx.globalAlpha = along
    ctx.scale(0.65 + 0.35 * along, 0.65 + 0.35 * along)
  }
  if (b.friendly) {
    const span = b.max > 0 ? b.life / b.max : 1
    const fade = span > 0.34 ? 1 : Math.max(0, span / 0.34)
    ctx.globalAlpha = fade
    const shrink = 0.7 + 0.3 * fade
    ctx.scale(shrink, shrink)
    const len = 8 + b.r * 1.6
    const grad = ctx.createLinearGradient(-len, 0, b.r, 0)
    grad.addColorStop(0, 'rgba(255, 170, 70, 0)')
    grad.addColorStop(0.55, 'rgba(255, 186, 90, 0.85)')
    grad.addColorStop(1, 'rgba(255, 248, 236, 0.95)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(0, 0, len, Math.max(1.4, b.r * 0.55), 0, 0, TAU)
    ctx.fill()
    ctx.fillStyle = '#fff8ee'
    ctx.beginPath()
    ctx.arc(len * 0.45, 0, Math.max(1.3, b.r * 0.42), 0, TAU)
    ctx.fill()
  } else {
    const len = 11 + b.r * 2.4
    ctx.fillStyle = '#f4ebe3'
    ctx.beginPath()
    ctx.moveTo(len, 0)
    ctx.lineTo(-len * 0.42, 3.6)
    ctx.lineTo(-len * 0.16, 0)
    ctx.lineTo(-len * 0.42, -3.6)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

function drawFlame(ctx: CanvasRenderingContext2D, g: Game, wall: number, x: number, y: number): void {
  const heat = g.maxHeat <= 0 ? 0 : Math.max(0, g.heat) / g.maxHeat
  let scale = 14 + heat * 8
  let catchU = 0
  if (g.rekindle > 0 && g.rekindleMax > 0) {
    catchU = 1 - g.rekindle / g.rekindleMax
    scale *= 1 + Math.sin(Math.min(1, catchU) * Math.PI) * 0.72
  }
  if (g.state === 'dying' || g.state === 'dead') scale *= Math.max(0, g.snuff)
  if (scale < 0.5) return
  if (g.iframes > 0 && Math.sin(wall * 42) > 0.2 && catchU <= 0) ctx.globalAlpha = 0.55
  if (catchU > 0) drawCatch(ctx, x, y, catchU)
  flame(ctx, x, y, scale, wall)
  if (catchU > 0) {
    const swell = Math.sin(Math.min(1, catchU) * Math.PI)
    ctx.save()
    ctx.globalAlpha = 0.35 + swell * 0.55
    ctx.fillStyle = '#fffaf2'
    ctx.beginPath()
    ctx.ellipse(x, y - scale * 0.45, scale * 0.2, scale * 0.62, 0, 0, TAU)
    ctx.fill()
    ctx.restore()
  }
  ctx.globalAlpha = 1
}

function drawCatch(ctx: CanvasRenderingContext2D, x: number, y: number, u: number): void {
  const fade = 1 - u
  const flash = Math.max(0, 1 - u * 1.35)
  if (flash > 0) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 86)
    glow.addColorStop(0, `rgba(255, 250, 240, ${0.55 * flash})`)
    glow.addColorStop(0.45, `rgba(255, 170, 60, ${0.28 * flash})`)
    glow.addColorStop(1, 'rgba(255, 120, 30, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, 86, 0, TAU)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(x, y, 16 + u * 108, 0, TAU)
  ctx.strokeStyle = `rgba(255, 214, 150, ${0.72 * fade})`
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x, y - 4, 8 + u * 52, 0, TAU)
  ctx.strokeStyle = `rgba(255, 250, 236, ${0.5 * fade})`
  ctx.lineWidth = 1.6
  ctx.stroke()
}

function flame(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number): void {
  const flick = Math.sin(t * 18) * 0.08 + Math.sin(t * 31) * 0.05
  const h = s * (1 + flick)
  const glow = ctx.createRadialGradient(x, y - h * 0.2, 0, x, y, h * 2.2)
  glow.addColorStop(0, 'rgba(255, 244, 220, 0.9)')
  glow.addColorStop(0.32, 'rgba(255, 140, 48, 0.42)')
  glow.addColorStop(1, 'rgba(255, 70, 10, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(x, y - h * 0.1, h * 2, 0, TAU)
  ctx.fill()
  ctx.save()
  ctx.translate(x, y)
  ctx.beginPath()
  ctx.moveTo(0, -h * 1.65)
  ctx.bezierCurveTo(h * 0.55, -h * 0.75, h * 0.42, -h * 0.05, h * 0.26, h * 0.16)
  ctx.bezierCurveTo(h * 0.08, h * 0.42, -h * 0.08, h * 0.42, -h * 0.26, h * 0.16)
  ctx.bezierCurveTo(-h * 0.48, -h * 0.1, -h * 0.42, -h * 0.8, 0, -h * 1.65)
  ctx.fillStyle = '#ffb15a'
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(0, -h * 0.15, h * 0.18, h * 0.5, 0, 0, TAU)
  ctx.fillStyle = '#fff8ee'
  ctx.fill()
  ctx.restore()
}

function drawMarkers(ctx: CanvasRenderingContext2D, g: Game, w: number, h: number): void {
  let shown = 0
  for (const e of g.enemies) {
    if (e.dead) continue
    const dx = e.x - g.player.x
    const dy = e.y - g.player.y
    if (Math.abs(dx) < w / 2 - 36 && Math.abs(dy) < h / 2 - 36) continue
    if (shown++ > 8) break
    const ang = Math.atan2(dy, dx)
    const x = w / 2 + Math.cos(ang) * (Math.min(w, h) * 0.42)
    const y = h / 2 + Math.sin(ang) * (Math.min(w, h) * 0.38)
    ctx.fillStyle = e.kind === 'cinder' ? '#ff4d3a' : e.kind === 'boss' ? '#f6efe4' : '#8a7c76'
    ctx.beginPath()
    ctx.arc(x, y, e.kind === 'boss' ? 5 : 3, 0, TAU)
    ctx.fill()
  }
}

function drawVignette(ctx: CanvasRenderingContext2D, g: Game, w: number, h: number): void {
  const heat = g.maxHeat <= 0 ? 0 : Math.max(0, g.heat) / g.maxHeat
  const cold = Math.max(0, 0.42 - heat)
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.18, w / 2, h / 2, Math.max(w, h) * 0.68)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, cold > 0.04 ? `rgba(8, 22, 38, ${0.22 + cold * 0.6})` : 'rgba(0,0,0,0.22)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)
}

function drawStick(ctx: CanvasRenderingContext2D, steer: SteerWidget): void {
  ctx.beginPath()
  ctx.arc(steer.ox, steer.oy, 58, 0, TAU)
  ctx.strokeStyle = 'rgba(246, 239, 228, 0.22)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(steer.ox + steer.ax * 40, steer.oy + steer.ay * 40, 16, 0, TAU)
  ctx.fillStyle = 'rgba(255, 122, 48, 0.4)'
  ctx.fill()
}
