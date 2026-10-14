import { BLESSINGS, activeSynergies, blessingById, buildPhrase, roman } from './content.ts'
import { formatScore, formatTime } from './format.ts'
import { dailyKey, dailySeed, formatSeed } from './rng.ts'
import type { Save } from './storage.ts'
import { todayBest } from './storage.ts'
import type { Game } from './types.ts'

export interface Session {
  fresh: string[]
  record: boolean
  dailyRecord: boolean
}

export interface Actions {
  play: () => void
  daily: () => void
  seed: (raw: string) => void
  again: () => void
  fresh: () => void
  menu: () => void
  pick: (index: number) => void
  resume: () => void
  giveUp: () => void
  toggleMute: () => void
  blessing: (id: string) => void
  burst: () => void
}

let bound: Actions | null = null

export function mount(actions: Actions): void {
  bound = actions
  byId('play').addEventListener('click', actions.play)
  byId('daily').addEventListener('click', actions.daily)
  byId('again').addEventListener('click', actions.again)
  byId('fresh').addEventListener('click', actions.fresh)
  byId('to-menu').addEventListener('click', actions.menu)
  byId('resume').addEventListener('click', actions.resume)
  byId('pause-btn').addEventListener('click', actions.resume)
  byId('give-up').addEventListener('click', actions.giveUp)
  byId('mute').addEventListener('click', actions.toggleMute)
  for (const id of ['burst', 'keycap']) {
    byId(id).addEventListener('pointerdown', (event) => {
      event.preventDefault()
      actions.burst()
    })
  }
  const form = byId<HTMLFormElement>('seed-form')
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const input = byId<HTMLInputElement>('seed-input')
    actions.seed(input.value)
  })
  byId('copy-seed').addEventListener('click', () => {
    void copySeed()
  })
  const deadSeed = byId<HTMLInputElement>('dead-seed')
  deadSeed.addEventListener('focus', () => deadSeed.select())
}

let blessSig = ''
let histSig = ''
let offerSig = -1
let deadSig = ''
let shellState = ''

export function sync(g: Game, save: Save, session: Session): void {
  const menu = g.state === 'menu'
  const hudOn = g.state === 'playing' || g.state === 'levelup' || g.state === 'paused' || g.state === 'dying'
  show('panel-menu', menu)
  show('panel-level', g.state === 'levelup')
  show('panel-pause', g.state === 'paused')
  show('panel-dead', g.state === 'dead')
  show('hud', hudOn)
  show('banner', !!g.banner && (g.state === 'playing' || g.state === 'dying'))

  const shell = byId('shell')
  shell.classList.toggle('overlay', g.state === 'levelup' || g.state === 'paused' || g.state === 'dead')
  if (g.state !== shellState) {
    shellState = g.state
    shell.scrollTop = 0
  }
  if (g.state === 'paused' || g.state === 'levelup') shell.scrollTop = 0
  byId('hud').classList.toggle('quiet', g.state === 'levelup' || g.state === 'paused')
  byId('pause-btn').hidden = g.state !== 'playing'

  const mute = byId('mute')
  mute.textContent = save.muted ? 'Muted' : 'Sound'
  mute.setAttribute('aria-pressed', save.muted ? 'true' : 'false')

  if (menu) syncMenu(save)
  if (hudOn) syncHud(g, save)
  if (g.banner && (g.state === 'playing' || g.state === 'dying')) {
    const title = byId('banner-title')
    if (title.textContent !== g.banner.title) {
      title.textContent = g.banner.title
      title.style.animation = 'none'
      void title.offsetWidth
      title.style.animation = ''
    }
    setText('banner-sub', g.banner.sub)
  }
  if (g.state === 'levelup') syncLevel(g)
  if (g.state === 'paused') setText('pause-build', buildPhrase(g.ranks))
  if (g.state === 'dead') syncDead(g, session)
}

function syncMenu(save: Save): void {
  const day = dailyKey()
  const label = formatSeed(dailySeed())
  const best = todayBest(save, day)
  setText(
    'daily-note',
    best > 0 ? `Today ${label} · your best ${formatScore(best)}` : `Today’s seed · ${label}`,
  )
  const sig = `${save.unlocks.join(',')}|${save.blessing}`
  if (sig !== blessSig) {
    blessSig = sig
    paintBlessings(save)
  }
  const empty = byId('empty-records')
  const records = byId('records')
  const history = byId('history')
  if (save.runs <= 0) {
    empty.hidden = false
    records.hidden = true
    history.hidden = true
    return
  }
  empty.hidden = true
  records.hidden = false
  const recSig = `${save.bestScore}|${save.bestTime}|${save.bestCombo}|${save.runs}`
  if (recSig !== histSig.split('~')[0]) {
    fillRecords(records, [
      ['Best', formatScore(save.bestScore)],
      ['Longest', formatTime(save.bestTime)],
      ['Combo', String(save.bestCombo)],
      ['Runs', String(save.runs)],
    ])
  }
  const hsig = `${recSig}~${save.history.map((h) => `${h.seed}:${h.score}:${h.time}`).join('|')}`
  if (hsig !== histSig) {
    histSig = hsig
    history.hidden = save.history.length === 0
    history.replaceChildren()
    for (const entry of save.history) {
      const li = document.createElement('li')
      li.textContent = `${formatScore(entry.score)} · ${formatTime(entry.time)} · ${entry.seed}`
      history.append(li)
    }
  }
}

function paintBlessings(save: Save): void {
  const root = byId('blessings')
  root.replaceChildren()
  for (const blessing of BLESSINGS) {
    const locked = blessing.id !== 'bare' && !save.unlocks.includes(blessing.id)
    const label = document.createElement('label')
    label.className = `bless${locked ? ' is-locked' : ''}`
    const input = document.createElement('input')
    input.type = 'radio'
    input.name = 'blessing'
    input.value = blessing.id
    input.checked = save.blessing === blessing.id
    input.disabled = locked
    input.addEventListener('change', () => {
      if (input.checked) bound?.blessing(blessing.id)
    })
    const name = document.createElement('span')
    name.className = 'bless-name'
    name.textContent = blessing.name
    const desc = document.createElement('span')
    desc.className = 'bless-desc'
    desc.textContent = locked ? blessing.need : blessing.desc
    label.append(input, name, desc)
    root.append(label)
  }
}

function syncHud(g: Game, save: Save): void {
  const max = Math.max(1, g.mods.maxHeat)
  const heat = Math.max(0, g.heat) / max
  const fill = byId('heat-fill')
  fill.style.width = `${Math.max(0, Math.min(1, heat)) * 100}%`
  fill.style.background = heatColor(heat)
  byId('heat').classList.toggle('desperate', heat < 0.28 && g.inferno <= 0)
  setText('heat-label', g.inferno > 0 ? 'Inferno' : 'Heat')
  setText('hint', g.hint)
  setText('score', formatScore(g.score))
  const score = byId('score')
  score.classList.toggle('is-best', g.beatBest)
  setText('combo', g.combo >= 2 ? `×${g.combo}` : '')
  const target = g.mode === 'daily' ? todayBest(save) : save.bestScore
  const bestText = g.beatBest ? (g.mode === 'daily' ? 'Daily best' : 'New best') : target > 0 ? `Best ${formatScore(target)}` : ''
  setText('bestline', bestText)
  byId('blaze-fill').style.width = `${Math.max(0, Math.min(1, g.inferno > 0 ? 1 : g.blaze)) * 100}%`
  byId('blaze').classList.toggle('is-hot', g.inferno > 0)
  setText('clock', formatTime(g.time))
  setText('seed-mini', g.seedLabel)
  setText('level', `Level ${g.level}`)
  const xp = g.xpNext <= 0 ? 0 : Math.max(0, Math.min(1, g.xp / g.xpNext))
  byId('xp-fill').style.width = `${xp * 100}%`
  setText('synergy-line', activeSynergies(g.ranks).join(' · '))
  const cd = g.mods.burstCd <= 0 ? 0 : Math.max(0, Math.min(1, g.burstCd / g.mods.burstCd))
  const burst = byId<HTMLButtonElement>('burst')
  burst.style.setProperty('--cd', String(cd))
  burst.disabled = g.state !== 'playing'
  byId('keycap-fill').style.height = `${cd * 100}%`

  const boss = g.enemies.find((e) => e.kind === 'boss')
  const bossEl = byId('boss')
  if (boss && g.state !== 'dying') {
    bossEl.hidden = false
    setText('boss-name', boss.name)
    byId('boss-fill').style.width = `${Math.max(0, boss.hp / boss.maxHp) * 100}%`
  } else {
    bossEl.hidden = true
  }
}

function syncLevel(g: Game): void {
  if (g.offerSerial === offerSig) return
  offerSig = g.offerSerial
  const cards = byId('cards')
  cards.replaceChildren()
  g.offers.forEach((offer, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `card rarity-${offer.rarity}`
    const rarity = document.createElement('span')
    rarity.className = 'rarity'
    rarity.textContent = offer.rarity === 'legend' ? 'White-hot' : offer.rarity
    const title = document.createElement('h3')
    title.textContent = offer.name
    const text = document.createElement('p')
    text.textContent = offer.text
    button.append(rarity, title, text)
    if (offer.max > 0) {
      const pips = document.createElement('span')
      pips.className = 'pips'
      pips.textContent = `Rank ${roman(offer.rank)}`
      button.append(pips)
    }
    if (offer.hint) {
      const hint = document.createElement('span')
      hint.className = 'hint'
      hint.textContent = offer.hint
      button.append(hint)
    }
    const key = document.createElement('kbd')
    key.textContent = String(index + 1)
    button.append(key)
    button.addEventListener('click', () => bound?.pick(index))
    cards.append(button)
  })
  setText('level-syn', activeSynergies(g.ranks).join(' · '))
}

function syncDead(g: Game, session: Session): void {
  const sig = `${g.runSerial}|${session.fresh.join(',')}|${session.record}|${session.dailyRecord}`
  if (sig === deadSig) return
  deadSig = sig
  setText('dead-score', formatScore(g.score))
  const bits = [session.record ? 'New best' : '', session.dailyRecord ? 'Daily best' : ''].filter(Boolean)
  setText('dead-record', bits.join(' · '))
  setText('dead-eulogy', g.eulogy)
  fillRecords(byId('dead-stats'), [
    ['Time', formatTime(g.time)],
    ['Combo', String(g.comboBest)],
    ['Slain', String(g.kills)],
    ['Bosses', String(g.bossKills)],
  ])
  setText('dead-build', buildPhrase(g.ranks))
  const names = session.fresh.map((id) => blessingById(id)?.name ?? id)
  setText('dead-unlocks', names.length ? `Unlocked ${names.join(', ')}. Equip ${names.length > 1 ? 'one' : 'it'} on the next wick.` : '')
  byId<HTMLInputElement>('dead-seed').value = g.seedLabel
  byId('again').textContent = g.mode === 'daily' ? 'Retry today' : 'Same seed'
}

function fillRecords(dl: HTMLElement, rows: [string, string][]): void {
  dl.replaceChildren()
  for (const [k, v] of rows) {
    const dt = document.createElement('dt')
    dt.textContent = k
    const dd = document.createElement('dd')
    dd.textContent = v
    dl.append(dt, dd)
  }
}

function heatColor(p: number): string {
  if (p < 0.28) return '#7eb6d4'
  if (p < 0.55) return '#e7a14a'
  if (p < 0.85) return '#ff6a2c'
  return '#fff1d2'
}

async function copySeed(): Promise<void> {
  const input = byId<HTMLInputElement>('dead-seed')
  const button = byId('copy-seed')
  try {
    await navigator.clipboard.writeText(input.value)
    button.textContent = 'Copied'
  } catch {
    input.focus()
    input.select()
    button.textContent = 'Select'
  }
  window.setTimeout(() => {
    button.textContent = 'Copy'
  }, 1200)
}

function show(id: string, on: boolean): void {
  byId(id).hidden = !on
}

function setText(id: string, text: string): void {
  const el = byId(id)
  if (el.textContent !== text) el.textContent = text
}

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Missing #${id}`)
  return el as T
}

export function showError(): void {
  show('panel-menu', false)
  show('panel-error', true)
  byId('shell').classList.add('overlay')
}
