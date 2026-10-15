import { BLESSINGS, type BestMarks } from './content.ts'
import type { ControlMode } from './types.ts'
import { dailyKey } from './rng.ts'

const KEY = 'wick-save-v2'
const OLD = 'wick-save-v1'

export interface HistoryEntry {
  round: number
  time: number
  bosses: number
  seed: string
  mode: string
}

export interface Save {
  bestRound: number
  bestTime: number
  bosses: number
  runs: number
  lifetime: number
  unlocks: string[]
  blessing: string
  muted: boolean
  control: ControlMode
  dailyDay: string
  dailyRound: number
  history: HistoryEntry[]
}

export interface FinishedRun {
  round: number
  time: number
  bossKills: number
  seedLabel: string
  mode: string
}

export interface CommitResult {
  fresh: string[]
  record: boolean
  dailyRecord: boolean
}

function empty(): Save {
  return {
    bestRound: 0,
    bestTime: 0,
    bosses: 0,
    runs: 0,
    lifetime: 0,
    unlocks: [],
    blessing: 'bare',
    muted: false,
    control: 'mouse',
    dailyDay: '',
    dailyRound: 0,
    history: [],
  }
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function knownBlessing(id: string): boolean {
  return BLESSINGS.some((b) => b.id === id)
}

export function loadSave(): Save {
  const save = empty()
  try {
    const old = localStorage.getItem(OLD)
    if (old) {
      const parsed = JSON.parse(old) as { muted?: boolean }
      save.muted = Boolean(parsed.muted)
    }
  } catch {
    /* old save is optional */
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return save
    const parsed = JSON.parse(raw) as Partial<Save>
    save.bestRound = num(parsed.bestRound)
    save.bestTime = num(parsed.bestTime)
    save.bosses = num(parsed.bosses)
    save.runs = num(parsed.runs)
    save.lifetime = num(parsed.lifetime)
    save.muted = Boolean(parsed.muted)
    save.control = parsed.control === 'keys' ? 'keys' : 'mouse'
    save.dailyDay = typeof parsed.dailyDay === 'string' ? parsed.dailyDay : ''
    save.dailyRound = num(parsed.dailyRound)
    if (Array.isArray(parsed.unlocks)) {
      save.unlocks = parsed.unlocks.filter((id): id is string => typeof id === 'string' && knownBlessing(id) && id !== 'bare')
    }
    if (typeof parsed.blessing === 'string' && knownBlessing(parsed.blessing)) save.blessing = parsed.blessing
    if (Array.isArray(parsed.history)) {
      save.history = parsed.history
        .filter((h): h is HistoryEntry => !!h && typeof h === 'object')
        .slice(0, 6)
        .map((h) => ({
          round: num(h.round),
          time: num(h.time),
          bosses: num(h.bosses),
          seed: typeof h.seed === 'string' ? h.seed : '',
          mode: typeof h.mode === 'string' ? h.mode : 'endless',
        }))
    }
  } catch {
    return empty()
  }
  if (save.blessing !== 'bare' && !save.unlocks.includes(save.blessing)) save.blessing = 'bare'
  return save
}

export function persist(save: Save): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save))
  } catch {
    // Private mode and full disks still let the current session play.
  }
}

export function marksOf(save: Save): BestMarks {
  return { round: save.bestRound, time: save.bestTime, bosses: save.bosses }
}

export function allowedBlessing(save: Save): string {
  if (save.blessing !== 'bare' && save.unlocks.includes(save.blessing) && knownBlessing(save.blessing)) {
    return save.blessing
  }
  return 'bare'
}

export function setBlessing(save: Save, id: string): void {
  if (id !== 'bare' && !save.unlocks.includes(id)) return
  if (!knownBlessing(id)) return
  save.blessing = id
  persist(save)
}

export function setMuted(save: Save, muted: boolean): void {
  save.muted = muted
  persist(save)
}

export function setControl(save: Save, control: ControlMode): void {
  save.control = control
  persist(save)
}

export function todayBest(save: Save, day = dailyKey()): number {
  return save.dailyDay === day ? save.dailyRound : 0
}

export function commitRun(save: Save, run: FinishedRun): CommitResult {
  const record = run.round > save.bestRound
  const day = dailyKey()
  const prevDaily = save.dailyDay === day ? save.dailyRound : 0
  const dailyRecord = run.mode === 'daily' && run.round > prevDaily

  save.runs += 1
  save.lifetime += run.round
  save.bestRound = Math.max(save.bestRound, run.round)
  save.bestTime = Math.max(save.bestTime, run.time)
  save.bosses += run.bossKills
  if (run.mode === 'daily') {
    save.dailyDay = day
    save.dailyRound = Math.max(prevDaily, run.round)
  }
  save.history.unshift({
    round: run.round,
    time: run.time,
    bosses: run.bossKills,
    seed: run.seedLabel,
    mode: run.mode,
  })
  save.history = save.history.slice(0, 6)

  const fresh: string[] = []
  const marks = marksOf(save)
  for (const blessing of BLESSINGS) {
    if (blessing.id === 'bare') continue
    if (save.unlocks.includes(blessing.id)) continue
    if (blessing.met(marks)) {
      save.unlocks.push(blessing.id)
      fresh.push(blessing.id)
    }
  }
  persist(save)
  return { fresh, record, dailyRecord }
}
