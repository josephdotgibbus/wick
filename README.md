# WICK

A short, endlessly replayable survival game. You are a wick in the dark. Heat is your life, and it is always starving. Enemies carry the embers that feed it. Draft a build, chain a combo into an inferno, and see how long one flame can last.

Runs are a minute or two when you're learning and much longer once a build comes together. Death is immediate to retry. The same seed deals the same spawns, so a loss is something you can answer.

## Play

- **Move:** mouse (pull away from the flame), WASD or arrows, left stick, or a touch drag.
- **Burst:** Space, click, a second finger, the on-screen Burst button, or the south gamepad button. Burst spends a little heat, cuts through bodies, and slips cold rings.
- **Draft:** when the wick levels, pick one of three changes. Some pairs name a synergy and start behaving differently.
- **Blaze:** collecting embers in a combo fills the ring around the flame. A full ring is an Inferno: damage jumps and the wick almost stops starving.
- **Pause:** the Pause button, Esc, or P. M mutes. R retries the same seed after a loss.

Shades sprint in the dark and stumble in your light. Poppers bloom when they die. Bosses throw expanding rings of cold.

Endless mode chases your best score. The daily burn uses one shared seed per UTC day. Any phrase can be a seed, and a code like `WICK-AB12-CD34` replays that pattern. Blessings unlock from bests and change the way the next wick starts. Everything is saved in this browser.

## Run locally

```bash
npm install
npm run dev
```

The dev server listens on port **4731**. `npm run build` writes a static site to `dist/`. `npm run soak` plays three scripted runs against the simulation to catch crashes and a dead-on-arrival balance.

## GitHub Pages

The build uses relative asset paths, so it works at a user site or a project site. This repo includes [`.github/workflows/pages.yml`](.github/workflows/pages.yml), which publishes `dist/` on every push to `main`.

In the repository settings, open **Pages → Build and deployment** and set the source to **GitHub Actions**. The next push prints the live URL on the workflow run.
