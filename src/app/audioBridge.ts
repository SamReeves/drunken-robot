import { audioEngine } from '../audio/engine.ts';
import { Conductor } from '../audio/conductor.ts';
import { EnsembleMixer } from '../audio/mixer.ts';
import { getTriadChord } from '../audio/scales.ts';
import type { InstrumentId } from '../audio/types.ts';
import { eventBus } from '../state/eventBus.ts';
import { store } from '../state/store.ts';

/**
 * The only place the game layer's events and state reach the audio layer.
 * No DOM here: the debug dashboard subscribes to the same events separately.
 */
export interface AudioBridge {
  mixer: EnsembleMixer;
  conductor: Conductor;
}

const ALL_INSTRUMENTS: InstrumentId[] = ['accordion', 'bass', 'percussion', 'guitar', 'violin', 'clarinet'];
const RESTING_BELLOWS_PRESSURE = 0.75;

export function createAudioBridge(): AudioBridge {
  const mixer = new EnsembleMixer();
  const conductor = new Conductor(mixer);
  const { accordion, bass, percussion, violin } = conductor;

  const startConductor = (label: string): void => {
    void conductor.start().catch((err: unknown) => {
      console.warn(`[audioBridge] Could not start conductor on ${label}:`, err);
    });
  };

  // Recruitment follows the momentum tier.
  store.subscribe((state) => {
    for (const id of ALL_INSTRUMENTS) {
      const shouldBeActive = state.activeInstruments.includes(id);
      const current = mixer.getChannelState(id);
      if (current && current.recruited !== shouldBeActive) {
        mixer.setRecruited(id, shouldBeActive);
      }
    }
  });

  eventBus.on('BELLOWS_COMPRESS', (e) => {
    if (e.isCharging) {
      accordion.setBellowsPressure(Math.max(0.1, e.pressure), 0.02);
    } else {
      // Release: settle back instead of staying pinned at the peak.
      accordion.setBellowsPressure(RESTING_BELLOWS_PRESSURE, 0.15);
    }
  });

  eventBus.on('BELLOWS_BURST', (e) => {
    if (!audioEngine.isReady) return;
    const chord = getTriadChord(conductor.scale, 1, 4);
    accordion.triggerAttackRelease(chord, '8n', undefined, 0.6 + e.pressure * 0.4);
  });

  eventBus.on('TIP_COLLECTED', () => {
    if (!audioEngine.isReady) return;
    percussion.triggerCastanet(undefined, 0.75);
  });

  eventBus.on('BUFF_ACTIVATED', (e) => {
    if (!audioEngine.isReady) return;
    switch (e.buff) {
      case 'tips':
        percussion.triggerCastanet(undefined, 0.95);
        break;
      case 'balance':
        accordion.triggerAttackRelease(getTriadChord(conductor.scale, 5, 4), '4n', undefined, 0.85);
        break;
      case 'steam':
        percussion.triggerStomp(undefined, 0.9);
        accordion.triggerAttackRelease(getTriadChord(conductor.scale, 1, 5), '8n', undefined, 0.9);
        break;
      case 'shield':
        percussion.triggerMetal(undefined, 0.8);
        percussion.triggerCastanet(undefined, 0.7);
        break;
    }
  });

  eventBus.on('SHIELD_BLOCKED', () => {
    if (!audioEngine.isReady) return;
    percussion.triggerMetal(undefined, 0.9);
    percussion.triggerStomp(undefined, 0.6);
  });

  eventBus.on('PLAYER_STUMBLE', () => {
    if (!audioEngine.isReady) return;
    percussion.triggerStomp(undefined, 0.95);
    percussion.triggerCastanet(undefined, 0.9);
    // Stumbling warps the meter into alternating 4/4 and 7/8 until momentum recovers.
    conductor.setMeter('ALTERNATING');
  });

  eventBus.on('TIER_CHANGE', (e) => {
    if (!audioEngine.isReady) return;
    if (e.tier >= 2) {
      const actAudio = store.getCurrentActDefinition().audioConfig;
      conductor.setMeter(actAudio.meter);
      conductor.setBpm(actAudio.bpm);
    }
  });

  eventBus.on('PLAYER_LAND', (e) => {
    if (!audioEngine.isReady || e.impactSpeed <= 250) return;
    percussion.triggerStomp(undefined, Math.min(1.0, e.impactSpeed / 700));
  });

  eventBus.on('ACT_CHANGE', (payload) => {
    const { scale, meter, bpm } = store.getActDefinition(payload.act).audioConfig;
    conductor.setScale(scale);
    conductor.setMeter(meter);
    conductor.setBpm(bpm);
  });

  eventBus.on('GAME_START', () => {
    void audioEngine
      .init()
      .then(() => conductor.start())
      .catch((err: unknown) => console.warn('[audioBridge] Could not start audio on GAME_START:', err));
  });

  eventBus.on('GAME_OVER', () => {
    conductor.pause();
    if (!audioEngine.isReady) return;
    bass.triggerAttackRelease('D1', '2n', undefined, 0.9);
    percussion.triggerStomp(undefined, 0.95);
  });

  eventBus.on('VICTORY', () => {
    if (audioEngine.isReady) {
      accordion.triggerAttackRelease(['D4', 'F#4', 'A4', 'D5'], '1m', undefined, 0.95);
      violin.triggerAttackRelease('D5', '1m', undefined, 0.9);
      percussion.triggerStomp(undefined, 0.85);
    }
    conductor.pause();
  });

  eventBus.on('RESTART_GAME', () => {
    // Rewind the musical clock; act-1 config arrives via the ACT_CHANGE that reset() emits.
    conductor.stop();
    startConductor('RESTART_GAME');
  });

  eventBus.on('GAME_PAUSE', (payload) => {
    if (payload.isPaused) {
      conductor.pause();
    } else {
      startConductor('GAME_PAUSE');
    }
  });

  return { mixer, conductor };
}
