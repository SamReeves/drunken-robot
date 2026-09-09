/**
 * EventBus - Decoupled Type-Safe Event Emitter
 * The Drunken Robot's Journey Home
 *
 * Provides decoupled pub/sub communication between Phaser 4 (Game Engine)
 * and Tone.js (Generative Gypsy Folk Engine).
 */

import type { InstrumentId } from '../audio/types.ts';

export type BuffType = 'tips' | 'balance' | 'jump';

export interface GameEventMap {
  /** Fired when the robot collects a floating power-up */
  BUFF_ACTIVATED: {
    buff: BuffType;
    duration: number;
  };

  /** Fired when an active buff runs out or is replaced */
  BUFF_DEACTIVATED: {
    buff: BuffType;
  };

  /** Fired when the robot loses balance past critical stability threshold */
  PLAYER_STUMBLE: {
    direction: 'left' | 'right';
    severity: number; // 0.0 to 1.0
    tiltAngle: number; // in radians
    speed: number;
  };

  /** Fired continuously as the player charges accordion bellows pressure */
  BELLOWS_COMPRESS: {
    pressure: number; // 0.0 to 1.0
    isCharging: boolean;
  };

  /** Fired upon releasing a charged accordion jump */
  BELLOWS_BURST: {
    jumpForce: number;
    pressure: number;
  };

  /** Fired when the robot touches down onto the cobblestone ground */
  PLAYER_LAND: {
    impactSpeed: number;
  };

  /** Fired during drunken stagger walking strides */
  PLAYER_STEP: {
    foot: 'left' | 'right';
    stride: number;
  };

  /** Fired when movement velocity changes */
  VELOCITY_CHANGE: {
    vx: number;
    vy: number;
    speedRatio: number; // -1.0 to 1.0 normalized
    isGrounded: boolean;
  };

  /** Fired as the robot tilts and sways */
  LEAN_CHANGE: {
    angle: number; // in degrees
    balance: number; // -1.0 (far left) to 1.0 (far right)
  };

  /** Fired when a glowing copper tip (coin/gear) is collected */
  TIP_COLLECTED: {
    x: number;
    y: number;
    totalTips: number;
    momentum: number;
  };

  /** Fired when the robot collides with a street hazard */
  HAZARD_HIT: {
    x: number;
    y: number;
    hazardType: 'crate' | 'puddle';
  };

  /** Fired when busking momentum value changes */
  MOMENTUM_CHANGE: {
    momentum: number;
    previousMomentum: number;
    tier: number;
  };

  /** Fired when momentum crosses into a new ensemble companion tier */
  TIER_CHANGE: {
    tier: number;
    tierName: string;
    activeInstruments: InstrumentId[];
  };

  /** Fired when distance progression transitions into a new narrative Act biome */
  ACT_CHANGE: {
    act: number;
    name: string;
  };

  /** Fired when player begins the journey from the Title screen */
  GAME_START: Record<string, never>;

  /** Fired when the robot runs out of momentum (passed out) after initial grace period */
  GAME_OVER: {
    distanceTraveled: number;
    tips: number;
  };

  /** Fired when the robot reaches home after navigating all 5 acts */
  VICTORY: {
    distanceTraveled: number;
    tips: number;
  };

  /** Fired when the player retries after game over */
  RESTART_GAME: Record<string, never>;

  /** Fired when game pause state toggles */
  GAME_PAUSE: {
    isPaused: boolean;
  };

  /** Fired to request audio studio sidebar collapse or expansion */
  UI_SET_SIDEBAR: {
    collapsed: boolean;
  };
}

export type GameEventType = keyof GameEventMap;
export type GameEventHandler<T extends GameEventType> = (payload: GameEventMap[T]) => void;

export class EventBus {
  private listeners: { [K in GameEventType]?: Set<GameEventHandler<K>> } = {};

  /**
   * Subscribe to a game event. Returns an unsubscribe function.
   */
  public on<T extends GameEventType>(event: T, handler: GameEventHandler<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set() as any;
    }
    const handlers = this.listeners[event] as Set<GameEventHandler<T>>;
    handlers.add(handler);

    return () => {
      this.off(event, handler);
    };
  }

  /**
   * Subscribe to a game event once.
   */
  public once<T extends GameEventType>(event: T, handler: GameEventHandler<T>): () => void {
    const wrapper: GameEventHandler<T> = (payload) => {
      this.off(event, wrapper);
      handler(payload);
    };
    return this.on(event, wrapper);
  }

  /**
   * Unsubscribe from a game event.
   */
  public off<T extends GameEventType>(event: T, handler: GameEventHandler<T>): void {
    const handlers = this.listeners[event] as Set<GameEventHandler<T>> | undefined;
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        delete this.listeners[event];
      }
    }
  }

  /**
   * Emit an event with typed payload to all subscribers.
   */
  public emit<T extends GameEventType>(event: T, payload: GameEventMap[T]): void {
    const handlers = this.listeners[event] as Set<GameEventHandler<T>> | undefined;
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[EventBus] Error in handler for event '${event}':`, err);
        }
      });
    }
  }

  /**
   * Remove all registered listeners.
   */
  public clear(): void {
    this.listeners = {};
  }
}

/** Global singleton instance */
export const eventBus = new EventBus();
