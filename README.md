# WICK

A boss-rush survival game. You are a wick in an endless dark. Heat is your life. Each round ends when every shadow that arrived is gone. Then you draft a wick. Every fifth round you take a curse instead, and the Briar wakes.

## Play

- **Steer:** before the run, choose mouse or keys. Only that one moves the flame.
- **Mouse:** the cursor pulls the flame. A touch drag does the same.
- **Keys:** WASD, arrows, or a gamepad stick.
- **Burst:** Space, click, or the Burst button. It spends a little heat and cuts what it passes through.
- **Draft:** clear a round, pick one of three wicks. Most of them change how sparks behave. Pairs wake a named synergy.
- **Curses:** every fifth clear, you must take a curse. Build lists both.
- **Sparks:** small flames on the ground restore heat. There is no score and no streak.
- **Pause:** Pause, Esc, or P. M mutes. R retries the same seed after a loss.

Wisps are small, red-eyed, and leave a cloudy trail. They arrive one by one, later rounds send more of them, and each one takes a lot of killing. Sparks thin out before they vanish. After round 3, a red one sometimes stops and paints a warning line, then fires a thin laser. Only the laser burns. Stones block you. Pits and bramble get worse as the rounds climb. From round 6 on, half of the rounds twist: slick ash, extra rock, a thicker dark.

The Briar's spikes sit in its body and spin with it. They slow, aim at random, and then fly a long way.

The same seed deals the same land. Blessings unlock from the deepest round and change the next start. Everything is saved in this browser.

## Run locally

```bash
npm install
npm run dev
```

The dev server listens on port **4731**. `npm run build` writes a static site to `dist/`. `npm run soak` plays three scripted runs against the simulation to catch crashes and a dead-on-arrival balance.

## GitHub Pages

The build uses relative asset paths, so it works at a user site or a project site. This repo includes [`.github/workflows/pages.yml`](.github/workflows/pages.yml), which publishes `dist/` on every push to `main`.

In the repository settings, open **Pages → Build and deployment** and set the source to **GitHub Actions**. The next push prints the live URL on the workflow run.
