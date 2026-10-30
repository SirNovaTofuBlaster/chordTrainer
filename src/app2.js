// ---- Keys, trainer, songs, tuning, reference, startup ----
let keyRoot = "G", keyMode = "major", progIdx = 0;
const MAJOR_RING = ["C","G","D","A","E","B","F#","Db","Ab","Eb","Bb","F"];
const MINOR_RING = ["A","E","B","F#","C#","G#","Eb","Bb","F","C","G","D"];
function arcPath(cx, cy, r0, r1, a0, a1) {
  const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)].map(n => n.toFixed(1)).join(" ");
  return `M ${p(r1, a0)} A ${r1} ${r1} 0 0 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
}
function renderCircle() {
  const cx = 170, cy = 170, onMajor = keyMode === "major";
  const idx = (onMajor ? MAJOR_RING : MINOR_RING).indexOf(keyRoot);
  let s = `<svg viewBox="0 0 340 340" role="img" aria-label="Circle of fifths">`;
  [["maj", MAJOR_RING, 112, 160, ""], ["min", MINOR_RING, 66, 110, " inner"]].forEach(([kind, names, r0, r1, cls]) => {
    names.forEach((name, i) => {
      const a0 = (i * 30 - 105) * Math.PI / 180, a1 = (i * 30 - 75) * Math.PI / 180, am = (i * 30 - 90) * Math.PI / 180, rm = (r0 + r1) / 2;
      const on = idx === i && (kind === "maj") === onMajor, rel = idx === i && !on;
      s += `<path class="seg${cls}${on ? " on" : ""}${rel ? " rel" : ""}" data-root="${name}" data-mode="${kind === "maj" ? "major" : "minor"}" d="${arcPath(cx, cy, r0, r1, a0, a1)}"/>`;
      s += `<text class="${kind === "min" ? "in" : ""}" x="${(cx + rm * Math.cos(am)).toFixed(1)}" y="${(cy + rm * Math.sin(am) + 4).toFixed(1)}" text-anchor="middle">${name}${kind === "min" ? "m" : ""}</text>`;
    });
  });
  $("circle").innerHTML = s + `</svg>`;
  $("circle").querySelectorAll("path").forEach(p => p.addEventListener("click", () => { keyRoot = p.dataset.root; keyMode = p.dataset.mode; syncKeyControls(); renderKeys(); }));
  if (idx >= 0) {
    const n = idx <= 6 ? idx : 12 - idx, sharp = idx <= 6, list = sharp ? ["F#","C#","G#","D#","A#","E#","B#"] : ["Bb","Eb","Ab","Db","Gb","Cb","Fb"];
    const rel = onMajor ? MINOR_RING[idx] + " minor" : MAJOR_RING[idx] + " major";
    $("circle-note").textContent = `${keyRoot} ${keyMode}: ` + (n === 0 ? "no sharps or flats" : `${n} ${sharp ? "sharp" : "flat"}${n > 1 ? "s" : ""} (${list.slice(0, n).join(" ")})`) + `. Relative ${onMajor ? "minor" : "major"}: ${rel}.`;
  } else $("circle-note").textContent = "Click a key. Outer ring is major, inner ring is the relative minor.";
}
function syncKeyControls() {
  $("key-root").value = keyRoot;
  document.querySelectorAll("[data-mode]").forEach(b => { if (b.classList.contains("chip")) b.setAttribute("aria-pressed", b.dataset.mode === keyMode); });
}
function renderKeys() {
  const chords = keyChords(keyRoot, keyMode), sev = $("sevenths").checked;
  $("keychords").innerHTML = chords.map(c => {
    const tid = sev ? c.seventh : c.tri, nm = chordName(c.root, tid), v = chordVoicings(c.root, tid)[0];
    return `<div class="kc"><span class="num">${c.numeral}</span><span class="cname">${nm}</span>${v ? chordSVG(v, { names: false, label: nm }) : ""}</div>`;
  }).join("");
  const p = PROGRESSIONS[progIdx];
  $("prog-out").innerHTML = p.steps.map((st, i) => {
    const c = chords[st - 1], tid = p.name.startsWith("12-bar") ? "7" : p.sevenths ? c.seventh : c.tri;
    return `<div class="pc"><b>${chordName(c.root, tid)}</b><small>${c.numeral}</small></div>`;
  }).join("");
  $("prog-note").textContent = p.note;
  renderCircle();
}
function renderCapo() {
  const shape = $("capo-shape").value, pc = pcOf(shape);
  $("capo-table").innerHTML = Array.from({ length: 10 }, (_, c) => {
    const p = (pc + c) % 12, nm = PCNAME[p], alt = ROOT_ALT[nm];
    return `<div><small>${c === 0 ? "No capo" : "Capo " + c}</small><b>${nm}${alt ? " / " + alt : ""}</b></div>`;
  }).join("");
}
function initKeys() {
  $("key-root").innerHTML = optionsOf(NOTE_ROOTS); $("key-root").value = keyRoot;
  $("prog").innerHTML = PROGRESSIONS.map((p, i) => `<option value="${i}">${p.name}</option>`).join("");
  $("key-root").addEventListener("change", e => { keyRoot = e.target.value; renderKeys(); });
  $("sevenths").addEventListener("change", renderKeys);
  document.querySelectorAll("button[data-mode]").forEach(b => b.addEventListener("click", () => { keyMode = b.dataset.mode; syncKeyControls(); renderKeys(); }));
  $("prog").addEventListener("change", e => { progIdx = +e.target.value; keyMode = PROGRESSIONS[progIdx].mode; syncKeyControls(); renderKeys(); });
  $("capo-shape").innerHTML = optionsOf(["C","A","G","E","D"], v => v + " shapes");
  $("capo-shape").value = "G"; $("capo-shape").addEventListener("change", renderCapo);
  syncKeyControls(); renderCapo();
}

// ---- Trainer ----
const PATTERNS = {
  four:    { name: "Four downs  ↓ ↓ ↓ ↓", note: "The simplest one. A single strum on every beat.", s: ["D","","D","","D","","D",""] },
  waltz:   { name: "Waltz  ↓ ↓ ↓", note: "Three beats to the bar. Good for waltzes and other songs in three.", s: ["D","","D","","D",""] },
  dud:     { name: "Down, down-up  ↓ ↓↑ ↓↑ ↓↑", note: "A good next step once four downs feel easy.", s: ["D","","D","U","D","U","D","U"] },
  folk:    { name: "Folk strum  ↓ ↓↑ ↑↓↑", note: "The classic. Keep your hand swinging down and up the whole time and just miss the strings where there is a gap.", s: ["D","","D","U","","U","D","U"] },
  eighths: { name: "Steady eighths  ↓↑ ↓↑ ↓↑ ↓↑", note: "Constant down-up. Good for fast songs.", s: ["D","U","D","U","D","U","D","U"] },
  offbeat: { name: "Offbeat  · ↑ · ↑ · ↑ · ↑", note: "Strum only on the 'and'. Gives a reggae feel.", s: ["","U","","U","","U","","U"] },
};
let running = false, timer = null, slot = 0, bar = 0, current = 0, audio = null;
function slotsHTML(pat, active = -1) {
  return pat.map((s, i) => {
    const beat = i % 2 === 0, label = beat ? (i / 2 + 1) : "&", arrow = s === "D" ? "↓" : s === "U" ? "↑" : "·";
    return `<div class="slot ${beat ? "beat" : ""} ${i === active ? "on" : ""}"><div>${arrow}<small>${label}</small></div></div>`;
  }).join("");
}
function trainerChords() { return [{ root: $("c1r").value, type: $("c1t").value }, { root: $("c2r").value, type: $("c2t").value }]; }
function renderStage() {
  const cs = trainerChords(), now = cs[current], next = cs[1 - current];
  $("now-name").textContent = chordName(now.root, now.type); $("next-name").textContent = chordName(next.root, next.type);
  $("now-svg").innerHTML = chordSVG(chordVoicings(now.root, now.type)[0], { label: chordName(now.root, now.type) });
  $("next-svg").innerHTML = chordSVG(chordVoicings(next.root, next.type)[0], { names: false, label: chordName(next.root, next.type) });
}
function renderStrum(active = -1) { $("strum").innerHTML = slotsHTML(PATTERNS[$("pattern").value].s, active); }
function click(strong) {
  if (!audio) return;
  const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
  o.frequency.value = strong ? 1500 : 1000;
  g.gain.setValueAtTime(strong ? 0.35 : 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 0.06);
}
function tick() {
  const pat = PATTERNS[$("pattern").value].s, barsPer = +$("bars").value;
  if (slot % 2 === 0) click(slot === 0);
  renderStrum(slot);
  const left = barsPer - (bar % barsPer);
  $("count").textContent = `Bar ${bar % barsPer + 1} of ${barsPer} · change in ${left} bar${left > 1 ? "s" : ""}`;
  slot++;
  if (slot >= pat.length) { slot = 0; bar++; if (bar % barsPer === 0) { current = 1 - current; renderStage(); } }
  timer = setTimeout(tick, 60000 / +$("tempo").value / 2);
}
function bestKey() { const [a, b] = trainerChords(); return "ct-best-" + chordName(a.root, a.type) + "-" + chordName(b.root, b.type); }
function loadBest() { let b = null; try { b = localStorage.getItem(bestKey()); } catch (e) {} $("m-best").textContent = b || "–"; }
let mTimer = null, mLeft = 60, mCount = 0;
function initTrainer() {
  ["c1r","c2r"].forEach(id => $(id).innerHTML = optionsOf(ROOTS));
  ["c1t","c2t"].forEach(id => $(id).innerHTML = CHORD_TYPES.map(t => `<option value="${t.id}">${t.name}</option>`).join(""));
  $("c1r").value = "G"; $("c2r").value = "D";
  $("pattern").innerHTML = Object.entries(PATTERNS).map(([k, p]) => `<option value="${k}">${p.name}</option>`).join("");
  $("patterns").innerHTML = Object.values(PATTERNS).map(p => `<div class="pat"><h4>${p.name}</h4><p>${p.note}</p><div class="strum">${slotsHTML(p.s)}</div></div>`).join("");
  $("go").addEventListener("click", () => {
    if (running) { clearTimeout(timer); running = false; renderStrum(); $("go").textContent = "Start metronome"; $("count").textContent = "Stopped."; return; }
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (e) { audio = null; }
    running = true; slot = 0; bar = 0; current = 0; renderStage(); $("go").textContent = "Stop"; tick();
  });
  $("tempo").addEventListener("input", e => $("bpm-val").textContent = e.target.value);
  ["c1r","c1t","c2r","c2t"].forEach(id => $(id).addEventListener("change", () => { current = 0; renderStage(); loadBest(); }));
  $("pattern").addEventListener("change", () => { slot = 0; renderStrum(); });
  $("m-start").addEventListener("click", () => {
    clearInterval(mTimer); mLeft = 60; mCount = 0; $("m-count").textContent = 0; $("m-time").textContent = 60;
    $("m-tap").disabled = false; $("m-start").textContent = "Restart";
    mTimer = setInterval(() => {
      mLeft--; $("m-time").textContent = mLeft;
      if (mLeft <= 0) {
        clearInterval(mTimer); $("m-tap").disabled = true; $("m-start").textContent = "Start minute";
        try { const prev = +(localStorage.getItem(bestKey()) || 0); if (mCount > prev) localStorage.setItem(bestKey(), mCount); } catch (e) {}
        loadBest();
      }
    }, 1000);
  });
  $("m-tap").addEventListener("click", () => { mCount++; $("m-count").textContent = mCount; });
  renderStrum(); loadBest();
}

// ---- My chords ----
let mine = [{ root: "G", type: "maj", vi: 0 }, { root: "C", type: "maj", vi: 0 }, { root: "D", type: "maj", vi: 0 }, { root: "E", type: "min", vi: 0 }];
try {
  const saved = JSON.parse(localStorage.getItem("ct-mine"));
  if (Array.isArray(saved)) mine = saved.filter(c => c && ROOTS.includes(c.root) && TYPE[c.type]).map(c => ({ root: c.root, type: c.type, vi: +c.vi || 0 }));
} catch (e) {}
const revealed = new Set();
function saveMine() { try { localStorage.setItem("ct-mine", JSON.stringify(mine)); } catch (e) {} }
function addMine(root, type) {
  if (mine.some(c => c.root === root && c.type === type)) return false;
  mine.push({ root, type, vi: 0 }); saveMine(); renderMine(); return true;
}
function renderMine() {
  const mode = $("mine-mode").value;
  $("mine-empty").hidden = mine.length > 0;
  $("mine-count").textContent = mine.length ? mine.length + (mine.length === 1 ? " chord" : " chords") : "";
  $("mine-grid").innerHTML = mine.map((c, i) => {
    const vs = chordVoicings(c.root, c.type), v = vs[c.vi % vs.length], nm = chordName(c.root, c.type);
    const key = c.root + "|" + c.type, open = mode === "all" || revealed.has(key);
    const hideName = mode === "shape" && !open, hideShape = mode === "name" && !open;
    const notes = chordNotes(c.root, c.type).map(n => n.name).join(" ");
    return `<div class="mc" id="mc-${i}">
      <div class="mc-top"><b class="mc-name">${hideName ? "?" : nm}</b><button type="button" class="mini" data-act="rm" data-i="${i}" aria-label="Remove ${nm}">Remove</button></div>
      ${hideShape ? `<button type="button" class="reveal" data-act="show" data-i="${i}">Tap to show the shape</button>`
        : `${chordSVG(v, { label: hideName ? "Unnamed chord" : nm })}<span class="vlabel">${esc(v.label)}</span>`}
      ${hideName ? `<button type="button" class="reveal slim" data-act="show" data-i="${i}">Tap to show the name</button>` : `<span class="mc-notes">${hideShape ? TYPE[c.type].name : "Notes: " + notes}</span>`}
      ${vs.length > 1 && !hideShape ? `<button type="button" class="mini" data-act="alt" data-i="${i}">Other shape (${c.vi % vs.length + 1} of ${vs.length})</button>` : ""}
    </div>`;
  }).join("");
}
function initMine() {
  $("mine-root").innerHTML = optionsOf(ROOTS); $("mine-root").value = "A";
  $("mine-type").innerHTML = CHORD_TYPES.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
  $("mine-quick").innerHTML = QUICK.map(([r, t]) => `<button type="button" class="chip" id="mq-${r}${t}" data-r="${r}" data-t="${t}">${chordName(r, t)}</button>`).join("");
  $("mine-quick").querySelectorAll("button").forEach(b => b.addEventListener("click", () => addMine(b.dataset.r, b.dataset.t)));
  $("mine-add").addEventListener("click", () => addMine($("mine-root").value, $("mine-type").value));
  $("add-mine").addEventListener("click", () => { addMine(cRoot, cType); $("add-mine").textContent = "Added"; setTimeout(() => $("add-mine").textContent = "Add to my chords", 1200); });
  $("mine-mode").addEventListener("change", () => { revealed.clear(); renderMine(); });
  $("mine-shuffle").addEventListener("click", () => {
    for (let i = mine.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [mine[i], mine[j]] = [mine[j], mine[i]]; }
    revealed.clear(); saveMine(); renderMine();
  });
  $("mine-clear").addEventListener("click", () => { mine = []; revealed.clear(); saveMine(); renderMine(); });
  $("mine-grid").addEventListener("click", e => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    const i = +b.dataset.i, c = mine[i];
    if (b.dataset.act === "rm") mine.splice(i, 1);
    else if (b.dataset.act === "alt") c.vi++;
    else revealed.add(c.root + "|" + c.type);
    saveMine(); renderMine();
  });
  renderMine();
}

// ---- Tuning ----
const TUNE_NOTES = {
  std: "Thickest to thinnest: E A D G B E. A way to remember it: Every Amateur Does Get Better Eventually.",
  dropd: "Only the thickest string changes. Lower it a full step from E to D. Great for heavy riffs, because one finger can play a power chord.",
  half: "Everything one fret lower. Easier on the fingers and a bit darker in sound. Used a lot in rock.",
  dstd: "Everything two frets lower. Chord shapes stay the same, but they sound lower.",
  dadgad: "Popular in Celtic and folk music. Strumming the open strings gives a calm, open sound that is neither major nor minor.",
  openg: "Strum all six open strings and you get a G major chord. Slide-guitar players love it.",
  opend: "Strum all six open strings and you get a D major chord.",
  opene: "Strum all six open strings and you get an E major chord. Needs tighter strings than the others, so go carefully.",
  openc: "Strum all six open strings and you get a C chord. The lowest strings are tuned a long way down, so you may need heavier strings.",
};
let ringTimer = null;
function renderTuning() {
  const t = TUNINGS.find(x => x.id === $("tune-sel").value), f = openFreq(t);
  $("tune-strings").innerHTML = t.names.map((n, i) => `<button type="button" class="tbtn" id="tune-${i}" data-i="${i}">${esc(n.toUpperCase() === n || i < 5 ? n : n)}<small>${f[i].toFixed(1)} Hz</small></button>`).join("");
  $("tune-strings").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (e) { return; }
    const o = audio.createOscillator(), g = audio.createGain(), now = audio.currentTime;
    o.type = "triangle"; o.frequency.value = f[+b.dataset.i];
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.4, now + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
    o.connect(g).connect(audio.destination); o.start(now); o.stop(now + 2.7);
    document.querySelectorAll(".tbtn").forEach(x => x.classList.remove("ring")); b.classList.add("ring");
    clearTimeout(ringTimer); ringTimer = setTimeout(() => b.classList.remove("ring"), 2600);
  }));
  $("tune-note").textContent = TUNE_NOTES[t.id];
}
function renderReference() {
  $("intervals").innerHTML = `<tr><th>Short</th><th>Name</th><th>Semitones</th></tr>` + INTERVALS.map(i => `<tr><td class="hl">${i[0]}</td><td>${i[1]}</td><td>${i[2]}</td></tr>`).join("");
  let g = `<tr><th></th>` + Array.from({ length: 13 }, (_, f) => `<th>${f}</th>`).join("") + `</tr>`;
  [5,4,3,2,1,0].forEach(i => { g += `<tr><th>${STRING_LETTERS[i]}</th>` + Array.from({ length: 13 }, (_, f) => { const n = PCNAME[(STD_PC[i] + f) % 12]; return `<td class="${n.length === 1 ? "hl" : ""}">${n}</td>`; }).join("") + `</tr>`; });
  $("notegrid").innerHTML = g;
}

// ---- Hand switch and startup ----
function setHand(h) {
  hand = h;
  try { localStorage.setItem("ct-hand", h); } catch (e) {}
  document.querySelectorAll("[data-hand]").forEach(b => b.setAttribute("aria-pressed", b.dataset.hand === h));
  $("hand-word").textContent = h === "left" ? "left-handed" : "right-handed";
  $("hero-cap").textContent = h === "left" ? "thickest string on the right" : "thickest string on the left";
  $("hero-svg").innerHTML = chordSVG(chordVoicings("G", "maj")[0], { label: "G major" }).replace('class="chord"', 'class="chord" style="max-width:190px"');
  renderFinder(); renderFretboard(); renderKeys(); renderStage(); renderMine();
}
document.querySelectorAll("[data-hand]").forEach(b => b.addEventListener("click", () => setHand(b.dataset.hand)));
$("tune-sel").innerHTML = TUNINGS.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
$("tune-sel").addEventListener("change", renderTuning);
initFinder(); initFretboard(); initKeys(); initTrainer(); initMine(); renderTuning(); renderReference();
const SKINS = ["auto","light","blue","black","sand"];
function setSkin(s) {
  if (!SKINS.includes(s)) s = "auto";
  document.documentElement.dataset.skin = s;
  try { localStorage.setItem("ct-skin", s); } catch (e) {}
  document.querySelectorAll("button[data-skin]").forEach(b => b.setAttribute("aria-pressed", b.dataset.skin === s));
}
document.querySelectorAll("button[data-skin]").forEach(b => b.addEventListener("click", () => setSkin(b.dataset.skin)));
let savedSkin = "auto"; try { savedSkin = localStorage.getItem("ct-skin") || "auto"; } catch (e) {}
setSkin(savedSkin);
setHand(hand);
