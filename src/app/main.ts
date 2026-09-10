import './base.css';
import { readFlags } from './flags.ts';
import { createAudioBridge } from './audioBridge.ts';
import { createGame } from '../game/engine.ts';

const flags = readFlags();

// Audio graph first so the bridge is listening before any scene emits.
const audio = createAudioBridge();
const game = createGame('game-container', flags);

// Portrait phones get a rotate prompt; the canvas is 16:9 and unplayable tall.
const rotateOverlay = document.getElementById('rotate-overlay');
if (rotateOverlay && flags.coarsePointer && typeof window.matchMedia === 'function') {
  const portrait = window.matchMedia('(orientation: portrait)');
  const sync = (): void => {
    rotateOverlay.hidden = !portrait.matches;
  };
  portrait.addEventListener('change', sync);
  sync();
}

if (flags.test) {
  window.__drunkenRobot = {
    get activeScene(): string | null {
      const scenes = game.scene.getScenes(true);
      const street = scenes.find((s) => s.scene.key === 'StreetScene');
      return (street ?? scenes[0])?.scene.key ?? null;
    },
  };
}

if (flags.debug) {
  void import('./debug/dashboard.ts').then((m) => m.mountDashboard(audio));
}

declare global {
  interface Window {
    __drunkenRobot?: { readonly activeScene: string | null };
  }
}
