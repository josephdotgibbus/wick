import { lightOf } from './content.ts'
import type { Bullet, Decor, Enemy, Game, Obstacle, Particle } from './types.ts'

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
  const light = lightOf(g.heat, g.mods.maxHeat, g.mods.light)
  const menu = g.state === 'menu' || g.state === 'steer'
  const camY = menu ? h * 0.2 : h / 2

  ctx.save()
  ctx.translate(w / 2 + sx, camY + sy)
  ctx.translate(-g.player.x, -g.player.y)

  drawGround(ctx, g.player.x, g.player.y, w, h)
  if (!menu) {
    drawPool(ctx, g, light)
    for (const chunk of g.chunks.values()) {
      for (const o of chunk.obstacles) drawStone(ctx, o)
      for (const hz of chunk.hazards) drawHazard(ctx, hz.x, hz.y, hz.r, hz.kind, view.wall)
      for (const s of chunk.sparks) if (!s.taken) drawSpark(ctx, s.x, s.y, view.wall)
    }
    for (const o of g.extras) drawStone(ctx, o)
    for (const hz of g.extraHazards) drawHazard(ctx, hz.x, hz.y, hz.r, hz.kind, view.wall)
    for (const p of g.patches) drawPatch(ctx, p.x, p.y, p.r, p.life / p.max)
    for (const s of g.sparks) if (!s.taken) drawSpark(ctx, s.x, s.y, view.wall)
  }
  for (const wline of g.warnings) drawWarning(ctx, wline.x, wline.y, wline.ang, wline.len, wline.life / wline.max, wline.thin)
  for (const beam of g.beams) drawBeam(ctx, beam.x, beam.y, beam.ang, beam.len, beam.width, beam.life / beam.max, beam.color)
  for (const p of g.particles) if (p.behind) drawParticle(ctx, p)
  ctx.globalAlpha = 1
  if (menu) {
    for (const d of g.decor) drawDecor(ctx, d, g.menuT)
  }
  for (const e of g.enemies) drawEnemy(ctx, e, view.wall)
  for (const b of g.bullets) drawBullet(ctx, b)
  drawOrbit(ctx, g)
  if (g.mods.haloDps > 0) {
    ctx.beginPath()
    ctx.arc(g.player.x, g.player.y, light, 0, TAU)
    ctx.strokeStyle = 'rgba(255, 140, 60, 0.32)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 7])
    ctx.stroke()
    ctx.setLineDash([])
  }
  drawFlame(ctx, g, view.wall)
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
  ctx.restore()

  if (!menu) drawMarkers(ctx, g, w, h)
  drawVignette(ctx, g, w, h)
  if (g.slip && g.state === 'playing') {
    ctx.fillStyle = 'rgba(180, 200, 220, 0.04)'
    ctx.fillRect(0, 0, w, h)
  }
  if (g.hurtFlash > 0) {
    ctx.fillStyle = `rgba(255, 244, 230, ${Math.min(0.35, g.hurtFlash)})`
    ctx.fillRect(0, 0, w, h)
  }
  if (g.state === 'dying' || g.state === 'dead') {
    const a = g.state === 'dead' ? 0.38 : (1 - g.snuff) * 0.45
    ctx.fillStyle = `rgba(6, 8, 12, ${a})`
    ctx.fillRect(0, 0, w, h)
  }
  if (view.steer && g.control === 'mouse') drawStick(ctx, view.steer)
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

function drawPool(ctx: CanvasRenderingContext2D, g: Game, light: number): void {
  const pool = ctx.createRadialGradient(g.player.x, g.player.y, light * 0.08, g.player.x, g.player.y, light * 1.65)
  pool.addColorStop(0, 'rgba(255, 120, 40, 0.16)')
  pool.addColorStop(0.5, 'rgba(120, 36, 8, 0.05)')
  pool.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = pool
  ctx.beginPath()
  ctx.arc(g.player.x, g.player.y, light * 1.65, 0, TAU)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(g.player.x, g.player.y, light, 0, TAU)
  ctx.strokeStyle = 'rgba(255, 170, 90, 0.14)'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 8])
  ctx.stroke()
  ctx.setLineDash([])
}

function drawStone(ctx: CanvasRenderingContext2D, o: Obstacle): void {
  ctx.beginPath()
  ctx.arc(o.x, o.y, o.r, 0, TAU)
  ctx.fillStyle = '#1a1614'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(246, 239, 228, 0.16)'
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(o.x - o.r * 0.25, o.y - o.r * 0.3, o.r * 0.22, 0, TAU)
  ctx.fillStyle = 'rgba(246, 239, 228, 0.05)'
  ctx.fill()
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

function drawPatch(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fade: number): void {
  ctx.fillStyle = `rgba(255, 92, 24, ${0.16 * Math.min(1, fade * 1.4)})`
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
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
      const aimed = slot.warn > 0
      const grow = slot.cool > 0 ? Math.max(0, 1 - slot.cool / 1.85) : 1
      if (!aimed && grow < 0.06) return
      const ang = aimed ? slot.ang : e.aim + (i / n) * TAU
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

function drawOrbit(ctx: CanvasRenderingContext2D, g: Game): void {
  const n = g.mods.orbit
  if (n <= 0) return
  const radius = 40
  for (let i = 0; i < n; i++) {
    const ang = g.orbitAng + (i / n) * TAU
    const x = g.player.x + Math.cos(ang) * radius
    const y = g.player.y + Math.sin(ang) * radius
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.fillStyle = '#f4ebe3'
    ctx.beginPath()
    ctx.moveTo(8, 0)
    ctx.lineTo(-5, 3.2)
    ctx.lineTo(-2, 0)
    ctx.lineTo(-5, -3.2)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
}

function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet): void {
  const ang = Math.atan2(b.vy, b.vx)
  ctx.save()
  ctx.translate(b.x, b.y)
  ctx.rotate(ang)
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

function drawFlame(ctx: CanvasRenderingContext2D, g: Game, wall: number): void {
  const heat = g.mods.maxHeat <= 0 ? 0 : Math.max(0, g.heat) / g.mods.maxHeat
  let scale = 14 + heat * 8
  if (g.state === 'dying' || g.state === 'dead') scale *= Math.max(0, g.snuff)
  if (scale < 0.5) return
  if (g.iframes > 0 && Math.sin(wall * 42) > 0.2) ctx.globalAlpha = 0.55
  flame(ctx, g.player.x, g.player.y, scale, wall)
  ctx.globalAlpha = 1
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
