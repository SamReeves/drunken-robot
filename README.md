# The Drunken Robot's Journey Home 🪗 🤖

![Version](https://img.shields.io/badge/version-v1.1.0-blue?style=for-the-badge&logo=github)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Phaser](https://img.shields.io/badge/Phaser-4.2.1-38bdf8?style=for-the-badge)
![Tone.js](https://img.shields.io/badge/Tone.js-15.1.22-ff00ff?style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white)

An interactive web app and immersive music-based art game honoring the style and personality of gypsy folk musician Melinda West. Guide a misanthropic but lovable clockwork robot—recently kicked out of a tavern—on a drunken, stumbling journey home through misty European streets.

The core experience blends a generative folk music sandbox, an incremental busking progression system, and a physics-based side-scrolling platformer.

## 🎵 The Gypsy Folk Engine (Audio Architecture)

The soundtrack isn't pre-recorded; it is generated in real-time. Built on **Tone.js**, the audio engine modulates tempo, rhythm, and instrumentation dynamically based on your physical interactions in the game.

- **Dynamic Meters:** Standard walking operates on a steady 4/4 czárdás rhythm. Stumbling into hazards warps the time signature into chaotic, asymmetrical Balkan meters (7/8 or 9/8).
- **Additive Ensemble:** You begin with only a solo accordion. As you collect tips (copper gears), you incrementally recruit companion instruments: Upright Bass, Castanets, Flamenco Guitar, Gypsy Violin, and Klezmer Clarinet.
- **Physics-Coupled Synth:** The robot's jump is tied directly to the accordion's bellows pressure, modulating the physical modeling synthesis (FM modulation index and filter cutoffs) in real-time.

## 🎨 Procedural Aesthetics

The game features a high-contrast visual juxtaposition generated entirely via code (no external static image assets):

- **Sketchbook Expressionism:** The robot and hazards are drawn using procedural vertex jitter to mimic raw, shaky 6B charcoal pencil lines on a cream texture.
- **Watercolor Impressionism:** The 5-layer parallax backgrounds utilize smooth Bézier curves and dual-stop gradient fills to simulate wet-on-dry watercolor pigment pooling. The midground architecture and hazard sprites dynamically hot-swap to reflect the specific biome of all 5 Acts (e.g., transitioning from steep tavern gables to Venetian bridges, sweeping canvas awnings, and industrial smokestacks).

## 🎮 How to Play

- **Balance (A / D or Left / Right):** Counter-steer against the robot's natural wobbly sway to keep the balance needle centered. Tilting too far results in a dramatic spin-out and loss of momentum.
- **Accordion Jump (Hold & Release SPACE):** Hold to compress the accordion bellows (charging your jump and altering the synth tone), then release to leap over murky puddles and wooden crates.
- **Busking:** Collect glowing copper gears to increase your momentum. Maintaining momentum keeps the band playing; hitting 0% momentum means you pass out in the gutters.
- **Power-Ups:** Intercept floating sinusoidal entities for 12-second buffs: Golden Sunflowers (2x tips), Gypsy Brandy (+50% balance stability), and Steam Cogs (super jump and hazard invulnerability).
- **Pause (P or ESC):** Cleanly freeze the physics simulation, Tone.js transport clock, and momentum decay while pulling up the interactive studio overlay.

## 🗺️ The 5 Acts

Survive the 10-minute journey to traverse all five musical biomes:

1. **The Tavern Exit:** Steamy windows, rainy cobblestones, and an intimate, raw solo accordion.
2. **The Crooked Canals:** Misty waterways scoring melancholic Klezmer waltzes.
3. **The Marketplace:** Shuttered stalls yielding polyrhythmic Balkan chaos and flamenco guitar.
4. **The Industrial Noir:** Iron frameworks paired with suspenseful, dissonant Noir-Folk.
5. **The Sunrise Overlook:** A triumphant 180 BPM czárdás finale with the full 6-piece ensemble.

## 🌐 Play it

Live at **https://drunkenrobot.whalegames.net**. Every push to `main` is built by GitHub Actions and published to the `deploy` branch, which DigitalOcean App Platform serves as a static site.

This repository (`SamReeves/drunken-robot`) is a fork of `AMBloom/drunken-robot` where the current round of improvements is being developed and hosted. The work will be offered back upstream as a pull request once it is complete.

## 🛠️ Local Development Setup

Requires Node.js 22 (see `.nvmrc`) and npm. Clone the repository:

```bash
git clone https://github.com/SamReeves/drunken-robot.git
cd drunken-robot
```

Install dependencies and start the Vite development server:

```bash
npm ci
npm run dev
```

To build for production:

```bash
npm run build
```

## 📜 License & Credits

- **Design & Engineering:** Andrew Bloom (@AMBloom)
- **Musical Inspiration:** Melinda West
- Built with **Phaser 4** and **Tone.js**.
