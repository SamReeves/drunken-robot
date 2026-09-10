import{a as e,i as t,n,o as r,r as i,s as a,t as o}from"./index-DA3Uln0w.js";var s=Object.fromEntries(Object.values(n).map(e=>[e.name,{name:e.name,displayName:e.displayName,root:`D`,intervals:e.intervals,characteristicMood:e.mood}]));function c(e,r=4){return i(n[e],r).map(t)}var l=()=>`
<div class="sidebar-inner">
  <header class="app-header">
    <div class="header-badge">Debug • Audio Studio</div>
    <h1>The Drunken Robot</h1>
    <p class="subtitle">Gypsy Folk Engine &amp; Studio Mixer</p>
    <button id="btn-close-dashboard" class="btn btn-secondary btn-sm" title="Hide (backtick)">Hide</button>
  </header>

  <main class="control-panel">
    <section class="card status-card">
      <div class="status-header">
        <span class="label">Engine State</span>
        <span id="audio-status-badge" class="badge badge-suspended">Suspended</span>
      </div>
      <div class="unlock-actions">
        <button id="btn-unlock" class="btn btn-primary btn-large">🔊 Initialize &amp; Unlock Engine</button>
      </div>
    </section>

    <section class="card transport-card">
      <h2>Clock &amp; Transport Controls</h2>
      <div class="transport-buttons">
        <button id="btn-play" class="btn btn-success" disabled>▶ Start</button>
        <button id="btn-pause" class="btn btn-secondary" disabled>⏸ Pause</button>
        <button id="btn-stop" class="btn btn-danger" disabled>⏹ Stop</button>
      </div>
      <div class="tempo-control">
        <div class="slider-header">
          <label for="bpm-slider">Tempo (BPM)</label>
          <span id="bpm-val" class="value-display">120 BPM</span>
        </div>
        <input type="range" id="bpm-slider" min="60" max="180" value="120" step="1" />
      </div>
      <div class="meter-control">
        <span class="label">Time Signature / Meter</span>
        <div class="button-group" role="radiogroup" aria-label="Meter Selection">
          ${Object.values(e).map(e=>`<button class="btn btn-toggle" data-meter="${e.name}">${e.label}</button>`).join(``)}
        </div>
      </div>
    </section>

    <section class="card visualizer-card">
      <h2>Rhythmic Metronome</h2>
      <div class="meter-info">
        <span id="measure-display" class="info-tag">Measure: 0</span>
        <span id="meter-display" class="info-tag">Meter: -</span>
        <span id="last-note-display" class="info-tag note-tag">Last: -</span>
      </div>
      <div id="beat-led-strip" class="beat-led-strip"></div>
    </section>

    <section class="card scale-card">
      <h2>Modal Scales &amp; Harmony</h2>
      <div class="scale-selectors">
        ${Object.values(n).map(e=>`<button class="btn btn-toggle" data-scale="${e.name}">${e.displayName.replace(`D `,``)}</button>`).join(``)}
      </div>
      <p id="scale-description" class="scale-desc"></p>
    </section>

    <section class="card mixer-card">
      <div class="card-header-flex">
        <h2>Additive Ensemble Mixer</h2>
        <div class="ensemble-presets">
          <button class="btn btn-sm btn-preset" data-preset="solo_accordion">Solo</button>
          <button class="btn btn-sm btn-preset" data-preset="rhythm_duo">Duo</button>
          <button class="btn btn-sm btn-preset" data-preset="tavern_trio">Trio</button>
          <button class="btn btn-sm btn-preset" data-preset="full_balkan_band">Band</button>
        </div>
      </div>
      <p class="hint">Toggle recruitment, channel volume, pan, mute, and audition voices.</p>
      <div id="mixer-rack" class="mixer-rack"></div>
    </section>

    <section class="card synth-card">
      <h2>Procedural Accordion (Dual FM)</h2>
      <div class="slider-group">
        <div class="slider-header">
          <label for="bellows-slider">Bellows Pressure</label>
          <span id="bellows-val" class="value-display">75%</span>
        </div>
        <input type="range" id="bellows-slider" min="5" max="100" value="75" step="1" />
        <small class="hint">Modulates FM overtones and filter cutoff.</small>
      </div>
      <div class="slider-group">
        <div class="slider-header">
          <label for="musette-slider">Musette Detune</label>
          <span id="musette-val" class="value-display">+6 Cents</span>
        </div>
        <input type="range" id="musette-slider" min="0" max="25" value="6" step="1" />
        <small class="hint">Beating frequency between physical reed voices.</small>
      </div>
    </section>

    <section class="card keyboard-card">
      <h2>Accordion Scale Keys</h2>
      <p class="hint">Click or touch keys to audition notes on the accordion synth.</p>
      <div id="virtual-keyboard" class="keyboard-keys"></div>
    </section>
  </main>
</div>`;function u(e,t){let n=e.querySelector(t);if(!n)throw Error(`[dashboard] Missing element ${t}`);return n}function d(t){let{mixer:n,director:i}=t,{accordion:d}=i,f=document.createElement(`aside`);f.id=`debug-dashboard`,f.className=`sidebar`,f.innerHTML=l(),document.body.appendChild(f);let p=u(f,`#audio-status-badge`),m=u(f,`#btn-unlock`),h=u(f,`#btn-play`),g=u(f,`#btn-pause`),_=u(f,`#btn-stop`),v=u(f,`#bpm-slider`),y=u(f,`#bpm-val`),b=f.querySelectorAll(`[data-meter]`),x=f.querySelectorAll(`[data-scale]`),S=u(f,`#scale-description`),C=f.querySelectorAll(`[data-preset]`),w=u(f,`#mixer-rack`),T=u(f,`#bellows-slider`),E=u(f,`#bellows-val`),D=u(f,`#musette-slider`),O=u(f,`#musette-val`),k=u(f,`#measure-display`),A=u(f,`#meter-display`),j=u(f,`#last-note-display`),M=u(f,`#beat-led-strip`),N=u(f,`#virtual-keyboard`),P=e=>{f.classList.toggle(`hidden`,!e)};u(f,`#btn-close-dashboard`).addEventListener(`click`,()=>P(!1)),window.addEventListener(`keydown`,e=>{e.key==="`"&&P(f.classList.contains(`hidden`))}),o.subscribe(e=>{let t=e===`running`;p.textContent=t?`Running`:e===`suspended`?`Suspended`:e,p.className=`badge ${t?`badge-running`:`badge-suspended`}`,m.textContent=t?`✓ Engine Unlocked`:`🔊 Initialize & Unlock Engine`,m.disabled=t,h.disabled=!t,g.disabled=!t,_.disabled=!t}),m.addEventListener(`click`,()=>{o.init().catch(e=>console.error(`[dashboard] unlock failed:`,e))});let F=e=>{h.classList.toggle(`active`,e),g.classList.toggle(`active`,!e)};h.addEventListener(`click`,()=>{r.setPaused(!1),i.start(),F(!0)}),g.addEventListener(`click`,()=>{r.setPaused(!0),i.pause(),F(!1)}),_.addEventListener(`click`,()=>{i.stop(),z(),k.textContent=`Measure: 0`,j.textContent=`Last: -`}),v.addEventListener(`input`,()=>{let e=Number(v.value);y.textContent=`${e} BPM`,i.setBpm(e)});let I=e=>{v.value=String(e),y.textContent=`${e} BPM`};function L(t){M.innerHTML=``;let n=e[t],r=n.steps,i=n.accents;for(let e=0;e<r;e++){let t=document.createElement(`div`);t.className=`led-node${i.includes(e)?` accent`:``}`,t.id=`led-step-${e}`;let n=document.createElement(`div`);n.className=`led-light`;let r=document.createElement(`span`);r.className=`led-label`,r.textContent=`${e+1}`,t.append(n,r),M.appendChild(t)}}let R=e=>{let t=Array.from(b).find(t=>t.dataset.meter===e);b.forEach(e=>e.classList.toggle(`active`,e===t)),A.textContent=`Meter: ${t?.textContent?.trim()??e}`,L(e)};b.forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.meter;i.setMeter(t),R(t)})});function z(){M.querySelectorAll(`.active-step`).forEach(e=>e.classList.remove(`active-step`))}function B(e){N.innerHTML=``,S.textContent=s[e].characteristicMood,c(e,4).forEach((e,t)=>{let n=document.createElement(`button`);n.type=`button`,n.className=`key-btn`;let r=document.createElement(`span`);r.className=`note-name`,r.textContent=e;let i=document.createElement(`span`);i.className=`degree`,i.textContent=`Deg ${t+1}`,n.append(r,i);let a=t=>{t.preventDefault(),n.classList.add(`pressed`),o.init().then(()=>d.triggerAttack(e,void 0,.85))},s=t=>{t.preventDefault(),n.classList.remove(`pressed`),d.triggerRelease(e)};n.addEventListener(`pointerdown`,a),n.addEventListener(`pointerup`,s),n.addEventListener(`pointerleave`,s),n.addEventListener(`pointercancel`,s),N.appendChild(n)})}let V=e=>{x.forEach(t=>t.classList.toggle(`active`,t.dataset.scale===e)),B(e)};x.forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.scale;i.setScale(t),V(t)})}),C.forEach(e=>{e.addEventListener(`click`,()=>{C.forEach(t=>t.classList.toggle(`active`,t===e)),n.applyPreset(e.dataset.preset)})});function H(e){let t=f.querySelector(`#activity-led-${e}`);t&&(t.classList.add(`active`),setTimeout(()=>t.classList.remove(`active`),120))}function U(e){i.audition(e),H(e)}function W(e){w.innerHTML=``;for(let t of e){let e=document.createElement(`div`);e.className=`channel-strip ${t.recruited?`recruited`:`locked`}`;let r=document.createElement(`div`);r.className=`channel-header`;let i=document.createElement(`div`);i.className=`channel-title-row`;let a=document.createElement(`span`);a.className=`channel-name`,a.textContent=t.name,a.title=t.displayName,a.style.borderLeft=`3px solid ${t.color}`,a.style.paddingLeft=`4px`;let s=document.createElement(`div`);s.className=`channel-activity-led`,s.id=`activity-led-${t.id}`,i.append(a,s);let c=document.createElement(`div`);c.className=`channel-role`,c.textContent=t.role,r.append(i,c);let l=document.createElement(`button`);l.type=`button`,l.className=`btn-recruit ${t.recruited?`recruited`:`locked`}`,l.textContent=t.recruited?`✓ Active`:`+ Recruit`,l.addEventListener(`click`,()=>n.setRecruited(t.id,!t.recruited));let u=document.createElement(`div`);u.className=`channel-mute-solo-row`;let d=document.createElement(`button`);d.type=`button`,d.className=`btn-mute ${t.muted?`active`:``}`,d.textContent=`M`,d.addEventListener(`click`,()=>n.setMute(t.id,!t.muted));let f=document.createElement(`button`);f.type=`button`,f.className=`btn-solo ${t.solo?`active`:``}`,f.textContent=`S`,f.addEventListener(`click`,()=>n.setSolo(t.id,!t.solo)),u.append(d,f);let p=document.createElement(`div`);p.className=`channel-faders`,p.append(K(`Vol`,String(t.volume),`-40`,`6`,`1`,e=>`${e}dB`,e=>n.setVolume(t.id,e)),K(`Pan`,String(t.pan),`-1`,`1`,`0.05`,G,e=>n.setPan(t.id,e)));let m=document.createElement(`button`);m.type=`button`,m.className=`btn-audition`,m.textContent=`▶ Audition`,m.addEventListener(`click`,()=>{o.init().then(()=>U(t.id))}),e.append(r,l,u,p,m),w.appendChild(e)}}function G(e){return e===0?`C`:e<0?`L${Math.round(-e*100)}`:`R${Math.round(e*100)}`}function K(e,t,n,r,i,a,o){let s=document.createElement(`div`);s.className=`fader-group`;let c=document.createElement(`div`);c.className=`fader-label-row`;let l=document.createElement(`span`);l.textContent=e;let u=document.createElement(`span`);u.className=`fader-val`,u.textContent=a(Number(t)),c.append(l,u);let d=document.createElement(`input`);return d.type=`range`,d.min=n,d.max=r,d.step=i,d.value=t,d.addEventListener(`input`,()=>{let e=Number(d.value);u.textContent=a(e),o(e)}),s.append(c,d),s}n.subscribe(W),T.addEventListener(`input`,()=>{let e=Number(T.value);E.textContent=`${e}%`,d.setBellowsPressure(e/100)}),D.addEventListener(`input`,()=>{let e=Number(D.value);O.textContent=`+${e} Cents`,d.setMusetteDetune(e)}),i.onStep(e=>{if(k.textContent=`Measure: ${e.measureCount+1}`,A.textContent=`Meter: ${e.meter} (${e.totalSteps}/8)`,e.note&&(j.textContent=`Last: ${e.note}`),M.children.length!==e.totalSteps&&L(e.meter),z(),f.querySelector(`#led-step-${e.stepIndex}`)?.classList.add(`active-step`),e.triggers)for(let t of Object.keys(e.triggers))n.isInstrumentActive(t)&&H(t)}),a.on(`BELLOWS_COMPRESS`,e=>{let t=Math.round((e.isCharging?e.pressure:.75)*100);T.value=String(t),E.textContent=`${t}%`}),a.on(`BELLOWS_BURST`,()=>H(`accordion`)),a.on(`TIP_COLLECTED`,()=>H(`percussion`)),a.on(`PLAYER_LAND`,()=>H(`percussion`)),a.on(`PLAYER_STUMBLE`,()=>{H(`percussion`),R(`5/8_LURCH`)}),a.on(`TIER_CHANGE`,e=>{if(e.activeInstruments.forEach(H),e.tier>=2){let e=r.getCurrentActDefinition().audioConfig;R(e.meter),I(e.bpm)}}),a.on(`ACT_CHANGE`,e=>{let{scale:t,meter:n,bpm:i}=r.getActDefinition(e.act).audioConfig;V(t),R(n),I(i)}),a.on(`GAME_START`,()=>F(!0)),a.on(`RESTART_GAME`,()=>F(!0)),a.on(`GAME_OVER`,()=>F(!1)),a.on(`VICTORY`,()=>F(!1)),a.on(`GAME_PAUSE`,e=>F(!e.isPaused)),R(i.meter),V(i.scale),I(Math.round(i.getBpm()))}export{d as mountDashboard};