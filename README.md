# WICK

A dungeon of rooms. You are a flame in the dark. Heat is your life: it burns down on its own, touching an enemy spends more, and sparks fill it back up. There is no score.

Each room holds its own enemies. The doors stay shut until they are dead. A cleared room has a chance to leave a coin or a spark. Shots fire at the nearest enemy by themselves. The last room is the Briar. After it falls, a chest and a stair appear. The stair starts the next dungeon. A map of the dungeon sits at the upper right. Walking through a door pulls the view back so both rooms stay on screen, then settles into the next one.

One treasure room on each dungeon holds three pedestals. Stand next to one and a small panel shows the name, the tier, and what it would do. You can take only one. A passive changes your stats and stays. An active fills the one slot. A later active replaces it.

## Stats

The flame keeps the Binding of Isaac stat line:

- **Speed** starts at 0.85. Movement is 170 pixels a second times speed.
- **Tears** starts at 1.82. That number is shots per second.
- **Damage** starts at 3.50. That number is the damage of one shot.
- **Range** starts at 6.50. A shot travels `range × 28` pixels.
- **Shot speed** starts at 1.00. A shot moves at `150 × shot speed` pixels a second.
- **Luck** starts at 0. It raises the chance of a room drop and of a chest holding an upgrade.
- **Magnet** starts at 28 pixels. A spark inside that distance drags toward you. Upgrades can add to it.
- **Heat** starts at 50. That is your life. A wisp touch spends 9, a red enemy 11, the Briar 16, a beam 14, and a spike 12. The wick also burns down on its own, a little faster than it used to.

A blessing can raise speed, damage, luck, or your max heat before the run. Reaching later dungeons unlocks them. Kills leave a small spark. Picking one up restores 7 heat.

## Play

- **Steer:** before the run, choose mouse or keys. Only that one moves you.
- **Mouse:** the cursor pulls the flame. A touch drag does the same.
- **Keys:** WASD, arrows, or a gamepad stick.
- **Burst:** Space, click, or the Burst button. It spends a little heat and dashes through enemies.
- **Active:** Q, or the Active button. The slot starts empty and shows the item’s icon once you hold one. Room clears charge it.
- **Take:** E, or the button that appears when you are close. E takes a passive. It also puts an active in the slot, opens a chest, or climbs the stair. F does the same.
- **Pause:** Pause, Esc, or P. M mutes. R retries the same seed after a loss. Stats, or Tab, lists every stat.

Wisps are small and red-eyed. Red enemies stop, draw a warning line, then fire a beam. Rocks and walls block the way. Pits drain heat. Bramble spends heat. From dungeon 2 on, half of the dungeons add a twist, and the banner says which one. Enemies fade in, wait half a second before they move or attack, and stay off the door you just walked through. A shot that hits a wall fades out instead of vanishing.

The Briar waits in the largest room on the floor. Its spikes sit in its body and spin with it. They slow, swing out to a firing angle, and only then fly across the room. When it falls, its heat rushes into the wick and fills you back to the top.

Coins and chests slide, bounce off walls, and pass through enemies. A coin glints while it sits, and picking one up throws a shine. Sparks are small embers. Walk close and they drag in. A chest is uncommon in a combat room, and one appears after the Briar. Opening it spills a few coins and, rarely, a free upgrade once any exist.

The same seed repeats the rooms, the coins, and where enemies stand. How you move can still differ. Everything is saved in this browser.

## Upgrades

Five stand-in upgrades are already on the shelf, one for each tier. A roll picks the tier first, then an item of that tier. The chances are tier 0 at 46%, tier 1 at 28%, tier 2 at 15%, tier 3 at 8%, and tier 4 at 3%. The three pedestals in a room will not repeat the same upgrade. A chest uses the same roll.

| Tier | Upgrade | Kind | What it does |
| --- | --- | --- | --- |
| 0 | Cinder crumb | Passive | Damage +0.35 |
| 1 | Warm splinter | Passive | Speed +0.06, tears +0.12 |
| 2 | Blue wick | Active | Restores 6 heat. Charges in 3 cleared rooms. |
| 3 | Bright coal | Passive | Damage +0.8, luck +0.4 |
| 4 | White dawn | Active | Restores 12 heat. Charges in 4 cleared rooms. |

The first time you enter a room that holds a tier 4, the door slide flashes white, then a ray burst plays over that pedestal. A tier 3 throws sparkles for a moment when you first see it. A tier 2 glows a faint blue for a moment. Taking another active swaps the one in the slot, and the slot shows that item’s icon.

## Adding an upgrade

Put an object in the `UPGRADES` list in `src/upgrades.ts` and set `tier` from 0 to 4. Set `icon` to a mark drawn in `drawUpgradeIcon` (`crumb`, `splinter`, `wick`, `coal`, `dawn`, or a new name you add there). A passive changes stats and is taken with E. An active goes in the one active slot. Its `use` key is the name handled in `useActive` inside `src/sim.ts`. `blue` and `dawn` are the two stand-in uses.

Rooms on a floor turn and sprout a side room or two, so the map is not a single eastward line.

## Run locally

```bash
npm install
npm run dev
```

The dev server listens on port **4731**. `npm run build` writes a static site to `dist/`. `npm run soak` plays three scripted runs against the simulation.

## GitHub Pages

The build uses relative asset paths, so it works at a user site or a project site. This repo includes [`.github/workflows/pages.yml`](.github/workflows/pages.yml), which publishes `dist/` on every push to `main`.

In the repository settings, open **Pages → Build and deployment** and set the source to **GitHub Actions**. The next push prints the live URL on the workflow run.
