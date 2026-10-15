# WICK

A boss-rush survival game. You are a flame in the dark. The heat bar is your life: it drains on its own, and touching an enemy spends more. Sparks on the ground fill it back up. There is no score.

Each round ends when every enemy that was going to arrive is dead. Shots fire at the nearest enemy by themselves. Then you pick one of three upgrades. The card says what that upgrade does. Every fifth round you fight the Briar and must take a curse. Upgrades lists everything you are carrying, with the effect written out.

## Play

- **Steer:** before the run, choose mouse or keys. Only that one moves you.
- **Mouse:** the cursor pulls the flame. A touch drag does the same.
- **Keys:** WASD, arrows, or a gamepad stick.
- **Burst:** Space, click, or the Burst button. It spends a little heat, dashes, and damages enemies it passes through.
- **Draft:** after a clear, dropped sparks fly to you, then you pick one upgrade.
- **Curses:** every fifth clear, you must take a penalty. The card states the downside.
- **Pause:** Pause, Esc, or P. M mutes. R retries the same seed after a loss.

Wisps are small and red-eyed. They arrive one by one, later rounds send more, and each one takes a lot of killing. Shots thin out before they vanish. From round 4, a red enemy sometimes stops, draws a warning line, then fires a thin beam. Only the beam hurts. Stones block you. Pits drain heat. Bramble hurts when you touch it. From round 6 on, half of the rounds add a twist, and the banner says which one.

The Briar's spikes sit in its body and spin with it. They slow, aim at random, and then fly a long way.

The same seed repeats the map and the spawns. Blessings unlock from how far you have gotten and change the next start. Everything is saved in this browser.

## Run locally

```bash
npm install
npm run dev
```

The dev server listens on port **4731**. `npm run build` writes a static site to `dist/`. `npm run soak` plays three scripted runs against the simulation to catch crashes and a dead-on-arrival balance.

## GitHub Pages

The build uses relative asset paths, so it works at a user site or a project site. This repo includes [`.github/workflows/pages.yml`](.github/workflows/pages.yml), which publishes `dist/` on every push to `main`.

In the repository settings, open **Pages → Build and deployment** and set the source to **GitHub Actions**. The next push prints the live URL on the workflow run.
