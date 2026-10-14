import { BLESSINGS, type BestMarks } from './content.ts'
import { dailyKey } from './rng.ts'

const KEY = 'wick-save-v1'

export interface HistoryEntry {
  score: number
  time: number
  combo: number
  seed: string
  mode: string
}

export interface Save {
  bestScore: number
  bestTime: number
  bestCombo: number
  bosses: number
  runs: number
  lifetime: number
  unlocks: string[]
  blessing: string
  muted: boolean
  dailyDay: string
  dailyScore: number
  history: HistoryEntry[]
}

export interface FinishedRun {
  score: number
  time: number
  combo: number
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
    bestScore: 0,
    bestTime: 0,
    bestCombo: 0,
    bosses: 0,
    runs: 0,
    lifetime: 0,
    unlocks: [],
    blessing: 'bare',
    muted: false,
    dailyDay: '',
    dailyScore: 0,
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
    const raw = localStorage.getItem(KEY)
    if (!raw) return save
    const parsed = JSON.parse(raw) as Partial<Save>
    save.bestScore = num(parsed.bestScore)
    save.bestTime = num(parsed.bestTime)
    save.bestCombo = num(parsed.bestCombo)
    save.bosses = num(parsed.bosses)
    save.runs = num(parsed.runs)
    save.lifetime = num(parsed.lifetime)
    save.muted = Boolean(parsed.muted)
    save.dailyDay = typeof parsed.dailyDay === 'string' ? parsed.dailyDay : ''
    save.dailyScore = num(parsed.dailyScore)
    if (Array.isArray(parsed.unlocks)) {
      save.unlocks = parsed.unlocks.filter((id): id is string => typeof id === 'string' && knownBlessing(id) && id !== 'bare')
    }
    if (typeof parsed.blessing === 'string' && knownBlessing(parsed.blessing)) save.blessing = parsed.blessing
    if (Array.isArray(parsed.history)) {
      save.history = parsed.history
        .filter((h): h is HistoryEntry => !!h && typeof h === 'object')
        .slice(0, 6)
        .map((h) => ({
          score: num(h.score),
          time: num(h.time),
          combo: num(h.combo),
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
  return { score: save.bestScore, time: save.bestTime, combo: save.bestCombo, bosses: save.bosses }
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

export function todayBest(save: Save, day = dailyKey()): number {
  return save.dailyDay === day ? save.dailyScore : 0
}

export function commitRun(save: Save, run: FinishedRun): CommitResult {
  const record = run.score > save.bestScore
  const day = dailyKey()
  const prevDaily = save.dailyDay === day ? save.dailyScore : 0
  const dailyRecord = run.mode === 'daily' && run.score > prevDaily

  save.runs += 1
  save.lifetime += run.score
  save.bestScore = Math.max(save.bestScore, run.score)
  save.bestTime = Math.max(save.bestTime, run.time)
  save.bestCombo = Math.max(save.bestCombo, run.combo)
  save.bosses += run.bossKills
  if (run.mode === 'daily') {
    save.dailyDay = day
    save.dailyScore = Math.max(prevDaily, run.score)
  }
  save.history.unshift({
    score: run.score,
    time: run.time,
    combo: run.combo,
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
