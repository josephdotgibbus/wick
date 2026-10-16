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
  return save
}

export function persist(save: Save): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save))
  } catch {
    // Private mode and full disks still let the current session play.
  }
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
  persist(save)
  return { record, dailyRecord }
}
