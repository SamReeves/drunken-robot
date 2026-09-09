# The Drunken Robot's Journey Home 🪗 🤖

![Version](https://img.shields.io/badge/version-v1.1.0-blue?style=for-the-badge&logo=github)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Phaser](https://img.shields.io/badge/Phaser-4.2.1-38bdf8?style=for-the-badge)
![Tone.js](https://img.shields.io/badge/Tone.js-15.1.22-ff00ff?style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white)

An interactive web app and immersive music-based art game honoring the style and personality of gypsy folk musician Melinda West[cite: 10]. Guide a misanthropic but lovable clockwork robot—recently kicked out of a tavern—on a drunken, stumbling journey home through misty European streets[cite: 10]. 

The core experience blends a generative folk music sandbox, an incremental busking progression system, and a physics-based side-scrolling platformer[cite: 10].

## 🎵 The Gypsy Folk Engine (Audio Architecture)
The soundtrack isn't pre-recorded; it is generated in real-time[cite: 10]. Built on **Tone.js**, the audio engine modulates tempo, rhythm, and instrumentation dynamically based on your physical interactions in the game[cite: 10].
* **Dynamic Meters:** Standard walking operates on a steady 4/4 czárdás rhythm[cite: 10]. Stumbling into hazards warps the time signature into chaotic, asymmetrical Balkan meters (7/8 or 9/8)[cite: 10].
* **Additive Ensemble:** You begin with only a solo accordion[cite: 10]. As you collect tips (copper gears), you incrementally recruit companion instruments: Upright Bass, Castanets, Flamenco Guitar, Gypsy Violin, and Klezmer Clarinet[cite: 10].
* **Physics-Coupled Synth:** The robot's jump is tied directly to the accordion's bellows pressure, modulating the physical modeling synthesis (FM modulation index and filter cutoffs) in real-time[cite: 10].

## 🎨 Procedural Aesthetics
The game features a high-contrast visual juxtaposition generated entirely via code (no external static image assets)[cite: 10]:
* **Sketchbook Expressionism:** The robot and hazards are drawn using procedural vertex jitter to mimic raw, shaky 6B charcoal pencil lines on a cream texture[cite: 10].
* **Watercolor Impressionism:** The 5-layer parallax backgrounds utilize smooth Bézier curves and dual-stop gradient fills to simulate wet-on-dry watercolor pigment pooling[cite: 10]. The midground architecture and hazard sprites dynamically hot-swap to reflect the specific biome of all 5 Acts (e.g., transitioning from steep tavern gables to Venetian bridges, sweeping canvas awnings, and industrial smokestacks)[cite: 7].

## 🎮 How to Play
* **Balance (A / D or Left / Right):** Counter-steer against the robot's natural wobbly sway to keep the balance needle centered[cite: 10]. Tilting too far results in a dramatic spin-out and loss of momentum[cite: 10].
* **Accordion Jump (Hold & Release SPACE):** Hold to compress the accordion bellows (charging your jump and altering the synth tone), then release to leap over murky puddles and wooden crates[cite: 10].
* **Busking:** Collect glowing copper gears to increase your momentum[cite: 10]. Maintaining momentum keeps the band playing; hitting 0% momentum means you pass out in the gutters[cite: 10].
* **Power-Ups:** Intercept floating sinusoidal entities for 12-second buffs: Golden Sunflowers (2x tips), Gypsy Brandy (+50% balance stability), and Steam Cogs (super jump and hazard invulnerability)[cite: 9].
* **Pause (P or ESC):** Cleanly freeze the physics simulation, Tone.js transport clock, and momentum decay while pulling up the interactive studio overlay[cite: 3].

## 🗺️ The 5 Acts
Survive the 10-minute journey to traverse all five musical biomes[cite: 10]:
1. **The Tavern Exit:** Steamy windows, rainy cobblestones, and an intimate, raw solo accordion[cite: 10].
2. **The Crooked Canals:** Misty waterways scoring melancholic Klezmer waltzes[cite: 10].
3. **The Marketplace:** Shuttered stalls yielding polyrhythmic Balkan chaos and flamenco guitar[cite: 10].
4. **The Industrial Noir:** Iron frameworks paired with suspenseful, dissonant Noir-Folk[cite: 10].
5. **The Sunrise Overlook:** A triumphant 180 BPM czárdás finale with the full 6-piece ensemble[cite: 10].

## 🛠️ Local Development Setup

To run the game locally, ensure you have Node.js installed, then clone the repository[cite: 10]:

```bash
git clone [https://github.com/AMBloom/drunken-robot.git](https://github.com/AMBloom/drunken-robot.git)
cd drunken-robot
```

Install dependencies and start the Vite development server[cite: 10]:

```bash
npm install
npm run dev
```

To build for production[cite: 10]:

```bash
npm run build
```

## 📜 License & Credits
* **Design & Engineering:** Andrew Bloom (@AMBloom)[cite: 10]
* **Musical Inspiration:** Melinda West[cite: 10]
* Built with **Phaser 4** and **Tone.js**[cite: 10].
