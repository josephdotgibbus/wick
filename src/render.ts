import { KIND_COLOR, lightOf } from './content.ts'
import type { Decor, Enemy, Game } from './types.ts'

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
  const light = lightOf(g.heat, g.mods.maxHeat, g.mods.light, g.inferno > 0)

  const camY = g.state === 'menu' ? h * 0.2 : h / 2
  ctx.save()
  ctx.translate(w / 2 + sx, camY + sy)
  ctx.translate(-g.player.x, -g.player.y)

  drawGround(ctx, g.player.x, g.player.y, w, h)
  drawPool(ctx, g, light)
  for (const p of g.patches) drawPatch(ctx, p.x, p.y, p.r, p.life / p.max)
  for (const n of g.novas) drawNova(ctx, n.x, n.y, n.r, n.life / n.max)
  for (const ring of g.rings) drawRing(ctx, ring.x, ring.y, ring.r, ring.thick, ring.life)
  for (const em of g.embers) drawEmber(ctx, em.x, em.y, 3.1, view.wall + em.x)
  if (g.state === 'menu') {
    for (const d of g.decor) drawDecor(ctx, d, g.menuT)
  }
  for (const e of g.enemies) drawEnemy(ctx, e, g, light, view.wall)
  for (const a of g.arcs) drawArc(ctx, a.x1, a.y1, a.x2, a.y2, a.life / a.max)
  for (const b of g.bullets) drawBullet(ctx, b.x, b.y, b.vx, b.vy)
  for (const beam of g.beams) drawBeam(ctx, beam.x, beam.y, beam.ang, beam.len, beam.width, beam.life / beam.max)
  drawBlaze(ctx, g, view.wall)
  drawFlame(ctx, g, view.wall)
  drawWisps(ctx, g, view.wall)
  ctx.globalAlpha = 1
  for (const p of g.particles) {
    const a = Math.max(0, p.life / p.max)
    ctx.globalAlpha = a
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, TAU)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  for (const f of g.floaters) {
    ctx.globalAlpha = Math.max(0, f.life / f.max)
    ctx.fillStyle = f.color
    ctx.font = '600 15px "Outfit Variable", Outfit, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(f.text, f.x, f.y)
  }
  ctx.globalAlpha = 1
  if (g.combo >= 2 && g.state !== 'menu' && g.state !== 'dead') {
    ctx.fillStyle = 'rgba(255, 241, 220, 0.92)'
    ctx.font = '560 20px "Fraunces Variable", Georgia, serif'
    ctx.textAlign = 'left'
    ctx.fillText(`×${g.combo}`, g.player.x + 24, g.player.y - 22)
  }
  ctx.restore()

  drawMarkers(ctx, g, w, h)
  drawVignette(ctx, g, w, h)
  if (g.hurtFlash > 0) {
    ctx.fillStyle = `rgba(255, 244, 230, ${Math.min(0.35, g.hurtFlash)})`
    ctx.fillRect(0, 0, w, h)
  }
  if (g.state === 'dying' || g.state === 'dead') {
    const a = g.state === 'dead' ? 0.38 : (1 - g.snuff) * 0.45
    ctx.fillStyle = `rgba(6, 8, 12, ${a})`
    ctx.fillRect(0, 0, w, h)
  }
  if (view.steer) drawStick(ctx, view.steer)
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

function drawPool(ctx: CanvasRenderingContext2D, g: Game, light: number): void {
  const pool = ctx.createRadialGradient(g.player.x, g.player.y, light * 0.08, g.player.x, g.player.y, light * 1.65)
  if (g.inferno > 0) {
    pool.addColorStop(0, 'rgba(255, 236, 200, 0.28)')
    pool.addColorStop(0.45, 'rgba(255, 140, 50, 0.1)')
  } else {
    pool.addColorStop(0, 'rgba(255, 120, 40, 0.16)')
    pool.addColorStop(0.5, 'rgba(120, 36, 8, 0.05)')
  }
  pool.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = pool
  ctx.beginPath()
  ctx.arc(g.player.x, g.player.y, light * 1.65, 0, TAU)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(g.player.x, g.player.y, light, 0, TAU)
  ctx.strokeStyle = g.inferno > 0 ? 'rgba(255, 244, 220, 0.28)' : 'rgba(255, 170, 90, 0.14)'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 8])
  ctx.stroke()
  ctx.setLineDash([])
}

function drawPatch(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fade: number): void {
  ctx.fillStyle = `rgba(255, 92, 24, ${0.16 * Math.min(1, fade * 1.4)})`
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fill()
}

function drawNova(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, life: number): void {
  const k = 1 - life
  ctx.beginPath()
  ctx.arc(x, y, r * (0.25 + 0.75 * k), 0, TAU)
  ctx.strokeStyle = `rgba(255, 214, 160, ${life})`
  ctx.lineWidth = 3
  ctx.stroke()
}

function drawRing(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, thick: number, life: number): void {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.strokeStyle = `rgba(170, 220, 236, ${Math.min(0.85, life)})`
  ctx.lineWidth = thick
  ctx.stroke()
}

function drawEmber(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, t: number): void {
  const flick = 0.82 + Math.sin(t * 14) * 0.18
  ctx.fillStyle = 'rgba(255, 150, 50, 0.28)'
  ctx.beginPath()
  ctx.arc(x, y, size * 2.1 * flick, 0, TAU)
  ctx.fill()
  ctx.fillStyle = '#ffe7c4'
  ctx.beginPath()
  ctx.moveTo(x, y - size * flick)
  ctx.lineTo(x + size * 0.55, y)
  ctx.lineTo(x, y + size * 0.72)
  ctx.lineTo(x - size * 0.55, y)
  ctx.closePath()
  ctx.fill()
}

function drawDecor(ctx: CanvasRenderingContext2D, d: Decor, t: number): void {
  const a = t * d.speed + d.spin
  drawEmber(ctx, Math.cos(a) * d.dist, Math.sin(a) * d.dist * d.yScale, d.size, t + d.spin)
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, g: Game, light: number, wall: number): void {
  const dist = Math.hypot(e.x - g.player.x, e.y - g.player.y)
  let alpha = visibility(dist, light)
  if (e.kind === 'shade') alpha = Math.max(alpha, 0.55)
  ctx.save()
  ctx.globalAlpha = alpha
  const color = e.flash > 0.04 ? '#fff8f0' : KIND_COLOR[e.kind]
  ctx.fillStyle = color
  ctx.strokeStyle = color
  if (e.kind === 'mote') {
    ctx.beginPath()
    ctx.arc(e.x, e.y, e.r, 0, TAU)
    ctx.fill()
  } else if (e.kind === 'ashling') {
    poly(ctx, e.x, e.y, e.r * 1.15, 4, Math.PI / 4)
    ctx.fill()
  } else if (e.kind === 'warden') {
    poly(ctx, e.x, e.y, e.r, 6, wall * 0.2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(20, 14, 12, 0.45)'
    ctx.lineWidth = 2
    ctx.stroke()
  } else if (e.kind === 'leech') {
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(e.x, e.y, e.r, 0.4, TAU - 0.2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(e.x, e.y, 2.2, 0, TAU)
    ctx.fill()
  } else if (e.kind === 'popper') {
    star(ctx, e.x, e.y, e.r * 0.55, e.r * 1.25, 8)
    ctx.fill()
  } else if (e.kind === 'shade') {
    const wob = Math.sin(wall * 6 + e.id) * 3
    ctx.beginPath()
    ctx.arc(e.x + wob, e.y, e.r * 0.85, 0, TAU)
    ctx.arc(e.x - 4, e.y + 3, e.r * 0.55, 0, TAU)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.arc(e.x, e.y, e.r, 0, TAU)
    ctx.fillStyle = '#140e0c'
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = e.flash > 0.04 ? '#fff' : '#d7eef8'
    ctx.stroke()
    ctx.save()
    ctx.translate(e.x, e.y)
    ctx.rotate(wall * 0.6)
    ctx.strokeStyle = 'rgba(215, 238, 248, 0.7)'
    ctx.lineWidth = 2
    for (let i = 0; i < 4; i++) {
      ctx.rotate(TAU / 4)
      ctx.beginPath()
      ctx.moveTo(e.r + 4, 0)
      ctx.lineTo(e.r + 12, 0)
      ctx.stroke()
    }
    ctx.restore()
  }
  if (e.elite) {
    ctx.beginPath()
    ctx.arc(e.x, e.y, e.r + 5, 0, TAU)
    ctx.strokeStyle = 'rgba(242, 193, 78, 0.8)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
  if (e.hp < e.maxHp && (e.kind === 'boss' || e.kind === 'warden' || e.elite)) {
    const wbar = e.r * 2.2
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(e.x - wbar / 2, e.y - e.r - 10, wbar, 3)
    ctx.fillStyle = e.kind === 'boss' ? '#d7eef8' : '#ffb15a'
    ctx.fillRect(e.x - wbar / 2, e.y - e.r - 10, wbar * Math.max(0, e.hp / e.maxHp), 3)
  }
  ctx.restore()
}

function visibility(dist: number, light: number): number {
  const edge = light * 1.05
  if (dist < edge) return 1
  const t = Math.min(1, (dist - edge) / (light + 180))
  return 1 - t * 0.72
}

function poly(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, sides: number, rot: number): void {
  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * TAU
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, inner: number, outer: number, points: number): void {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = -Math.PI / 2 + (i / (points * 2)) * TAU
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function drawArc(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, life: number): void {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  const mx = (x1 + x2) / 2 + 10
  const my = (y1 + y2) / 2 - 12
  ctx.quadraticCurveTo(mx, my, x2, y2)
  ctx.strokeStyle = `rgba(255, 226, 190, ${life})`
  ctx.lineWidth = 2
  ctx.stroke()
}

function drawBullet(ctx: CanvasRenderingContext2D, x: number, y: number, vx: number, vy: number): void {
  ctx.strokeStyle = '#fff4e4'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x - vx * 0.03, y - vy * 0.03)
  ctx.stroke()
}

function drawBeam(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ang: number,
  len: number,
  width: number,
  life: number,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  ctx.globalAlpha = life
  const grad = ctx.createLinearGradient(0, 0, len, 0)
  grad.addColorStop(0, 'rgba(255, 250, 240, 0.95)')
  grad.addColorStop(0.65, 'rgba(255, 170, 80, 0.45)')
  grad.addColorStop(1, 'rgba(255, 120, 40, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, -width / 2, len, width)
  ctx.restore()
}

function drawBlaze(ctx: CanvasRenderingContext2D, g: Game, wall: number): void {
  if (g.state === 'menu') return
  const r = 28
  ctx.beginPath()
  if (g.inferno > 0) {
    ctx.arc(g.player.x, g.player.y, r, 0, TAU)
    ctx.strokeStyle = `rgba(255, 244, 220, ${0.45 + Math.sin(wall * 16) * 0.25})`
    ctx.lineWidth = 2.5
  } else if (g.blaze > 0.02) {
    ctx.arc(g.player.x, g.player.y, r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, g.blaze))
    ctx.strokeStyle = 'rgba(255, 196, 120, 0.9)'
    ctx.lineWidth = 2
  } else return
  ctx.stroke()
}

function drawFlame(ctx: CanvasRenderingContext2D, g: Game, wall: number): void {
  const heat = g.mods.maxHeat <= 0 ? 0 : Math.max(0, g.heat) / g.mods.maxHeat
  let scale = 14 + heat * 8
  if (g.inferno > 0) scale += 6
  if (g.state === 'dying' || g.state === 'dead') scale *= Math.max(0, g.snuff)
  if (scale < 0.5) return
  if (g.iframes > 0 && Math.sin(wall * 42) > 0.2) ctx.globalAlpha = 0.55
  flame(ctx, g.player.x, g.player.y, scale, wall, g.inferno > 0)
  ctx.globalAlpha = 1
}

function drawWisps(ctx: CanvasRenderingContext2D, g: Game, wall: number): void {
  if (g.state === 'menu' || g.state === 'dead') return
  const n = g.mods.wisps
  if (n <= 0 || g.snuff <= 0) return
  for (let i = 0; i < n; i++) {
    const ang = g.orbit + (i / n) * TAU
    const x = g.player.x + Math.cos(ang) * 34
    const y = g.player.y + Math.sin(ang) * 34
    flame(ctx, x, y, g.inferno > 0 ? 7 : 5.5, wall + i, g.inferno > 0)
  }
}

function flame(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, inferno: boolean): void {
  const flick = Math.sin(t * 18) * 0.08 + Math.sin(t * 31) * 0.05
  const h = s * (1 + flick)
  const glow = ctx.createRadialGradient(x, y - h * 0.2, 0, x, y, h * 2.2)
  if (inferno) {
    glow.addColorStop(0, 'rgba(255, 252, 240, 0.95)')
    glow.addColorStop(0.35, 'rgba(255, 210, 150, 0.45)')
    glow.addColorStop(1, 'rgba(255, 140, 40, 0)')
  } else {
    glow.addColorStop(0, 'rgba(255, 244, 220, 0.9)')
    glow.addColorStop(0.32, 'rgba(255, 140, 48, 0.42)')
    glow.addColorStop(1, 'rgba(255, 70, 10, 0)')
  }
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
  ctx.fillStyle = inferno ? '#fffaf2' : '#ffb15a'
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(0, -h * 0.15, h * 0.18, h * 0.5, 0, 0, TAU)
  ctx.fillStyle = '#fff8ee'
  ctx.fill()
  ctx.restore()
}

function drawMarkers(ctx: CanvasRenderingContext2D, g: Game, w: number, h: number): void {
  if (g.state === 'menu') return
  const off: { dx: number; dy: number; d: number; kind: Enemy['kind'] }[] = []
  for (const e of g.enemies) {
    const dx = e.x - g.player.x
    const dy = e.y - g.player.y
    if (Math.abs(dx) < w / 2 - 30 && Math.abs(dy) < h / 2 - 30) continue
    off.push({ dx, dy, d: Math.hypot(dx, dy), kind: e.kind })
  }
  off.sort((a, b) => a.d - b.d)
  const hw = w / 2 - 18
  const hh = h / 2 - 18
  for (const o of off.slice(0, 8)) {
    if (o.dx === 0 && o.dy === 0) continue
    const s = Math.min(hw / Math.abs(o.dx), hh / Math.abs(o.dy))
    const x = w / 2 + o.dx * s
    const y = h / 2 + o.dy * s
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(Math.atan2(o.dy, o.dx))
    ctx.fillStyle = KIND_COLOR[o.kind]
    ctx.globalAlpha = o.kind === 'boss' ? 0.95 : 0.7
    ctx.beginPath()
    ctx.moveTo(7, 0)
    ctx.lineTo(-5, 4.5)
    ctx.lineTo(-5, -4.5)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
}

function drawVignette(ctx: CanvasRenderingContext2D, g: Game, w: number, h: number): void {
  const heat = g.mods.maxHeat <= 0 ? 0 : Math.max(0, g.heat) / g.mods.maxHeat
  const cold = Math.max(0, 0.42 - heat)
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.18, w / 2, h / 2, Math.max(w, h) * 0.68)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, cold > 0.04 ? `rgba(8, 22, 38, ${0.38 + cold})` : 'rgba(0,0,0,0.48)')
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
