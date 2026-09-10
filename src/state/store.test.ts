import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus, type GameEventMap } from './eventBus.ts';
import { ACT_DEFINITIONS, GameStore, TIERS, VICTORY_DISTANCE } from './store.ts';

describe('GameStore', () => {
  let store: GameStore;

  beforeEach(() => {
    eventBus.clear();
    store = new GameStore();
  });

  it('reset() announces Act 1 so audio and visuals re-apply its config', () => {
    const onAct = vi.fn();
    eventBus.on('ACT_CHANGE', onAct);
    store.reset();
    expect(onAct).toHaveBeenCalledWith({ act: 1, name: ACT_DEFINITIONS[0].name });
  });

  it('advances acts at each minDistance threshold, in order', () => {
    const acts: number[] = [];
    eventBus.on('ACT_CHANGE', (e) => acts.push(e.act));
    for (const def of ACT_DEFINITIONS.slice(1)) {
      store.updateDistance(def.minDistance - 1);
      store.updateDistance(def.minDistance);
    }
    expect(acts).toEqual([2, 3, 4, 5]);
    expect(store.getState().activeAct).toBe(5);
  });

  it('triggers victory once distance reaches VICTORY_DISTANCE', () => {
    const onVictory = vi.fn();
    eventBus.on('VICTORY', onVictory);
    store.updateDistance(VICTORY_DISTANCE - 1);
    expect(onVictory).not.toHaveBeenCalled();
    store.updateDistance(VICTORY_DISTANCE);
    expect(onVictory).toHaveBeenCalledTimes(1);
    expect(store.getState().victory).toBe(true);
  });

  it('does not end the game on zero momentum inside the 10 s grace period', () => {
    const onGameOver = vi.fn();
    eventBus.on('GAME_OVER', onGameOver);
    store.adjustMomentum(-100);
    expect(store.getState().momentum).toBe(0);
    expect(onGameOver).not.toHaveBeenCalled();

    // 9 seconds of decay: still in grace
    for (let i = 0; i < 9; i++) store.decayMomentum(1);
    expect(onGameOver).not.toHaveBeenCalled();

    // crossing 10 s with zero momentum ends the run
    store.decayMomentum(1);
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(store.getState().game_over).toBe(true);
  });

  it('coalesces high-frequency mutations into one notification per flush()', () => {
    const listener = vi.fn();
    store.subscribe(listener); // subscribe delivers once immediately
    listener.mockClear();

    for (let i = 0; i < 60; i++) {
      store.decayMomentum(1 / 60);
      store.updateDistance(i * 3);
    }
    expect(listener).not.toHaveBeenCalled();

    store.flush();
    expect(listener).toHaveBeenCalledTimes(1);

    store.flush();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifies immediately on discrete transitions such as a tier change', () => {
    const listener = vi.fn();
    const onTier = vi.fn<(e: GameEventMap['TIER_CHANGE']) => void>();
    store.subscribe(listener);
    listener.mockClear();
    eventBus.on('TIER_CHANGE', onTier);

    store.adjustMomentum(100);
    expect(onTier).toHaveBeenCalledTimes(1);
    expect(onTier.mock.calls[0][0].tier).toBe(TIERS[TIERS.length - 1].tier);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores tips, decay, and distance while paused', () => {
    store.setPaused(true);
    const before = store.getState().momentum;
    store.addTips(3);
    store.decayMomentum(5);
    store.updateDistance(5000);
    expect(store.getState().tips).toBe(0);
    expect(store.getState().momentum).toBe(before);
    expect(store.getState().distanceTraveled).toBe(0);
  });

  it('cannot pause after game over', () => {
    store.adjustMomentum(-100);
    for (let i = 0; i < 11; i++) store.decayMomentum(1);
    expect(store.getState().game_over).toBe(true);
    store.setPaused(true);
    expect(store.isPaused()).toBe(false);
  });

  it('applies the tips buff multiplier and expires it', () => {
    const onDeactivate = vi.fn();
    eventBus.on('BUFF_DEACTIVATED', onDeactivate);
    store.activateBuff('tips', 2);
    store.addTips(1);
    expect(store.getState().tips).toBe(2);
    store.updateBuffTimer(1.5);
    expect(store.getState().activeBuff).toBe('tips');
    store.updateBuffTimer(0.6);
    expect(store.getState().activeBuff).toBeNull();
    expect(onDeactivate).toHaveBeenCalledWith({ buff: 'tips' });
  });
});
