import {
  BLESSINGS,
  CURSES,
  EVENT_COPY,
  UPGRADES,
  blessingById,
  buildPhrase,
  effectOf,
  iconFor,
  roman,
  upgradeName,
} from './content.ts'
import { formatTime } from './format.ts'
import { dailyKey, dailySeed, formatSeed } from './rng.ts'
import type { Save } from './storage.ts'
import { todayBest } from './storage.ts'
import type { CurseId, Game, UpgradeId } from './types.ts'

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
  steer: (mode: 'mouse' | 'keys') => void
  loadout: () => void
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
  byId('steer-mouse').addEventListener('click', () => actions.steer('mouse'))
  byId('steer-keys').addEventListener('click', () => actions.steer('keys'))
  byId('loadout-btn').addEventListener('click', actions.loadout)
  byId('loadout-close').addEventListener('click', actions.loadout)
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
let loadSig = ''

export function sync(g: Game, save: Save, session: Session): void {
  const menu = g.state === 'menu'
  const hudOn = g.state === 'playing' || g.state === 'levelup' || g.state === 'paused' || g.state === 'dying'
  show('panel-menu', menu)
  show('panel-steer', g.state === 'steer')
  show('panel-level', g.state === 'levelup')
  show('panel-pause', g.state === 'paused')
  show('panel-dead', g.state === 'dead')
  show('panel-loadout', g.loadoutOpen && (g.state === 'playing' || g.state === 'paused'))
  show('hud', hudOn)
  show('banner', !!g.banner && (g.state === 'playing' || g.state === 'dying'))

  const shell = byId('shell')
  const overlay = g.state === 'levelup' || g.state === 'paused' || g.state === 'dead' || g.state === 'steer'
  shell.classList.toggle('overlay', overlay)
  shell.classList.toggle('draft', g.state === 'levelup')
  if (g.state !== shellState) {
    shellState = g.state
    shell.scrollTop = 0
  }
  if (g.state === 'levelup' || g.state === 'paused') shell.scrollTop = 0
  byId('hud').classList.toggle('quiet', g.state === 'levelup' || g.state === 'paused')
  byId('pause-btn').hidden = g.state !== 'playing'
  byId('loadout-btn').hidden = g.state !== 'playing' && g.state !== 'paused'

  const mute = byId('mute')
  mute.textContent = save.muted ? 'Muted' : 'Sound'
  mute.setAttribute('aria-pressed', save.muted ? 'true' : 'false')

  if (menu) syncMenu(save)
  if (g.state === 'steer') {
    byId('steer-mouse').classList.toggle('primary', save.control !== 'keys')
    byId('steer-keys').classList.toggle('primary', save.control === 'keys')
  }
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
  if (g.state === 'paused') setText('pause-build', buildPhrase(g.ranks, g.curses))
  if (g.loadoutOpen) syncLoadout(g)
  if (g.state === 'dead') syncDead(g, session)
}

function syncMenu(save: Save): void {
  const day = dailyKey()
  const label = formatSeed(dailySeed())
  const best = todayBest(save, day)
  setText('daily-note', best > 0 ? `Today ${label} · round ${best}` : `Today’s seed · ${label}`)
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
  const recSig = `${save.bestRound}|${save.bestTime}|${save.bosses}|${save.runs}`
  if (recSig !== histSig.split('~')[0]) {
    fillRecords(records, [
      ['Deepest', `Round ${save.bestRound}`],
      ['Longest', formatTime(save.bestTime)],
      ['Bosses', String(save.bosses)],
      ['Runs', String(save.runs)],
    ])
  }
  const hsig = `${recSig}~${save.history.map((h) => `${h.seed}:${h.round}:${h.time}`).join('|')}`
  if (hsig !== histSig) {
    histSig = hsig
    history.hidden = save.history.length === 0
    history.replaceChildren()
    for (const h of save.history) {
      const li = document.createElement('li')
      li.textContent = `Round ${h.round} · ${formatTime(h.time)} · ${h.seed}`
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
    label.className = locked ? 'bless locked' : 'bless'
    const input = document.createElement('input')
    input.type = 'radio'
    input.name = 'blessing'
    input.value = blessing.id
    input.checked = save.blessing === blessing.id
    input.disabled = locked
    input.addEventListener('change', () => {
      if (input.checked) bound?.blessing(blessing.id)
    })
    const name = document.createElement('strong')
    name.textContent = blessing.name
    const desc = document.createElement('span')
    desc.textContent = locked ? blessing.need : blessing.desc
    label.append(input, name, desc)
    root.append(label)
  }
}

function syncHud(g: Game, save: Save): void {
  const heat = g.mods.maxHeat <= 0 ? 0 : Math.max(0, g.heat) / g.mods.maxHeat
  const fill = byId('heat-fill')
  fill.style.width = `${Math.round(heat * 100)}%`
  fill.style.background = heatColor(heat)
  const left = g.enemies.filter((e) => !e.dead).length + g.incoming.length
  setText('hint', g.hint)
  setText('clock', formatTime(g.time))
  setText('seed-mini', g.seedLabel)
  setText('round-label', `Round ${g.round}`)
  setText('foes', left === 1 ? '1 enemy left' : `${left} enemies left`)
  const boss = g.enemies.find((e) => e.kind === 'boss' && !e.dead)
  const bar = byId('boss')
  bar.hidden = !boss
  if (boss) {
    setText('boss-name', boss.name)
    byId('boss-fill').style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`
  }
  const event = byId('event-line')
  event.hidden = !g.event
  if (g.event) setText('event-line', EVENT_COPY[g.event].title)
  paintGlyphs(g)
  void save
}

function paintGlyphs(g: Game): void {
  const sig = glyphSig(g)
  if (sig === loadSig) return
  loadSig = sig
  const row = byId('glyph-row')
  row.replaceChildren()
  for (const id of UPGRADES) {
    if (g.ranks[id] <= 0) continue
    row.append(glyph(id, roman(g.ranks[id])))
  }
  for (const id of CURSES) {
    if (g.curses[id] <= 0) continue
    row.append(glyph(id, roman(g.curses[id]), true))
  }
}

function glyph(id: string, rank: string, curse = false): HTMLElement {
  const fig = document.createElement('figure')
  fig.className = curse ? 'glyph curse' : 'glyph'
  const img = document.createElement('img')
  img.alt = ''
  img.src = iconFor(id)
  const cap = document.createElement('figcaption')
  cap.textContent = rank
  fig.append(img, cap)
  fig.title = `${upgradeName(id as UpgradeId)} ${rank}`
  return fig
}

function glyphSig(g: Game): string {
  return UPGRADES.map((id) => g.ranks[id]).join(',') + '|' + CURSES.map((id) => g.curses[id]).join(',')
}

function syncLevel(g: Game): void {
  const curse = g.offers[0]?.kind === 'curse'
  setText('level-kicker', curse ? 'A penalty you must take' : 'One upgrade')
  setText('level-title', curse ? 'Take a curse' : 'Choose one')
  if (g.offerSerial === offerSig) return
  offerSig = g.offerSerial
  const cards = byId('cards')
  cards.replaceChildren()
  g.offers.forEach((offer, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = offer.kind === 'curse' ? 'card curse' : 'card'
    const img = document.createElement('img')
    img.alt = ''
    img.src = offer.icon
    const rarity = document.createElement('span')
    rarity.className = 'rarity'
    rarity.textContent =
      offer.kind === 'curse'
        ? `Curse ${roman(offer.rank)} of ${roman(offer.max)}`
        : offer.max <= 1
          ? 'Only once'
          : `Rank ${roman(offer.rank)} of ${roman(offer.max)}`
    const name = document.createElement('strong')
    name.textContent = offer.name
    const text = document.createElement('p')
    text.textContent = offer.text
    button.append(img, rarity, name, text)
    if (offer.hint) {
      const hint = document.createElement('em')
      hint.textContent = offer.hint
      button.append(hint)
    }
    button.addEventListener('click', () => bound?.pick(index))
    const slot = document.createElement('div')
    slot.className = 'card-slot'
    slot.style.setProperty('--i', String(index))
    slot.append(button)
    cards.append(slot)
  })
  setText('level-syn', '')
}

function syncLoadout(g: Game): void {
  const ups = byId('loadout-ups')
  const downs = byId('loadout-curses')
  ups.replaceChildren()
  downs.replaceChildren()
  const owned = UPGRADES.filter((id) => g.ranks[id] > 0)
  const cursed = CURSES.filter((id) => g.curses[id] > 0)
  if (owned.length === 0) ups.append(emptyLine('No upgrades yet.'))
  for (const id of owned) ups.append(row(id, g.ranks[id]))
  if (cursed.length === 0) downs.append(emptyLine('No curses yet.'))
  for (const id of cursed) downs.append(row(id, g.curses[id], true))
  setText('loadout-syn', '')
}

function row(id: UpgradeId | CurseId, rank: number, curse = false): HTMLElement {
  const li = document.createElement('li')
  li.className = curse ? 'curse' : ''
  const img = document.createElement('img')
  img.alt = ''
  img.src = iconFor(id)
  const name = document.createElement('span')
  const title = document.createElement('strong')
  title.textContent = `${upgradeName(id)} ${roman(rank)}`
  const detail = document.createElement('small')
  detail.textContent = effectOf(id, rank)
  name.append(title, detail)
  li.append(img, name)
  return li
}

function emptyLine(text: string): HTMLElement {
  const li = document.createElement('li')
  li.className = 'empty'
  li.textContent = text
  return li
}

function syncDead(g: Game, session: Session): void {
  const sig = `${g.runSerial}|${session.record}|${session.fresh.join(',')}`
  if (sig === deadSig) return
  deadSig = sig
  setText('dead-round', `Round ${g.round}`)
  const record = byId('dead-record')
  record.textContent = session.record ? 'Deepest yet.' : session.dailyRecord ? 'Best daily.' : ''
  setText('dead-eulogy', g.eulogy)
  fillRecords(byId('dead-stats'), [
    ['Round', String(g.round)],
    ['Time', formatTime(g.time)],
    ['Bosses', String(g.bossKills)],
    ['Slain', String(g.kills)],
  ])
  setText('dead-build', buildPhrase(g.ranks, g.curses))
  const unlocks = byId('dead-unlocks')
  unlocks.textContent = session.fresh.length
    ? `Unlocked ${session.fresh.map((id) => blessingById(id)?.name ?? id).join(', ')}.`
    : ''
  byId<HTMLInputElement>('dead-seed').value = g.seedLabel
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
