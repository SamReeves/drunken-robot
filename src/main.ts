import './style.css';
import { audioEngine } from './audio/engine.ts';
import { Conductor } from './audio/conductor.ts';
import { EnsembleMixer } from './audio/mixer.ts';
import { SCALES, getScaleNotes, getTriadChord } from './audio/scales.ts';
import { initGame, refreshGameScale } from './game/engine.ts';
import { eventBus } from './state/eventBus.ts';
import { store } from './state/store.ts';
import type {
  AudioEngineState,
  ConductorStepEvent,
  EnsemblePreset,
  InstrumentChannelState,
  InstrumentId,
  MeterType,
  ScaleName,
} from './audio/types.ts';

// -------------------------------------------------------------
// 1. Initialize Phaser 4 Game Engine & Scale Management
// -------------------------------------------------------------
// Boot the Phaser canvas on page ready
initGame('game-container');

// Sidebar Collapse / Expand Toggle
const appLayout = document.querySelector<HTMLDivElement>('#app')!;
const btnToggleSidebar = document.querySelector<HTMLButtonElement>('#btn-toggle-sidebar')!;
const toggleIcon = btnToggleSidebar?.querySelector<HTMLSpanElement>('.toggle-icon');

function setSidebarCollapsed(collapsed: boolean): void {
  if (collapsed) {
    appLayout.classList.add('sidebar-collapsed');
  } else {
    appLayout.classList.remove('sidebar-collapsed');
  }
  if (toggleIcon) {
    toggleIcon.textContent = collapsed ? '⮞' : '⮜';
  }

  // Refresh Phaser canvas scaling after CSS transition finishes
  setTimeout(() => {
    refreshGameScale();
  }, 320);
}

function toggleSidebar(): void {
  const isCollapsed = !appLayout.classList.contains('sidebar-collapsed');
  setSidebarCollapsed(isCollapsed);
}

if (btnToggleSidebar) {
  btnToggleSidebar.addEventListener('click', () => {
    toggleSidebar();
  });
}

// Window resize listener to recalculate canvas fit
window.addEventListener('resize', () => {
  refreshGameScale();
});

// -------------------------------------------------------------
// 2. Instantiate Core Ensemble Audio Components
// -------------------------------------------------------------
const mixer = new EnsembleMixer();
const conductor = new Conductor(mixer);

const { accordion, bass, percussion, guitar, violin, clarinet } = conductor;

// -------------------------------------------------------------
// 3. DOM Element References
// -------------------------------------------------------------
const statusBadge = document.querySelector<HTMLSpanElement>('#audio-status-badge')!;
const btnUnlock = document.querySelector<HTMLButtonElement>('#btn-unlock')!;
const btnPlay = document.querySelector<HTMLButtonElement>('#btn-play')!;
const btnPause = document.querySelector<HTMLButtonElement>('#btn-pause')!;
const btnStop = document.querySelector<HTMLButtonElement>('#btn-stop')!;

const bpmSlider = document.querySelector<HTMLInputElement>('#bpm-slider')!;
const bpmVal = document.querySelector<HTMLSpanElement>('#bpm-val')!;

const meterBtns = document.querySelectorAll<HTMLButtonElement>('[data-meter]');
const scaleBtns = document.querySelectorAll<HTMLButtonElement>('[data-scale]');
const scaleDesc = document.querySelector<HTMLParagraphElement>('#scale-description')!;

const presetBtns = document.querySelectorAll<HTMLButtonElement>('[data-preset]');
const mixerRack = document.querySelector<HTMLDivElement>('#mixer-rack')!;

const bellowsSlider = document.querySelector<HTMLInputElement>('#bellows-slider')!;
const bellowsVal = document.querySelector<HTMLSpanElement>('#bellows-val')!;
const musetteSlider = document.querySelector<HTMLInputElement>('#musette-slider')!;
const musetteVal = document.querySelector<HTMLSpanElement>('#musette-val')!;

const measureDisplay = document.querySelector<HTMLSpanElement>('#measure-display')!;
const meterDisplay = document.querySelector<HTMLSpanElement>('#meter-display')!;
const lastNoteDisplay = document.querySelector<HTMLSpanElement>('#last-note-display')!;
const beatLedStrip = document.querySelector<HTMLDivElement>('#beat-led-strip')!;
const virtualKeyboard = document.querySelector<HTMLDivElement>('#virtual-keyboard')!;

// -------------------------------------------------------------
// 4. Audio Engine State Subscription
// -------------------------------------------------------------
audioEngine.subscribe((state: AudioEngineState) => {
  if (state === 'running') {
    statusBadge.textContent = 'Running';
    statusBadge.className = 'badge badge-running';
    btnUnlock.textContent = '✓ Engine Unlocked';
    btnUnlock.disabled = true;
    btnPlay.disabled = false;
    btnPause.disabled = false;
    btnStop.disabled = false;
  } else {
    statusBadge.textContent = state === 'suspended' ? 'Suspended' : state;
    statusBadge.className = 'badge badge-suspended';
    btnUnlock.textContent = '🔊 Initialize & Unlock Engine';
    btnUnlock.disabled = false;
    btnPlay.disabled = true;
    btnPause.disabled = true;
    btnStop.disabled = true;
  }
});

btnUnlock.addEventListener('click', async () => {
  try {
    await audioEngine.init();
    initGame('game-container');
    refreshGameScale();
  } catch (err) {
    console.error('Failed to unlock audio context:', err);
  }
});

// -------------------------------------------------------------
// 5. Transport Controls
// -------------------------------------------------------------
btnPlay.addEventListener('click', async () => {
  try {
    store.setPaused(false);
    await conductor.start();
    btnPlay.classList.add('active');
    btnPause.classList.remove('active');
  } catch (err) {
    console.error('Failed to start conductor:', err);
  }
});

btnPause.addEventListener('click', () => {
  store.setPaused(true);
  conductor.pause();
  btnPlay.classList.remove('active');
  btnPause.classList.add('active');
});

btnStop.addEventListener('click', () => {
  conductor.stop();
  resetLeds();
  resetChannelActivityLeds();
  measureDisplay.textContent = 'Measure: 0';
  lastNoteDisplay.textContent = 'Last: -';
});

// Tempo Slider
bpmSlider.addEventListener('input', (e) => {
  const bpm = Number((e.target as HTMLInputElement).value);
  bpmVal.textContent = `${bpm} BPM`;
  conductor.setBpm(bpm);
});

// -------------------------------------------------------------
// 6. Meter Selection
// -------------------------------------------------------------
function updateMeterLeds(meter: MeterType): void {
  beatLedStrip.innerHTML = '';
  const total = meter === '4/4' ? 8 : 7;
  const is322 = meter === '7/8_322';
  const is223 = meter === '7/8_223';

  for (let i = 0; i < total; i++) {
    const node = document.createElement('div');
    node.className = 'led-node';
    node.id = `led-step-${i}`;

    let isAccent = false;
    if (meter === '4/4') {
      isAccent = i === 0 || i === 4;
    } else if (is322) {
      isAccent = i === 0 || i === 3 || i === 5;
    } else if (is223) {
      isAccent = i === 0 || i === 2 || i === 4;
    } else {
      isAccent = i === 0 || i === 3 || i === 5;
    }

    if (isAccent) {
      node.classList.add('accent');
    }

    const light = document.createElement('div');
    light.className = 'led-light';

    const label = document.createElement('span');
    label.className = 'led-label';
    label.textContent = `${i + 1}`;

    node.appendChild(light);
    node.appendChild(label);
    beatLedStrip.appendChild(node);
  }
}

meterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    meterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const meter = btn.dataset.meter as MeterType;
    conductor.setMeter(meter);
    meterDisplay.textContent = `Meter: ${btn.textContent?.trim() ?? meter}`;
    updateMeterLeds(meter);
  });
});

// -------------------------------------------------------------
// 7. Scale Selection & Dynamic Virtual Keyboard
// -------------------------------------------------------------
function renderVirtualKeyboard(scaleName: ScaleName): void {
  virtualKeyboard.innerHTML = '';
  const notes = getScaleNotes(scaleName, 4);
  const scale = SCALES[scaleName];
  scaleDesc.textContent = scale.characteristicMood;

  notes.forEach((note, index) => {
    const keyBtn = document.createElement('button');
    keyBtn.type = 'button';
    keyBtn.className = 'key-btn';
    keyBtn.dataset.note = note;

    const noteName = document.createElement('span');
    noteName.className = 'note-name';
    noteName.textContent = note;

    const degreeSpan = document.createElement('span');
    degreeSpan.className = 'degree';
    degreeSpan.textContent = `Deg ${index + 1}`;

    keyBtn.appendChild(noteName);
    keyBtn.appendChild(degreeSpan);

    const triggerNoteOn = (e: Event) => {
      e.preventDefault();
      keyBtn.classList.add('pressed');
      audioEngine.init().then(() => {
        accordion.triggerAttack(note, undefined, 0.85);
      });
    };

    const triggerNoteOff = (e: Event) => {
      e.preventDefault();
      keyBtn.classList.remove('pressed');
      accordion.triggerRelease(note);
    };

    keyBtn.addEventListener('mousedown', triggerNoteOn);
    keyBtn.addEventListener('mouseup', triggerNoteOff);
    keyBtn.addEventListener('mouseleave', triggerNoteOff);

    keyBtn.addEventListener('touchstart', triggerNoteOn, { passive: false });
    keyBtn.addEventListener('touchend', triggerNoteOff, { passive: false });
    keyBtn.addEventListener('touchcancel', triggerNoteOff, { passive: false });

    virtualKeyboard.appendChild(keyBtn);
  });
}

scaleBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    scaleBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const scale = btn.dataset.scale as ScaleName;
    conductor.setScale(scale);
    renderVirtualKeyboard(scale);
  });
});

// -------------------------------------------------------------
// 8. Ensemble Presets
// -------------------------------------------------------------
presetBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    presetBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const preset = btn.dataset.preset as EnsemblePreset;
    mixer.applyPreset(preset);
  });
});

// -------------------------------------------------------------
// 9. Dynamic 6-Track Mixer Rack Rendering & Event Binding
// -------------------------------------------------------------
function renderMixerRack(channels: InstrumentChannelState[]): void {
  mixerRack.innerHTML = '';

  channels.forEach((ch) => {
    const strip = document.createElement('div');
    strip.className = `channel-strip ${ch.recruited ? 'recruited' : 'locked'}`;
    strip.id = `strip-${ch.id}`;

    // Header
    const header = document.createElement('div');
    header.className = 'channel-header';

    const titleRow = document.createElement('div');
    titleRow.className = 'channel-title-row';

    const name = document.createElement('span');
    name.className = 'channel-name';
    name.textContent = ch.name;
    name.title = ch.displayName;
    name.style.borderLeft = `3px solid ${ch.color}`;
    name.style.paddingLeft = '4px';

    const activityLed = document.createElement('div');
    activityLed.className = 'channel-activity-led';
    activityLed.id = `activity-led-${ch.id}`;

    titleRow.appendChild(name);
    titleRow.appendChild(activityLed);

    const role = document.createElement('div');
    role.className = 'channel-role';
    role.textContent = ch.role;

    header.appendChild(titleRow);
    header.appendChild(role);

    // Recruitment Toggle
    const btnRecruit = document.createElement('button');
    btnRecruit.type = 'button';
    btnRecruit.className = `btn-recruit ${ch.recruited ? 'recruited' : 'locked'}`;
    btnRecruit.textContent = ch.recruited ? '✓ Active' : '+ Recruit';
    btnRecruit.addEventListener('click', () => {
      mixer.setRecruited(ch.id, !ch.recruited);
    });

    // Mute / Solo Buttons Row
    const muteSoloRow = document.createElement('div');
    muteSoloRow.className = 'channel-mute-solo-row';

    const btnMute = document.createElement('button');
    btnMute.type = 'button';
    btnMute.className = `btn-mute ${ch.muted ? 'active' : ''}`;
    btnMute.textContent = 'M';
    btnMute.title = 'Mute Channel';
    btnMute.addEventListener('click', () => {
      mixer.setMute(ch.id, !ch.muted);
    });

    const btnSolo = document.createElement('button');
    btnSolo.type = 'button';
    btnSolo.className = `btn-solo ${ch.solo ? 'active' : ''}`;
    btnSolo.textContent = 'S';
    btnSolo.title = 'Solo Channel';
    btnSolo.addEventListener('click', () => {
      mixer.setSolo(ch.id, !ch.solo);
    });

    muteSoloRow.appendChild(btnMute);
    muteSoloRow.appendChild(btnSolo);

    // Faders
    const fadersDiv = document.createElement('div');
    fadersDiv.className = 'channel-faders';

    // Volume Slider
    const volGroup = document.createElement('div');
    volGroup.className = 'fader-group';
    const volHeader = document.createElement('div');
    volHeader.className = 'fader-label-row';
    volHeader.innerHTML = `<span>Vol</span><span class="fader-val" id="vol-val-${ch.id}">${ch.volume}dB</span>`;
    const volInput = document.createElement('input');
    volInput.type = 'range';
    volInput.min = '-40';
    volInput.max = '6';
    volInput.value = String(ch.volume);
    volInput.step = '1';
    volInput.addEventListener('input', (e) => {
      const db = Number((e.target as HTMLInputElement).value);
      const valSpan = document.querySelector(`#vol-val-${ch.id}`);
      if (valSpan) valSpan.textContent = `${db}dB`;
      mixer.setVolume(ch.id, db);
    });
    volGroup.appendChild(volHeader);
    volGroup.appendChild(volInput);

    // Pan Slider
    const panGroup = document.createElement('div');
    panGroup.className = 'pan-group';
    const panHeader = document.createElement('div');
    panHeader.className = 'fader-label-row';
    const formatPan = (p: number) => (p === 0 ? 'C' : p < 0 ? `L${Math.round(-p * 100)}` : `R${Math.round(p * 100)}`);
    panHeader.innerHTML = `<span>Pan</span><span class="fader-val" id="pan-val-${ch.id}">${formatPan(ch.pan)}</span>`;
    const panInput = document.createElement('input');
    panInput.type = 'range';
    panInput.min = '-1';
    panInput.max = '1';
    panInput.value = String(ch.pan);
    panInput.step = '0.05';
    panInput.addEventListener('input', (e) => {
      const p = Number((e.target as HTMLInputElement).value);
      const valSpan = document.querySelector(`#pan-val-${ch.id}`);
      if (valSpan) valSpan.textContent = formatPan(p);
      mixer.setPan(ch.id, p);
    });
    panGroup.appendChild(panHeader);
    panGroup.appendChild(panInput);

    fadersDiv.appendChild(volGroup);
    fadersDiv.appendChild(panGroup);

    // Audition Button
    const btnAudition = document.createElement('button');
    btnAudition.type = 'button';
    btnAudition.className = 'btn-audition';
    btnAudition.textContent = '▶ Audition';
    btnAudition.addEventListener('click', async () => {
      await audioEngine.init();
      auditionInstrument(ch.id);
    });

    strip.appendChild(header);
    strip.appendChild(btnRecruit);
    strip.appendChild(muteSoloRow);
    strip.appendChild(fadersDiv);
    strip.appendChild(btnAudition);

    mixerRack.appendChild(strip);
  });
}

function auditionInstrument(id: InstrumentId): void {
  const activeScale = conductor.scale;
  const now = undefined;

  switch (id) {
    case 'accordion': {
      const chord = getTriadChord(activeScale, 1, 4);
      accordion.triggerAttackRelease(chord, '4n', now, 0.85);
      break;
    }
    case 'bass': {
      bass.triggerAttackRelease('D2', '4n', now, 0.95);
      break;
    }
    case 'percussion': {
      percussion.triggerStomp(now, 0.95);
      percussion.triggerCastanet(undefined, 0.85);
      break;
    }
    case 'guitar': {
      const chord = getTriadChord(activeScale, 1, 3);
      guitar.strumChord(chord, now, 'down', 0.018, '4n');
      break;
    }
    case 'violin': {
      const leadNote = activeScale === 'D_PHRYGIAN_DOMINANT' ? 'F#5' : 'F5';
      violin.triggerAttackRelease(leadNote, '2n', now, 0.9);
      break;
    }
    case 'clarinet': {
      clarinet.triggerKrekhts('D5', now, '4n');
      break;
    }
  }

  flashChannelLed(id);
}

function flashChannelLed(id: InstrumentId): void {
  const led = document.querySelector<HTMLDivElement>(`#activity-led-${id}`);
  if (led) {
    led.classList.add('active');
    setTimeout(() => led.classList.remove('active'), 120);
  }
}

function resetChannelActivityLeds(): void {
  const leds = document.querySelectorAll<HTMLDivElement>('.channel-activity-led');
  leds.forEach((l) => l.classList.remove('active'));
}

// Subscribe to mixer channel updates
mixer.subscribe((channels) => {
  renderMixerRack(channels);
});

// -------------------------------------------------------------
// 10. Synth Parameter Sliders (Accordion)
// -------------------------------------------------------------
bellowsSlider.addEventListener('input', (e) => {
  const percent = Number((e.target as HTMLInputElement).value);
  const ratio = percent / 100;
  bellowsVal.textContent = `${percent}%`;
  accordion.setBellowsPressure(ratio);
});

musetteSlider.addEventListener('input', (e) => {
  const cents = Number((e.target as HTMLInputElement).value);
  musetteVal.textContent = `+${cents} Cents`;
  accordion.setMusetteDetune(cents);
});

// -------------------------------------------------------------
// 11. Conductor Real-time Step Callback
// -------------------------------------------------------------
function resetLeds(): void {
  const activeNodes = beatLedStrip.querySelectorAll('.active-step');
  activeNodes.forEach((node) => node.classList.remove('active-step'));
}

conductor.onStep((event: ConductorStepEvent) => {
  measureDisplay.textContent = `Measure: ${event.measureCount + 1}`;
  meterDisplay.textContent = `Meter: ${event.meter} (${event.totalSteps}/8)`;
  if (event.note) {
    lastNoteDisplay.textContent = `Last: ${event.note}`;
  }

  // Rebuild LEDs if total steps changed (e.g. alternating mode)
  if (beatLedStrip.children.length !== event.totalSteps) {
    updateMeterLeds(event.meter);
  }

  // Update metronome step LED
  resetLeds();
  const currentLed = document.querySelector<HTMLDivElement>(`#led-step-${event.stepIndex}`);
  if (currentLed) {
    currentLed.classList.add('active-step');
  }

  // Flash active instrument LEDs for voices triggered on this step
  if (event.triggers) {
    (Object.keys(event.triggers) as InstrumentId[]).forEach((instId) => {
      if (mixer.isInstrumentActive(instId)) {
        flashChannelLed(instId);
      }
    });
  }
});

// -------------------------------------------------------------
// 12. Initial Setup
// -------------------------------------------------------------
updateMeterLeds('7/8_322');
renderVirtualKeyboard('D_PHRYGIAN_DOMINANT');

// -------------------------------------------------------------
// 13. Decoupled EventBus Audio Bridge & Dynamic Momentum Store
// -------------------------------------------------------------
// Bridge State Store to EnsembleMixer (Auto-recruitment / unmuting of companions by momentum tier)
store.subscribe((state) => {
  const allInstrumentIds: InstrumentId[] = ['accordion', 'bass', 'percussion', 'guitar', 'violin', 'clarinet'];
  allInstrumentIds.forEach((id) => {
    const shouldBeActive = state.activeInstruments.includes(id);
    const current = mixer.getChannelState(id);
    if (current && current.recruited !== shouldBeActive) {
      mixer.setRecruited(id, shouldBeActive);
    }
  });
});

eventBus.on('BELLOWS_COMPRESS', (e) => {
  if (e.isCharging) {
    const dynamicPressure = Math.max(0.1, e.pressure);
    accordion.setBellowsPressure(dynamicPressure, 0.02);
    bellowsSlider.value = String(Math.round(e.pressure * 100));
    bellowsVal.textContent = `${Math.round(e.pressure * 100)}%`;
  }
});

eventBus.on('BELLOWS_BURST', (e) => {
  if (audioEngine.isReady) {
    const chord = getTriadChord(conductor.scale, 1, 4);
    accordion.triggerAttackRelease(chord, '8n', undefined, 0.6 + e.pressure * 0.4);
    flashChannelLed('accordion');
  }
});

eventBus.on('TIP_COLLECTED', (_e) => {
  if (audioEngine.isReady) {
    // Subtle castanet sparkle / rhythmic chime on pickup
    percussion.triggerCastanet(undefined, 0.75);
    flashChannelLed('percussion');
  }
});

eventBus.on('BUFF_ACTIVATED', (e) => {
  if (audioEngine.isReady) {
    if (e.buff === 'tips') {
      // Golden Sunflower: Double castanet chime flourish
      percussion.triggerCastanet(undefined, 0.95);
      flashChannelLed('percussion');
    } else if (e.buff === 'balance') {
      // Gypsy Brandy: Warm accordion harmonic chord
      const chord = getTriadChord(conductor.scale, 5, 4);
      accordion.triggerAttackRelease(chord, '4n', undefined, 0.85);
      flashChannelLed('accordion');
    } else if (e.buff === 'jump') {
      // Steam & Invulnerability: Stomp & chord burst
      percussion.triggerStomp(undefined, 0.9);
      const chord = getTriadChord(conductor.scale, 1, 5);
      accordion.triggerAttackRelease(chord, '8n', undefined, 0.9);
      flashChannelLed('accordion');
      flashChannelLed('percussion');
    }
  }
});

eventBus.on('PLAYER_STUMBLE', (_e) => {
  if (audioEngine.isReady) {
    percussion.triggerStomp(undefined, 0.95);
    percussion.triggerCastanet(undefined, 0.9);
    flashChannelLed('percussion');

    // Stumbling warps the time signature into chaotic alternating Balkan meter (4/4 ↔ 7/8)
    conductor.setMeter('ALTERNATING');
    const alternatingBtn = Array.from(meterBtns).find((b) => b.dataset.meter === 'ALTERNATING');
    meterDisplay.textContent = `Meter: ${alternatingBtn?.textContent?.trim() ?? '4/4 ↔ 7/8'}`;
    meterBtns.forEach((b) => {
      b.classList.toggle('active', b.dataset.meter === 'ALTERNATING');
    });
    updateMeterLeds('ALTERNATING');
  }
});

eventBus.on('TIER_CHANGE', (e) => {
  if (audioEngine.isReady) {
    // Flash newly activated instruments
    e.activeInstruments.forEach((id) => flashChannelLed(id));

    // When the player regains balance/momentum (Tier 2+), restore the current Act's native meter & BPM
    if (e.tier >= 2) {
      const currentActAudio = store.getCurrentActDefinition().audioConfig;
      conductor.setMeter(currentActAudio.meter);
      conductor.setBpm(currentActAudio.bpm);

      // Synchronize DOM elements to match restored biome settings
      const activeMeterBtn = Array.from(meterBtns).find((b) => b.dataset.meter === currentActAudio.meter);
      meterDisplay.textContent = `Meter: ${activeMeterBtn?.textContent?.trim() ?? currentActAudio.meter}`;
      meterBtns.forEach((b) => {
        b.classList.toggle('active', b.dataset.meter === currentActAudio.meter);
      });
      updateMeterLeds(currentActAudio.meter);

      bpmSlider.value = String(currentActAudio.bpm);
      bpmVal.textContent = `${currentActAudio.bpm} BPM`;
    }
  }
});

eventBus.on('PLAYER_LAND', (e) => {
  if (audioEngine.isReady && e.impactSpeed > 250) {
    const vol = Math.min(1.0, e.impactSpeed / 700);
    percussion.triggerStomp(undefined, vol);
    flashChannelLed('percussion');
  }
});

// -------------------------------------------------------------
// 14. Narrative Biome Audio Transitions (Act Shifts)
// -------------------------------------------------------------
eventBus.on('ACT_CHANGE', (payload) => {
  const actDef = store.getActDefinition(payload.act);
  if (!actDef) return;

  const { scale, meter, bpm } = actDef.audioConfig;

  // 1. Dynamically update Conductor Scale, Meter, and Tempo
  conductor.setScale(scale);
  conductor.setMeter(meter);
  conductor.setBpm(bpm);

  // 2. Synchronize DOM Scale UI & Virtual Keyboard
  scaleBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.scale === scale);
  });
  renderVirtualKeyboard(scale);

  // 3. Synchronize DOM Meter UI & Metronome LEDs
  meterBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.meter === meter);
  });
  const activeMeterBtn = Array.from(meterBtns).find((b) => b.dataset.meter === meter);
  meterDisplay.textContent = `Meter: ${activeMeterBtn?.textContent?.trim() ?? meter}`;
  updateMeterLeds(meter);

  // 4. Synchronize DOM BPM Slider UI
  bpmSlider.value = String(bpm);
  bpmVal.textContent = `${bpm} BPM`;
});

// -------------------------------------------------------------
// 15. Game Flow Audio Orchestration (Start, Failure, Victory, Restart)
// -------------------------------------------------------------
eventBus.on('GAME_START', async () => {
  try {
    if (!audioEngine.isReady) {
      await audioEngine.init();
    }
    await conductor.start();
    btnPlay.classList.add('active');
    btnPause.classList.remove('active');
  } catch (err) {
    console.warn('[main] Error starting conductor on GAME_START:', err);
  }
});

eventBus.on('GAME_OVER', () => {
  conductor.pause();
  btnPlay.classList.remove('active');
  btnPause.classList.add('active');

  if (audioEngine.isReady) {
    // Low, stumbling bass drop and heavy percussive thud
    bass.triggerAttackRelease('D1', '2n', undefined, 0.9);
    percussion.triggerStomp(undefined, 0.95);
    flashChannelLed('bass');
    flashChannelLed('percussion');
  }
});

eventBus.on('VICTORY', () => {
  if (audioEngine.isReady) {
    // Triumphant closing chord on accordion and violin, then pause rhythmic loop
    const victoryChord = ['D4', 'F#4', 'A4', 'D5'];
    accordion.triggerAttackRelease(victoryChord, '1m', undefined, 0.95);
    violin.triggerAttackRelease('D5', '1m', undefined, 0.9);
    percussion.triggerStomp(undefined, 0.85);
    flashChannelLed('accordion');
    flashChannelLed('violin');
  }
  conductor.pause();
  btnPlay.classList.remove('active');
  btnPause.classList.add('active');
});

eventBus.on('RESTART_GAME', async () => {
  try {
    const act1Audio = store.getActDefinition(1).audioConfig;
    conductor.setScale(act1Audio.scale);
    conductor.setMeter(act1Audio.meter);
    conductor.setBpm(act1Audio.bpm);
    await conductor.start();
    btnPlay.classList.add('active');
    btnPause.classList.remove('active');
  } catch (err) {
    console.warn('[main] Error restarting conductor on RESTART_GAME:', err);
  }
});

eventBus.on('UI_SET_SIDEBAR', (payload) => {
  setSidebarCollapsed(payload.collapsed);
});

eventBus.on('GAME_PAUSE', async (payload) => {
  if (payload.isPaused) {
    conductor.pause();
    btnPlay.classList.remove('active');
    btnPause.classList.add('active');
  } else {
    try {
      await conductor.start();
      btnPlay.classList.add('active');
      btnPause.classList.remove('active');
    } catch (err) {
      console.warn('[main] Error resuming conductor on GAME_PAUSE:', err);
    }
  }
});


