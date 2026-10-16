# WICK

A dungeon of rooms. You are a flame in the dark. Heat is your life: it burns down on its own, touching an enemy spends more, and sparks fill it back up. There is no score.

Each room holds its own enemies. The doors stay shut until they are dead. A cleared room has a chance to leave a coin, a spark, or a soul heart. Shots fire at the nearest enemy by themselves. The last room is the Briar. After it falls, a chest and a stair appear. The stair starts the next dungeon.

One treasure room on each dungeon holds three pedestals. Stand next to one and a small panel shows what it would do. You can take only one. The shelf is empty until you write upgrades in `src/upgrades.ts`.

## Stats

The flame keeps the Binding of Isaac stat line:

- **Speed** starts at 1.00. Movement is 170 pixels a second times speed.
- **Tears** starts at 2.73. That number is shots per second.
- **Damage** starts at 3.50. That number is the damage of one shot.
- **Range** starts at 6.50. A shot travels `range × 28` pixels.
- **Shot speed** starts at 1.00. A shot moves at `150 × shot speed` pixels a second.
- **Luck** starts at 0. It raises the chance of a room drop and of a chest holding an upgrade.
- **Heat** starts at 100. That is your life. A wisp touch spends 9, a red enemy 11, the Briar 16, a beam 14, and a spike 12. The wick also burns down on its own, a little faster than it used to.

A blessing can raise speed, damage, luck, or your max heat before the run. Reaching later dungeons unlocks them. Kills leave a small spark. Picking one up restores 7 heat.

## Play

- **Steer:** before the run, choose mouse or keys. Only that one moves you.
- **Mouse:** the cursor pulls the flame. A touch drag does the same.
- **Keys:** WASD, arrows, or a gamepad stick.
- **Burst:** Space, click, or the Burst button. It spends a little heat and dashes through enemies.
- **Active:** Q, or the Active button. The slot starts empty. Room clears charge it.
- **Take:** E or F, or the button that appears when you are close. It takes a pedestal, opens a chest, or climbs the stair.
- **Pause:** Pause, Esc, or P. M mutes. R retries the same seed after a loss. Stats lists the six numbers.

Wisps are small and red-eyed. Red enemies stop, draw a warning line, then fire a beam. Only the beam takes hearts. Rocks and walls block the way. Pits drain heat. Bramble takes a half heart. From dungeon 2 on, half of the dungeons add a twist, and the banner says which one.

The Briar's spikes sit in its body and spin with it. They slow, aim at random, and then fly across the room.

Coins sit on the floor, drop when a room is cleared, and come out of chests. A chest is uncommon in a combat room, and one appears after the Briar. Opening it spills a few coins and, rarely, a free upgrade once any exist.

The same seed repeats the rooms, the coins, and where enemies stand. How you move can still differ. Everything is saved in this browser.

## Adding an upgrade

Put an object in the `UPGRADES` list in `src/upgrades.ts`. A passive changes stats. An active goes in the one active slot. Its `use` key is the name you can handle later in `useActive` inside `src/sim.ts`. Until you add one, pedestals stay bare and chests pay coins only.

## Run locally

```bash
npm install
npm run dev
```

The dev server listens on port **4731**. `npm run build` writes a static site to `dist/`. `npm run soak` plays three scripted runs against the simulation.

## GitHub Pages

The build uses relative asset paths, so it works at a user site or a project site. This repo includes [`.github/workflows/pages.yml`](.github/workflows/pages.yml), which publishes `dist/` on every push to `main`.

In the repository settings, open **Pages → Build and deployment** and set the source to **GitHub Actions**. The next push prints the live URL on the workflow run.
