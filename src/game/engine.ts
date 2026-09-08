import Phaser from 'phaser';
import { gameConfig } from './config.ts';

let gameInstance: Phaser.Game | null = null;

/**
 * Initializes and mounts the Phaser 4 game instance to the target container.
 * If already initialized, returns the existing instance.
 */
export function initGame(containerId: string = 'game-container'): Phaser.Game {
  if (gameInstance) {
    return gameInstance;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`[GameEngine] Container #${containerId} not found in DOM.`);
  }

  const config: Phaser.Types.Core.GameConfig = {
    ...gameConfig,
    parent: containerId,
  };

  gameInstance = new Phaser.Game(config);
  return gameInstance;
}

/**
 * Returns the active Phaser Game instance, or null if not yet initialized.
 */
export function getGame(): Phaser.Game | null {
  return gameInstance;
}

/**
 * Refreshes the Phaser scale manager. Call when the UI sidebar or viewport resizes.
 */
export function refreshGameScale(): void {
  if (gameInstance && gameInstance.scale) {
    requestAnimationFrame(() => {
      gameInstance?.scale.refresh();
    });
  }
}

/**
 * Safely destroys the Phaser Game instance and frees resources.
 */
export function destroyGame(): void {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
  }
}
