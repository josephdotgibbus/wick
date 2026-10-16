import { BLESSINGS, blessingById, EVENT_COPY, pedestalCopy, statLines } from './content.ts'
import { formatTime } from './format.ts'
import { dailyKey, dailySeed, formatSeed } from './rng.ts'
import type { Save } from './storage.ts'
import { todayBest } from './storage.ts'
import type { Game } from './types.ts'
import { upgradeById } from './upgrades.ts'

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
  resume: () => void
  giveUp: () => void
  toggleMute: () => void
  blessing: (id: string) => void
  burst: () => void
  use: () => void
  interact: () => void
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
  byId('active').addEventListener('pointerdown', (event) => {
    event.preventDefault()
    actions.use()
  })
  byId('take').addEventListener('pointerdown', (event) => {
    event.preventDefault()
    actions.interact()
  })
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
let deadSig = ''
let shellState = ''
let loadSig = ''
let inspectSig = ''

export function sync(g: Game, save: Save, session: Session): void {
  const menu = g.state === 'menu'
  const hudOn = g.state === 'playing' || g.state === 'paused' || g.state === 'dying'
  show('panel-menu', menu)
  show('panel-steer', g.state === 'steer')
  show('panel-pause', g.state === 'paused')
  show('panel-dead', g.state === 'dead')
  show('panel-loadout', g.loadoutOpen && (g.state === 'playing' || g.state === 'paused'))
  show('hud', hudOn)
  show('banner', !!g.banner && (g.state === 'playing' || g.state === 'dying') && !g.loadoutOpen)

  const shell = byId('shell')
  const overlay = g.state === 'paused' || g.state === 'dead' || g.state === 'steer'
  if (shellState !== `${g.state}:${overlay}`) {
    shellState = `${g.state}:${overlay}`
    shell.classList.toggle('overlay', overlay)
  }
  const hud = byId('hud')
  hud.classList.toggle('quiet', g.state !== 'playing')
  hud.classList.toggle('sheet', g.loadoutOpen)

  const mute = byId('mute')
  mute.textContent = save.muted ? 'Sound off' : 'Sound'
  mute.setAttribute('aria-pressed', save.muted ? 'true' : 'false')

  if (menu) paintMenu(g, save, session)
  if (hudOn) paintHud(g)
  if (g.state === 'paused') byId('pause-build').textContent = pauseLine(g)
  if (g.loadoutOpen) paintStats(g)
  if (g.state === 'dead') paintDead(g, save, session)
  paintInspect(g)
}

function paintMenu(g: Game, save: Save, session: Session): void {
  const day = dailyKey()
  const best = todayBest(save, day)
  byId('daily-note').textContent = best > 0 ? `Today’s best is dungeon ${best}.` : `Today’s seed is ${formatSeed(dailySeed())}.`
  const marks = { round: save.bestRound, time: save.bestTime, bosses: save.bosses }
  const sig = `${save.unlocks.join()}|${save.blessing}|${save.bestRound}`
  if (sig !== blessSig) {
    blessSig = sig
    const box = byId('blessings')
    box.replaceChildren()
    for (const blessing of BLESSINGS) {
      const open = blessing.id === 'bare' || save.unlocks.includes(blessing.id)
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'bless'
      button.disabled = !open
      button.setAttribute('aria-pressed', save.blessing === blessing.id ? 'true' : 'false')
      const name = document.createElement('strong')
      name.textContent = open ? blessing.name : 'Locked'
      const desc = document.createElement('span')
      desc.textContent = open ? blessing.desc : blessing.need
      button.append(name, desc)
      button.addEventListener('click', () => bound?.blessing(blessing.id))
      box.append(button)
    }
  }
  const records = byId('records')
  const empty = byId('empty-records')
  if (save.runs === 0) {
    records.hidden = true
    empty.hidden = false
  } else {
    records.hidden = false
    empty.hidden = true
    records.replaceChildren()
    addRecord(records, 'Best dungeon', String(save.bestRound))
    addRecord(records, 'Longest run', formatTime(save.bestTime))
    addRecord(records, 'Bosses', String(save.bosses))
  }
  const hist = byId('history')
  const histKey = save.history.map((h) => `${h.round}:${h.time}:${h.seed}`).join('|')
  if (histKey !== histSig) {
    histSig = histKey
    hist.replaceChildren()
    hist.hidden = save.history.length === 0
    for (const entry of save.history) {
      const li = document.createElement('li')
      li.textContent = `Dungeon ${entry.round} · ${formatTime(entry.time)} · ${entry.seed}`
      hist.append(li)
    }
  }
  void g
  void session
  void marks
}

function paintHud(g: Game): void {
  const fill = byId('heat-fill')
  const ratio = g.maxHeat <= 0 ? 0 : Math.max(0, g.heat) / g.maxHeat
  fill.style.width = `${ratio * 100}%`
  byId('heat').classList.toggle('desperate', ratio < 0.25)
  byId('heat-label').textContent = g.heat < 25 ? 'Heat · almost out' : 'Heat · life'
  byId('round-label').textContent = `Dungeon ${g.dungeon}`
  const here = g.rooms[g.roomIndex]
  const foes = g.enemies.filter((e) => !e.dead).length
  byId('foes').textContent = here?.cleared ? 'Room clear' : foes ? `${foes} still in the room` : 'Doors open'
  byId('clock').textContent = formatTime(g.time)
  byId('seed-mini').textContent = g.seedLabel
  byId('hint').textContent = g.hint
  byId('coins').textContent = g.coins === 1 ? '1 coin' : `${g.coins} coins`
  const active = byId('active')
  active.innerHTML = g.active
    ? `${escape(g.active.name)}<small>${g.active.charge}/${g.active.charges}</small>`
    : 'Active<small>Empty</small>'
  const take = byId('take')
  const label = g.near === 'chest' ? 'Open' : g.near === 'stair' ? 'Descend' : 'Take'
  take.hidden = g.near === null || g.state !== 'playing'
  take.innerHTML = `${label}<small>E</small>`
  const boss = g.enemies.find((e) => e.kind === 'boss' && !e.dead)
  const bar = byId('boss')
  bar.hidden = !boss
  if (boss) {
    byId('boss-name').textContent = boss.name
    byId('boss-fill').style.width = `${Math.max(0, boss.hp / boss.maxHp) * 100}%`
  }
  const event = byId('event-line')
  event.hidden = !g.event
  event.textContent = g.event ? EVENT_COPY[g.event].title : ''
  if (g.banner) {
    byId('banner-title').textContent = g.banner.title
    byId('banner-sub').textContent = g.banner.sub
  }
}

function paintStats(g: Game): void {
  const sig = `${g.stats.damage}:${g.stats.tears}:${g.stats.speed}:${g.stats.range}:${g.stats.shotSpeed}:${g.stats.luck}:${g.stats.magnet}:${g.heat}:${g.maxHeat}:${g.coins}:${g.passives.join()}|${g.active?.id ?? ''}:${g.active?.charge ?? 0}`
  if (sig === loadSig) return
  loadSig = sig
  const sheet = byId('stat-sheet')
  sheet.replaceChildren()
  for (const line of statLines(g.stats)) addRecord(sheet, line.label, line.value)
  addRecord(sheet, 'Heat', `${Math.ceil(g.heat)} / ${Math.round(g.maxHeat)}`)
  addRecord(sheet, 'Coins', String(g.coins))
  const list = byId('loadout-ups')
  list.replaceChildren()
  if (!g.passives.length && !g.active) {
    const li = document.createElement('li')
    li.textContent = 'No upgrades yet. Treasure pedestals stay bare until you add some in src/upgrades.ts.'
    list.append(li)
  }
  for (const id of g.passives) {
    const def = upgradeById(id)
    const li = document.createElement('li')
    li.textContent = def ? `${def.name}. ${def.description}` : id
    list.append(li)
  }
  byId('active-line').textContent = g.active
    ? `Active: ${g.active.name}. ${g.active.description} Charge ${g.active.charge}/${g.active.charges}.`
    : 'Active slot is empty.'
}

function paintDead(g: Game, save: Save, session: Session): void {
  const sig = `${g.runSerial}:${g.dungeon}:${session.record}`
  if (sig === deadSig) return
  deadSig = sig
  byId('dead-round').textContent = `Dungeon ${g.dungeon}`
  byId('dead-eulogy').textContent = g.eulogy
  byId('dead-record').textContent = session.record ? 'New best dungeon.' : `Best is dungeon ${save.bestRound}.`
  const stats = byId('dead-stats')
  stats.replaceChildren()
  addRecord(stats, 'Time', formatTime(g.time))
  addRecord(stats, 'Enemies', String(g.kills))
  addRecord(stats, 'Coins', String(g.coins))
  addRecord(stats, 'Bosses', String(g.bossKills))
  for (const line of statLines(g.stats)) addRecord(stats, line.label, line.value)
  addRecord(stats, 'Heat', `${Math.ceil(g.heat)} / ${Math.round(g.maxHeat)}`)
  byId('dead-build').textContent = pauseLine(g)
  const unlocks = byId('dead-unlocks')
  unlocks.textContent = session.fresh.length
    ? `Unlocked ${session.fresh.map((id) => blessingById(id)?.name ?? id).join(', ')}.`
    : ''
  byId<HTMLInputElement>('dead-seed').value = g.seedLabel
}

function paintInspect(g: Game): void {
  const panel = byId('inspect')
  const showPanel = g.state === 'playing' && g.near === 'pedestal'
  const here = g.rooms[g.roomIndex]
  const pedestal = here?.pedestals.find((item) => item.upgradeId === g.nearId) ?? here?.pedestals[0]
  const def = g.nearId ? upgradeById(g.nearId) : undefined
  const copy = pedestal?.upgradeId ? pedestalCopy(def) : pedestalCopy(undefined)
  const note = !def
    ? 'The shelf is empty until you add an upgrade in src/upgrades.ts.'
    : here?.treasureTaken
      ? 'You already took one.'
      : def.kind === 'active'
        ? 'E puts this in the active slot and locks the other two.'
        : 'E takes this and locks the other two.'
  const sig = `${showPanel}:${copy.name}:${note}:${g.nearId ?? ''}`
  panel.hidden = !showPanel
  if (!showPanel || sig === inspectSig) return
  inspectSig = sig
  byId('inspect-kicker').textContent = def?.kind === 'active' ? 'Active item' : 'Pedestal'
  byId('inspect-name').textContent = copy.name
  byId('inspect-text').textContent = copy.text
  byId('inspect-detail').textContent = [copy.detail, note].filter(Boolean).join(' ')
}

function pauseLine(g: Game): string {
  const blessing = blessingById(g.blessingId)
  const held = g.passives.length ? `${g.passives.length} passive` : 'no passives'
  const active = g.active ? g.active.name : 'no active item'
  return `${blessing?.name ?? 'None'} blessing. ${held}. ${active}. ${g.coins} coins.`
}

function addRecord(dl: HTMLElement, label: string, value: string): void {
  const dt = document.createElement('dt')
  dt.textContent = label
  const dd = document.createElement('dd')
  dd.textContent = value
  dl.append(dt, dd)
}

function escape(text: string): string {
  return text.replace(/[&<>]/g, (ch) => (ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : '&gt;'))
}

function show(id: string, on: boolean): void {
  byId(id).hidden = !on
}

export function showError(): void {
  const panel = document.getElementById('panel-error')
  if (panel) panel.hidden = false
}

function byId<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id)
  if (!node) throw new Error(`Missing #${id}`)
  return node as T
}

async function copySeed(): Promise<void> {
  const input = byId<HTMLInputElement>('dead-seed')
  input.select()
  try {
    await navigator.clipboard.writeText(input.value)
  } catch {
    document.execCommand('copy')
  }
}
