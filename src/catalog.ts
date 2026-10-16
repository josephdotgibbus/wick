import type { ExtraId } from './upgrade-ids.ts'
import { EXTRA_IDS } from './upgrade-ids.ts'
import type { Mods, Ranks } from './types.ts'

export interface Spec {
  id: ExtraId
  name: string
  max: 1 | 2 | 3
  weight: number
  text: (n: number) => string
  damageFlat?: number
  damagePct?: number
  fireCut?: number
  shotLife?: number
  shotSpeed?: number
  maxHeat?: number
  decayCut?: number
  decayAdd?: number
  speed?: number
  light?: number
  magnet?: number
  sparkValue?: number
  killSpark?: number
  sparkLifeAdd?: number
  sparkLifeSet?: number
  burstCost?: number
  burstCdSub?: number
  burstCdCut?: number
  burstDmg?: number
  burstRange?: number
  shotScale?: number
  pierce?: number
  fan?: number
  fanFrac?: number
  regen?: number
  roundHeat?: number
  pickupBonus?: number
  enemyHp?: number
  enemySpeed?: number
  critChance?: number
  critMult?: number
  splash?: number
  splashR?: number
  chain?: number
  chainR?: number
  chainFrac?: number
  killBlast?: number
  killBlastR?: number
  thorns?: number
  executeFrac?: number
  executeMult?: number
  lowHeatDmg?: number
  highHeatDmg?: number
  movingDmg?: number
  stillDmg?: number
  emberDps?: number
  venomDps?: number
  venomTime?: number
  wispPct?: number
  cinderPct?: number
  closeMult?: number
  farMult?: number
  knock?: number
  auraDps?: number
  auraR?: number
  ricochet?: number
  wild?: number
  doubleEvery?: number
  salvage?: number
  salvageValue?: number
  siphon?: number
  shields?: number
  revenge?: number
  panic?: number
  bossMult?: number
  laserMult?: number
  spawnCut?: number
  homing?: number
  orbit?: number
  orbitDmg?: number
  leech?: number
  back?: boolean
  backFrac?: number
  brand?: boolean
  brandFrac?: number
  brandTime?: number
  pop?: boolean
  popCount?: number
  popFrac?: number
  novaEvery?: number
  novaFrac?: number
  lastCoal?: boolean
  coalFrac?: number
  coalMin?: number
  burstNova?: number
  burstNovaFrac?: number
}

function less(factor: number, n: number): string {
  return `${Math.round((1 - Math.pow(factor, n)) * 100)}%`
}

function more(factor: number, n: number): string {
  return `${Math.round((Math.pow(factor, n) - 1) * 100)}%`
}

export const CATALOG: Spec[] = [
  {
    id: 'drygrass',
    name: 'Dry grass',
    max: 3,
    weight: 14,
    damageFlat: 3,
    text: (n) => `Shots deal ${3 * n} more damage.`,
  },
  {
    id: 'bellows',
    name: 'Bellows',
    max: 3,
    weight: 14,
    fireCut: 0.12,
    text: (n) => `The gap between shots is ${less(0.88, n)} shorter.`,
  },
  {
    id: 'longwick',
    name: 'Long wick',
    max: 2,
    weight: 13,
    shotLife: 0.35,
    text: (n) => `Shots last ${0.35 * n} seconds longer (they start at 1.5).`,
  },
  {
    id: 'quickash',
    name: 'Quick ash',
    max: 2,
    weight: 13,
    shotSpeed: 28,
    text: (n) => `Shots fly ${28 * n} faster (they start at 168).`,
  },
  {
    id: 'thickflame',
    name: 'Thick flame',
    max: 2,
    weight: 13,
    maxHeat: 16,
    text: (n) => `Max heat is ${16 * n} higher (it starts at 100).`,
  },
  {
    id: 'softcoal',
    name: 'Soft coal',
    max: 2,
    weight: 13,
    decayCut: 0.1,
    text: (n) => `Heat drains ${less(0.9, n)} slower.`,
  },
  {
    id: 'longstride',
    name: 'Long stride',
    max: 2,
    weight: 12,
    speed: 18,
    text: (n) => `You move ${18 * n} faster (you start at 198).`,
  },
  {
    id: 'widerlight',
    name: 'Wider light',
    max: 2,
    weight: 12,
    light: 18,
    text: (n) => `The light around you reaches ${18 * n} farther (it starts at 86).`,
  },
  {
    id: 'sparkpull',
    name: 'Spark pull',
    max: 2,
    weight: 12,
    magnet: 16,
    text: (n) => `Sparks start pulling toward you from ${16 * n} farther (the pull starts at 28).`,
  },
  {
    id: 'openhand',
    name: 'Open hand',
    max: 2,
    weight: 12,
    sparkValue: 2,
    text: (n) => `Sparks lying on the map restore ${2 * n} more heat (they start at 7).`,
  },
  {
    id: 'lightburst',
    name: 'Light burst',
    max: 2,
    weight: 12,
    burstCost: 1,
    text: (n) => `Burst costs ${n} less heat (it starts at 4).`,
  },
  {
    id: 'readydash',
    name: 'Ready dash',
    max: 2,
    weight: 12,
    burstCdSub: 0.12,
    text: (n) => `Burst comes back ${(0.12 * n).toFixed(2)} seconds sooner (it starts at 1.15).`,
  },
  {
    id: 'hotdash',
    name: 'Hot dash',
    max: 2,
    weight: 13,
    burstDmg: 6,
    text: (n) => `Burst deals ${6 * n} more damage (it starts at 18).`,
  },
  {
    id: 'longdash',
    name: 'Long dash',
    max: 2,
    weight: 12,
    burstRange: 28,
    text: (n) => `Burst reaches ${28 * n} farther (it starts at 86).`,
  },
  {
    id: 'fatshot',
    name: 'Fat shot',
    max: 2,
    weight: 12,
    shotScale: 0.3,
    text: (n) => `Shots are ${more(1.3, n)} larger.`,
  },
  {
    id: 'stitch',
    name: 'Stitch',
    max: 2,
    weight: 14,
    pierce: 1,
    text: (n) => `A shot hits ${n} more ${n === 1 ? 'enemy' : 'enemies'} before it disappears.`,
  },
  {
    id: 'sideglance',
    name: 'Side glance',
    max: 2,
    weight: 12,
    fan: 1,
    fanFrac: 0.4,
    text: (n) => `Each shot also fires ${n} side ${n === 1 ? 'shot' : 'shots'} at 40% damage.`,
  },
  {
    id: 'steadyburn',
    name: 'Steady burn',
    max: 2,
    weight: 13,
    regen: 0.4,
    text: (n) => `You gain ${0.4 * n} heat each second.`,
  },
  {
    id: 'warmerstart',
    name: 'Warmer start',
    max: 2,
    weight: 12,
    roundHeat: 8,
    text: (n) => `You gain ${8 * n} heat at the start of each round.`,
  },
  {
    id: 'brightpickup',
    name: 'Bright pickup',
    max: 2,
    weight: 12,
    pickupBonus: 2,
    text: (n) => `Picking up a spark restores ${2 * n} extra heat.`,
  },
  {
    id: 'softerdark',
    name: 'Softer dark',
    max: 2,
    weight: 12,
    enemyHp: 0.92,
    text: (n) => `Enemies have ${less(0.92, n)} less health.`,
  },
  {
    id: 'slowpack',
    name: 'Slow pack',
    max: 2,
    weight: 12,
    enemySpeed: 0.92,
    text: (n) => `Enemies move ${less(0.92, n)} slower.`,
  },
  {
    id: 'luckycinder',
    name: 'Lucky cinder',
    max: 1,
    weight: 3.0,
    critChance: 0.15,
    critMult: 2,
    text: () => '15% of shots deal double damage.',
  },
  {
    id: 'splitsecond',
    name: 'Split second',
    max: 1,
    weight: 2.4,
    critChance: 0.08,
    critMult: 3,
    text: () => '8% of shots deal triple damage.',
  },
  {
    id: 'scatterheat',
    name: 'Scatter heat',
    max: 1,
    weight: 3.1,
    splash: 0.35,
    splashR: 48,
    text: () => 'A hit also deals 35% of the shot damage to other enemies within 48.',
  },
  {
    id: 'broadscorch',
    name: 'Broad scorch',
    max: 2,
    weight: 2.6,
    splash: 0.18,
    splashR: 70,
    text: (n) => `A hit also deals ${Math.round(18 * n)}% of the shot's damage to other enemies within 70.`,
  },
  {
    id: 'hoppingspark',
    name: 'Hopping spark',
    max: 1,
    weight: 2.8,
    chain: 1,
    chainR: 150,
    chainFrac: 0.55,
    text: () => 'A hit also jumps once, to an enemy within 150, for 55% damage.',
  },
  {
    id: 'secondhop',
    name: 'Second hop',
    max: 1,
    weight: 2.3,
    chain: 2,
    chainR: 170,
    chainFrac: 0.4,
    text: () => 'A hit jumps up to 2 times, to enemies within 170, for 40% damage each hop.',
  },
  {
    id: 'deathpop',
    name: 'Death pop',
    max: 1,
    weight: 2.9,
    killBlast: 16,
    killBlastR: 64,
    text: () => 'A kill deals 16 damage to enemies within 64.',
  },
  {
    id: 'cinderblast',
    name: 'Cinder blast',
    max: 1,
    weight: 2.2,
    killBlast: 28,
    killBlastR: 90,
    text: () => 'A kill deals 28 damage to enemies within 90.',
  },
  {
    id: 'spite',
    name: 'Spite',
    max: 1,
    weight: 2.7,
    thorns: 22,
    text: () => 'When something hits you, the nearest enemy within 220 takes 22 damage.',
  },
  {
    id: 'hotspite',
    name: 'Hot spite',
    max: 2,
    weight: 2.3,
    thorns: 14,
    text: (n) => `When something hits you, the nearest enemy within 220 takes ${14 * n} damage.`,
  },
  {
    id: 'snuff',
    name: 'Snuff',
    max: 1,
    weight: 2.5,
    executeFrac: 0.3,
    executeMult: 1.6,
    text: () => 'Shots deal 60% more damage to enemies under 30% health.',
  },
  {
    id: 'lastinch',
    name: 'Last inch',
    max: 1,
    weight: 2.2,
    executeFrac: 0.18,
    executeMult: 2,
    text: () => 'Shots deal double damage to enemies under 18% health.',
  },
  {
    id: 'desperate',
    name: 'Desperate wick',
    max: 1,
    weight: 2.8,
    lowHeatDmg: 1.45,
    text: () => 'While your heat is under 35%, shots deal 45% more damage.',
  },
  {
    id: 'fullbellows',
    name: 'Full bellows',
    max: 1,
    weight: 2.6,
    highHeatDmg: 1.3,
    text: () => 'While your heat is over 75%, shots deal 30% more damage.',
  },
  {
    id: 'strideshot',
    name: 'Stride shot',
    max: 1,
    weight: 3.0,
    movingDmg: 1.25,
    text: () => 'While you are moving, shots deal 25% more damage.',
  },
  {
    id: 'planted',
    name: 'Planted wick',
    max: 1,
    weight: 2.7,
    stillDmg: 1.4,
    text: () => 'While you stand still, shots deal 40% more damage.',
  },
  {
    id: 'cinderpath',
    name: 'Cinder path',
    max: 1,
    weight: 2.4,
    emberDps: 10,
    text: () => 'While you move, you leave fire on the ground. It deals 10 damage a second.',
  },
  {
    id: 'scorchedsteps',
    name: 'Scorched steps',
    max: 2,
    weight: 2.2,
    emberDps: 8,
    text: (n) => `While you move, you leave fire that deals ${8 * n} damage a second.`,
  },
  {
    id: 'clinging',
    name: 'Clinging heat',
    max: 1,
    weight: 2.8,
    venomDps: 6,
    venomTime: 1.4,
    text: () => 'A hit leaves a burn on that spot for 1.4 seconds. The burn deals 6 damage a second.',
  },
  {
    id: 'tarflame',
    name: 'Tar flame',
    max: 1,
    weight: 2.2,
    venomDps: 11,
    venomTime: 1.8,
    text: () => 'A hit leaves a burn on that spot for 1.8 seconds. The burn deals 11 damage a second.',
  },
  {
    id: 'wispoil',
    name: 'Wisp oil',
    max: 2,
    weight: 3.0,
    wispPct: 0.2,
    text: (n) => `Shots deal ${more(1.2, n)} more damage to wisps.`,
  },
  {
    id: 'redoil',
    name: 'Red oil',
    max: 2,
    weight: 2.6,
    cinderPct: 0.22,
    text: (n) => `Shots deal ${more(1.22, n)} more damage to red enemies.`,
  },
  {
    id: 'shortfuse',
    name: 'Short fuse',
    max: 1,
    weight: 2.9,
    closeMult: 1.4,
    text: () => 'Shots deal 40% more damage to enemies within 140 of you.',
  },
  {
    id: 'farwick',
    name: 'Far wick',
    max: 1,
    weight: 2.5,
    farMult: 1.35,
    text: () => 'Shots deal 35% more damage to enemies farther than 280 from you.',
  },
  {
    id: 'shove',
    name: 'Shove',
    max: 2,
    weight: 3.1,
    knock: 22,
    text: (n) => `A hit pushes wisps and red enemies back ${22 * n}.`,
  },
  {
    id: 'bodyheat',
    name: 'Body heat',
    max: 1,
    weight: 2.4,
    auraDps: 9,
    auraR: 70,
    text: () => 'Enemies within 70 of you take 9 damage a second.',
  },
  {
    id: 'widebody',
    name: 'Wide body heat',
    max: 1,
    weight: 2.2,
    auraDps: 6,
    auraR: 110,
    text: () => 'Enemies within 110 of you take 6 damage a second.',
  },
  {
    id: 'bounce',
    name: 'Bounce',
    max: 1,
    weight: 2.6,
    ricochet: 0.4,
    text: () => '40% of hits spit out a short spark that deals half that damage.',
  },
  {
    id: 'wildspark',
    name: 'Wild spark',
    max: 1,
    weight: 2.8,
    wild: 0.2,
    text: () => '20% of shots also fire one extra shot for full damage.',
  },
  {
    id: 'thirdbreath',
    name: 'Third breath',
    max: 1,
    weight: 2.4,
    doubleEvery: 3,
    text: () => 'Every 3rd shot fires a second shot for full damage.',
  },
  {
    id: 'greedy',
    name: 'Greedy flame',
    max: 1,
    weight: 2.3,
    killSpark: 9,
    decayAdd: 0.2,
    text: () => 'Kill sparks restore 9 heat instead of 5.5. Heat drains 20% faster.',
  },
  {
    id: 'secondspark',
    name: 'Second spark',
    max: 1,
    weight: 2.7,
    salvage: 0.35,
    salvageValue: 4,
    text: () => '35% of kills also drop a second spark worth 4 heat.',
  },
  {
    id: 'lingering',
    name: 'Lingering sparks',
    max: 2,
    weight: 3.0,
    sparkLifeAdd: 4,
    text: (n) => `Kill sparks last ${4 * n} seconds longer (they start at 11).`,
  },
  {
    id: 'siplight',
    name: 'Sip light',
    max: 1,
    weight: 2.5,
    siphon: 0.8,
    text: () => 'Each enemy inside your light restores 0.8 heat a second.',
  },
  {
    id: 'ashward',
    name: 'Ash ward',
    max: 1,
    weight: 2.2,
    shields: 1,
    text: () => 'The first hit each round costs no heat.',
  },
  {
    id: 'answer',
    name: 'Answer',
    max: 1,
    weight: 2.6,
    revenge: 2,
    text: () => 'After something hits you, your next shot deals double damage.',
  },
  {
    id: 'panicsprint',
    name: 'Panic sprint',
    max: 1,
    weight: 2.8,
    panic: 1.3,
    text: () => 'While your heat is under 35%, you move 30% faster.',
  },
  {
    id: 'deepsip',
    name: 'Deep sip',
    max: 1,
    weight: 2.4,
    regen: 0.45,
    leech: 3,
    text: () => 'You gain 0.45 heat each second. A kill restores 3 more heat. The Briar restores 12 more.',
  },
  {
    id: 'briarneedle',
    name: 'Briar needle',
    max: 1,
    weight: 0.5,
    bossMult: 1.35,
    text: () => 'Shots deal 35% more damage to the Briar.',
  },
  {
    id: 'crowncrack',
    name: 'Crown crack',
    max: 1,
    weight: 0.36,
    bossMult: 1.7,
    text: () => 'Shots deal 70% more damage to the Briar.',
  },
  {
    id: 'shortglare',
    name: 'Short glare',
    max: 1,
    weight: 0.52,
    laserMult: 0.7,
    text: () => 'Red beams are 30% shorter. The warning line matches the beam.',
  },
  {
    id: 'bluntglare',
    name: 'Blunt glare',
    max: 1,
    weight: 0.32,
    laserMult: 0.5,
    text: () => 'Red beams are 50% shorter. The warning line matches the beam.',
  },
  {
    id: 'thincrowd',
    name: 'Thin crowd',
    max: 2,
    weight: 0.48,
    spawnCut: 2,
    text: (n) => `${2 * n} fewer enemies arrive each round.`,
  },
  {
    id: 'emptydark',
    name: 'Empty dark',
    max: 1,
    weight: 0.28,
    spawnCut: 5,
    text: () => '5 fewer enemies arrive each round.',
  },
  {
    id: 'ironward',
    name: 'Iron ward',
    max: 1,
    weight: 0.4,
    shields: 2,
    text: () => 'The first 2 hits each round cost no heat.',
  },
  {
    id: 'ashshell',
    name: 'Ash shell',
    max: 1,
    weight: 0.22,
    shields: 3,
    text: () => 'The first 3 hits each round cost no heat.',
  },
  {
    id: 'mercycut',
    name: 'Mercy cut',
    max: 1,
    weight: 0.44,
    executeFrac: 0.4,
    executeMult: 2,
    text: () => 'Shots deal double damage to enemies under 40% health.',
  },
  {
    id: 'perfectcoal',
    name: 'Perfect coal',
    max: 1,
    weight: 0.3,
    critChance: 0.12,
    critMult: 4,
    text: () => '12% of shots deal 4× damage.',
  },
  {
    id: 'secondring',
    name: 'Second ring',
    max: 1,
    weight: 0.38,
    novaEvery: 6,
    novaFrac: 0.7,
    text: () => 'Every 6th shot also fires 8 shots in a ring, at 70% damage.',
  },
  {
    id: 'rearwick',
    name: 'Rear wick',
    max: 1,
    weight: 0.46,
    back: true,
    backFrac: 0.8,
    text: () => 'Every shot also fires one behind you, at 80% damage.',
  },
  {
    id: 'suremoth',
    name: 'Sure moth',
    max: 1,
    weight: 0.34,
    homing: 7.5,
    text: () => 'Shots curve hard toward the nearest enemy.',
  },
  {
    id: 'fourthtooth',
    name: 'Fourth tooth',
    max: 1,
    weight: 0.42,
    orbit: 2,
    orbitDmg: 16,
    text: () => 'Two teeth circle you. An enemy touching one takes 16 damage a second.',
  },
  {
    id: 'deepdrink',
    name: 'Deep drink',
    max: 1,
    weight: 0.36,
    leech: 8,
    text: () => 'A kill restores 8 more heat. Killing the Briar restores 32 more.',
  },
  {
    id: 'secondbrand',
    name: 'Second brand',
    max: 1,
    weight: 0.4,
    brand: true,
    brandFrac: 0.8,
    brandTime: 1.1,
    text: () => 'A hit leaves fire on that spot for 1.1 seconds. The fire deals 80% of that shot damage each second.',
  },
  {
    id: 'hardcrack',
    name: 'Hard crack',
    max: 1,
    weight: 0.3,
    pop: true,
    popCount: 8,
    popFrac: 0.6,
    text: () => 'When a shot fades out, it bursts into 8 short sparks at 60% damage.',
  },
  {
    id: 'thinglass',
    name: 'Thin glass',
    max: 1,
    weight: 0.26,
    damagePct: 0.4,
    decayAdd: 0.25,
    text: () => 'Shots deal 40% more damage. Heat drains 25% faster.',
  },
  {
    id: 'secondcoal',
    name: 'Second coal',
    max: 1,
    weight: 0.24,
    lastCoal: true,
    coalFrac: 0.35,
    coalMin: 24,
    text: () => 'Once each round, instead of dying, you come back with 35% of your max heat (at least 24).',
  },
  {
    id: 'deeplode',
    name: 'Deep lodestone',
    max: 1,
    weight: 0.44,
    sparkValue: 4,
    magnet: 30,
    text: () => 'Sparks on the map restore 4 more heat, and they start pulling from 30 farther.',
  },
  {
    id: 'dashring',
    name: 'Dash ring',
    max: 1,
    weight: 0.38,
    burstNova: 8,
    burstNovaFrac: 0.45,
    text: () => 'Burst also fires 8 shots in a ring, at 45% damage.',
  },
  {
    id: 'widedash',
    name: 'Wide dash ring',
    max: 1,
    weight: 0.22,
    burstNova: 12,
    burstNovaFrac: 0.6,
    text: () => 'Burst also fires 12 shots in a ring, at 60% damage.',
  },
  {
    id: 'threaded',
    name: 'Threaded moth',
    max: 1,
    weight: 0.28,
    pierce: 2,
    homing: 5,
    text: () => 'A shot hits 2 more enemies, and shots curve toward the nearest enemy.',
  },
  {
    id: 'fastlung',
    name: 'Fast lung',
    max: 1,
    weight: 0.36,
    fireCut: 0.28,
    burstCdCut: 0.2,
    text: () => 'The gap between shots is 28% shorter. Burst comes back 20% sooner.',
  },
  {
    id: 'bankedwick',
    name: 'Banked wick',
    max: 1,
    weight: 0.32,
    maxHeat: 40,
    decayCut: 0.15,
    text: () => 'Max heat is 40 higher. Heat drains 15% slower.',
  },
  {
    id: 'swiftlamp',
    name: 'Swift lamp',
    max: 1,
    weight: 0.46,
    speed: 40,
    light: 30,
    text: () => 'You move 40 faster, and the light around you reaches 30 farther.',
  },
  {
    id: 'crackingluck',
    name: 'Cracking luck',
    max: 1,
    weight: 0.26,
    critChance: 0.1,
    critMult: 2.5,
    splash: 0.25,
    splashR: 40,
    text: () => '10% of shots deal 2.5× damage. A hit also deals 25% of that damage to other enemies within 40.',
  },
  {
    id: 'hoppingend',
    name: 'Hopping end',
    max: 1,
    weight: 0.24,
    chain: 1,
    chainR: 180,
    chainFrac: 0.7,
    executeFrac: 0.25,
    executeMult: 1.5,
    text: () => 'A hit jumps once, to an enemy within 180, for 70% damage. Shots deal 50% more to enemies under 25% health.',
  },
  {
    id: 'barbedward',
    name: 'Barbed ward',
    max: 1,
    weight: 0.3,
    shields: 1,
    thorns: 40,
    text: () => 'The first hit each round costs no heat, and that hit deals 40 damage to the nearest enemy within 220.',
  },
  {
    id: 'tiredark',
    name: 'Tired dark',
    max: 1,
    weight: 0.34,
    enemyHp: 0.88,
    enemySpeed: 0.88,
    text: () => 'Enemies have 12% less health and move 12% slower.',
  },
  {
    id: 'fatdrops',
    name: 'Fat drops',
    max: 1,
    weight: 0.42,
    killSpark: 8,
    sparkLifeSet: 16,
    text: () => 'Kill sparks restore 8 heat instead of 5.5, and they last 16 seconds instead of 11.',
  },
  {
    id: 'hearthskin',
    name: 'Hearth skin',
    max: 1,
    weight: 0.36,
    auraDps: 14,
    auraR: 54,
    roundHeat: 4,
    text: () => 'Enemies within 54 take 14 damage a second. You gain 4 heat at the start of each round.',
  },
  {
    id: 'longneedle',
    name: 'Long needle',
    max: 1,
    weight: 0.3,
    pierce: 2,
    farMult: 1.25,
    text: () => 'A shot hits 2 more enemies. Shots deal 25% more damage to enemies farther than 280.',
  },
  {
    id: 'tarshove',
    name: 'Tar shove',
    max: 1,
    weight: 0.32,
    venomDps: 8,
    venomTime: 2,
    knock: 40,
    text: () => 'A hit burns that spot for 2 seconds at 8 damage a second, and pushes wisps and red enemies back 40.',
  },
  {
    id: 'scattered',
    name: 'Scattered wild',
    max: 1,
    weight: 0.26,
    wild: 0.25,
    fan: 2,
    fanFrac: 0.35,
    text: () => '25% of shots fire one extra full shot. Each shot also fires 2 side shots at 35% damage.',
  },
  {
    id: 'lastsprint',
    name: 'Last sprint',
    max: 1,
    weight: 0.4,
    lowHeatDmg: 1.5,
    panic: 1.25,
    text: () => 'While your heat is under 35%, shots deal 50% more damage and you move 25% faster.',
  },
  {
    id: 'antiglare',
    name: 'Anti-glare',
    max: 1,
    weight: 0.22,
    bossMult: 1.4,
    laserMult: 0.65,
    text: () => 'Shots deal 40% more damage to the Briar. Red beams are 35% shorter.',
  },
  {
    id: 'paidanswer',
    name: 'Paid answer',
    max: 1,
    weight: 0.28,
    shields: 1,
    revenge: 3,
    text: () => 'The first hit each round costs no heat. After a hit, your next shot deals triple damage.',
  },
  {
    id: 'hoard',
    name: 'Hoard',
    max: 1,
    weight: 0.2,
    killSpark: 10,
    salvage: 0.5,
    salvageValue: 5,
    decayAdd: 0.3,
    text: () => 'Kill sparks restore 10 heat instead of 5.5. Half of kills also drop a spark worth 5. Heat drains 30% faster.',
  },
  {
    id: 'glasslung',
    name: 'Glass lung',
    max: 1,
    weight: 0.34,
    damagePct: 0.25,
    fireCut: 0.15,
    decayAdd: 0.18,
    text: () => 'Shots deal 25% more damage. The gap between shots is 15% shorter. Heat drains 18% faster.',
  },
]

const BY_ID = new Map(CATALOG.map((spec) => [spec.id, spec]))

export function assertCatalog(): void {
  if (BY_ID.size !== CATALOG.length) throw new Error('duplicate upgrade id')
  if (CATALOG.length !== EXTRA_IDS.length) throw new Error(`catalog has ${CATALOG.length}, expected ${EXTRA_IDS.length}`)
  for (const id of EXTRA_IDS) {
    if (!BY_ID.has(id)) throw new Error(`missing upgrade ${id}`)
  }
}

export function catalogOf(id: ExtraId): Spec {
  const spec = BY_ID.get(id)
  if (!spec) throw new Error(`missing upgrade ${id}`)
  return spec
}

export function applyCatalog(mods: Mods, ranks: Ranks): void {
  for (const spec of CATALOG) {
    const n = ranks[spec.id]
    if (n > 0) applySpec(mods, n, spec)
  }
}

function applySpec(m: Mods, n: number, s: Spec): void {
  if (s.damageFlat) m.shotDamage += s.damageFlat * n
  if (s.damagePct) m.shotDamage *= Math.pow(1 + s.damagePct, n)
  if (s.fireCut) m.fireInterval *= Math.pow(1 - s.fireCut, n)
  if (s.shotLife) m.shotLife += s.shotLife * n
  if (s.shotSpeed) m.shotSpeed += s.shotSpeed * n
  if (s.maxHeat) m.maxHeat += s.maxHeat * n
  if (s.decayCut) m.decayMult *= Math.pow(1 - s.decayCut, n)
  if (s.decayAdd) m.decayMult *= Math.pow(1 + s.decayAdd, n)
  if (s.speed) m.speed += s.speed * n
  if (s.light) m.light += s.light * n
  if (s.magnet) m.magnet += s.magnet * n
  if (s.sparkValue) m.sparkValue += s.sparkValue * n
  if (s.killSpark) m.killSpark = Math.max(m.killSpark, s.killSpark)
  if (s.sparkLifeAdd) m.sparkLife += s.sparkLifeAdd * n
  if (s.sparkLifeSet) m.sparkLife = Math.max(m.sparkLife, s.sparkLifeSet)
  if (s.burstCost) m.burstCost = Math.max(1, m.burstCost - s.burstCost * n)
  if (s.burstCdSub) m.burstCd = Math.max(0.4, m.burstCd - s.burstCdSub * n)
  if (s.burstCdCut) m.burstCd *= Math.pow(1 - s.burstCdCut, n)
  if (s.burstDmg) m.burstDmg += s.burstDmg * n
  if (s.burstRange) m.burstRange += s.burstRange * n
  if (s.shotScale) m.shotScale *= Math.pow(1 + s.shotScale, n)
  if (s.pierce) m.pierce += s.pierce * n
  if (s.fan) m.fan += s.fan * n
  if (s.fanFrac) m.fanFrac = Math.max(m.fanFrac, s.fanFrac)
  if (s.regen) m.regen += s.regen * n
  if (s.roundHeat) m.roundHeat += s.roundHeat * n
  if (s.pickupBonus) m.pickupBonus += s.pickupBonus * n
  if (s.enemyHp) m.enemyHp *= Math.pow(s.enemyHp, n)
  if (s.enemySpeed) m.enemySpeed *= Math.pow(s.enemySpeed, n)
  if (s.critChance) m.critChance = 1 - (1 - m.critChance) * (1 - s.critChance)
  if (s.critMult) m.critMult = Math.max(m.critMult, s.critMult)
  if (s.splash) m.splash = Math.max(m.splash, s.splash * n)
  if (s.splashR) m.splashR = Math.max(m.splashR, s.splashR)
  if (s.chain) m.chain = Math.max(m.chain, s.chain)
  if (s.chainR) m.chainR = Math.max(m.chainR, s.chainR)
  if (s.chainFrac) m.chainFrac = Math.max(m.chainFrac, s.chainFrac)
  if (s.killBlast) m.killBlast = Math.max(m.killBlast, s.killBlast)
  if (s.killBlastR) m.killBlastR = Math.max(m.killBlastR, s.killBlastR)
  if (s.thorns) m.thorns += s.thorns * n
  if (s.executeFrac) m.executeFrac = Math.max(m.executeFrac, s.executeFrac)
  if (s.executeMult) m.executeMult = Math.max(m.executeMult, s.executeMult)
  if (s.lowHeatDmg) m.lowHeatDmg = Math.max(m.lowHeatDmg, s.lowHeatDmg)
  if (s.highHeatDmg) m.highHeatDmg = Math.max(m.highHeatDmg, s.highHeatDmg)
  if (s.movingDmg) m.movingDmg = Math.max(m.movingDmg, s.movingDmg)
  if (s.stillDmg) m.stillDmg = Math.max(m.stillDmg, s.stillDmg)
  if (s.emberDps) m.emberDps += s.emberDps * n
  if (s.venomDps) m.venomDps = Math.max(m.venomDps, s.venomDps)
  if (s.venomTime) m.venomTime = Math.max(m.venomTime, s.venomTime)
  if (s.wispPct) m.wispMult *= Math.pow(1 + s.wispPct, n)
  if (s.cinderPct) m.cinderMult *= Math.pow(1 + s.cinderPct, n)
  if (s.closeMult) m.closeMult = Math.max(m.closeMult, s.closeMult)
  if (s.farMult) m.farMult = Math.max(m.farMult, s.farMult)
  if (s.knock) m.knock += s.knock * n
  if (s.auraDps) m.auraDps += s.auraDps
  if (s.auraR) m.auraR = Math.max(m.auraR, s.auraR)
  if (s.ricochet) m.ricochet = Math.min(0.85, Math.max(m.ricochet, s.ricochet))
  if (s.wild) m.wild = Math.min(0.85, m.wild + s.wild)
  if (s.doubleEvery) m.doubleEvery = m.doubleEvery === 0 ? s.doubleEvery : Math.min(m.doubleEvery, s.doubleEvery)
  if (s.salvage) m.salvage = Math.min(0.85, m.salvage + s.salvage)
  if (s.salvageValue) m.salvageValue = Math.max(m.salvageValue, s.salvageValue)
  if (s.siphon) m.siphon += s.siphon
  if (s.shields) m.shields += s.shields
  if (s.revenge) m.revenge = Math.max(m.revenge, s.revenge)
  if (s.panic) m.panic = Math.max(m.panic, s.panic)
  if (s.bossMult) m.bossMult = Math.max(m.bossMult, s.bossMult)
  if (s.laserMult) m.laserMult *= s.laserMult
  if (s.spawnCut) m.spawnCut += s.spawnCut * n
  if (s.homing) m.homing = Math.max(m.homing, s.homing)
  if (s.orbit) m.orbit += s.orbit
  if (s.orbitDmg) m.orbitDmg = m.orbitDmg <= 0 ? s.orbitDmg : Math.max(m.orbitDmg, s.orbitDmg)
  if (s.leech) m.leech += s.leech
  if (s.back) m.back = true
  if (s.backFrac) m.backFrac = Math.max(m.backFrac, s.backFrac)
  if (s.brand) m.brand = true
  if (s.brandFrac) m.brandFrac = Math.max(m.brandFrac, s.brandFrac)
  if (s.brandTime) m.brandTime = Math.max(m.brandTime, s.brandTime)
  if (s.pop) m.pop = true
  if (s.popCount) m.popCount = Math.max(m.popCount, s.popCount)
  if (s.popFrac) m.popFrac = Math.max(m.popFrac, s.popFrac)
  if (s.novaEvery) m.novaEvery = m.novaEvery === 0 ? s.novaEvery : Math.min(m.novaEvery, s.novaEvery)
  if (s.novaFrac) m.novaFrac = Math.max(m.novaFrac, s.novaFrac)
  if (s.lastCoal) m.lastCoal = true
  if (s.coalFrac) m.coalFrac = Math.max(m.coalFrac, s.coalFrac)
  if (s.coalMin) m.coalMin = Math.max(m.coalMin, s.coalMin)
  if (s.burstNova) m.burstNova = Math.max(m.burstNova, s.burstNova)
  if (s.burstNovaFrac) m.burstNovaFrac = Math.max(m.burstNovaFrac, s.burstNovaFrac)
}
