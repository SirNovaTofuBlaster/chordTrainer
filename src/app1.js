// ---- UI helpers, chord diagrams, chord finder, fretboard ----
let hand = "left";
try { hand = localStorage.getItem("ct-hand") || "left"; } catch (e) {}
const $ = id => document.getElementById(id);
const PCNAME = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
const NOTE_ROOTS = ["C","C#","Db","D","Eb","E","F","F#","G","G#","Ab","A","Bb","B"];
const esc = t => t.replace(/[&<>]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));
const optionsOf = (arr, fmt) => arr.map(v => `<option value="${v}">${fmt ? fmt(v) : v}</option>`).join("");

function chordSVG(v, opts = {}) {
  const names = opts.names !== false;
  const W = 130, top = 34, left = 26, gap = 18, fh = 26, rows = 4;
  const H = top + fh * rows + (names ? 22 : 8);
  const base = v.base || 1;
  const x = i => left + gap * (hand === "left" ? 5 - i : i);
  let s = `<svg class="chord" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || "Chord")} diagram, ${hand}-handed">`;
  for (let i = 0; i < 6; i++) s += `<line class="grid-line" x1="${x(i)}" y1="${top}" x2="${x(i)}" y2="${top + fh * rows}"/>`;
  for (let r = 1; r <= rows; r++) s += `<line class="grid-line" x1="${left}" y1="${top + fh * r}" x2="${left + gap * 5}" y2="${top + fh * r}"/>`;
  s += base === 1
    ? `<line class="nut" x1="${left - 1}" y1="${top}" x2="${left + gap * 5 + 1}" y2="${top}"/>`
    : `<line class="grid-line" x1="${left}" y1="${top}" x2="${left + gap * 5}" y2="${top}"/>`;
  for (let r = 0; r < rows; r++) s += `<text class="fret-no" x="${left - 11}" y="${top + fh * r + fh / 2 + 3}" text-anchor="middle">${base + r}</text>`;
  if (v.barre) {
    const a = x(v.barre.from), b = x(v.barre.to), y = top + fh * (v.barre.fret - base) + fh / 2;
    s += `<rect class="bar" x="${Math.min(a, b) - 8}" y="${y - 8}" width="${Math.abs(b - a) + 16}" height="16" rx="8"/>`;
  }
  v.frets.forEach((f, i) => {
    if (f === null) s += `<text class="mark" x="${x(i)}" y="${top - 9}" text-anchor="middle">x</text>`;
    else if (f === 0) s += `<text class="mark" x="${x(i)}" y="${top - 9}" text-anchor="middle">o</text>`;
    else {
      const y = top + fh * (f - base) + fh / 2;
      const onBarre = v.barre && f === v.barre.fret && v.fingers[i] === 1 && i >= v.barre.from && i <= v.barre.to;
      if (!onBarre) s += `<circle class="dot" cx="${x(i)}" cy="${y}" r="8"/>`;
      if (v.fingers[i] && (!onBarre || i === v.barre.from || i === v.barre.to)) s += `<text class="fnum" x="${x(i)}" y="${y + 4}" text-anchor="middle">${v.fingers[i]}</text>`;
    }
  });
  if (names) STRING_LETTERS.forEach((n, i) => { s += `<text class="sname" x="${x(i)}" y="${top + fh * rows + 15}" text-anchor="middle">${n}</text>`; });
  return s + `</svg>`;
}
const STRING_LETTERS = ["E","A","D","G","B","e"];

// ---- Chord finder ----
let cRoot = "G", cType = "maj";
function renderRoots() {
  $("roots").innerHTML = ROOTS.map(r => `<button type="button" id="root-${r.replace("#", "s")}" data-root="${r}" aria-pressed="${r === cRoot}">${r}${ROOT_ALT[r] ? `<small>${ROOT_ALT[r]}</small>` : "<small>&nbsp;</small>"}</button>`).join("");
  $("roots").querySelectorAll("button").forEach(b => b.addEventListener("click", () => { cRoot = b.dataset.root; renderFinder(); }));
}
function renderFinder() {
  renderRoots();
  $("ctype").value = cType;
  const vs = chordVoicings(cRoot, cType), name = chordName(cRoot, cType);
  $("res-name").textContent = name;
  $("res-type").textContent = cRoot + " " + TYPE[cType].name.toLowerCase();
  $("res-notes").textContent = chordNotes(cRoot, cType).map(n => n.name).join(" ");
  $("voicings").innerHTML = vs.map(v => `<div class="voicing">${chordSVG(v, { label: name })}<span class="vlabel">${esc(v.label)}</span></div>`).join("");
  $("all-h").textContent = "Every chord on " + cRoot;
  $("library").innerHTML = CHORD_TYPES.map(t => {
    const v = chordVoicings(cRoot, t.id)[0];
    return `<button type="button" class="card cbtn" id="card-${t.id}" data-type="${t.id}"><h3>${chordName(cRoot, t.id)}</h3><span class="sub">${t.name}</span>${chordSVG(v, { label: chordName(cRoot, t.id) })}</button>`;
  }).join("");
  $("library").querySelectorAll("button").forEach(b => b.addEventListener("click", () => { cType = b.dataset.type; renderFinder(); $("res-name").scrollIntoView({ block: "center", behavior: "smooth" }); }));
}
const QUICK = [["G","maj"],["C","maj"],["D","maj"],["E","min"],["A","min"],["E","maj"],["A","maj"],["D","min"],["F","maj"]];
function initFinder() {
  const quick = QUICK;
  $("ctype").innerHTML = CHORD_TYPES.map(t => `<option value="${t.id}">${t.name}${t.sym ? " (" + t.sym + ")" : ""}</option>`).join("");
  $("ctype").addEventListener("change", e => { cType = e.target.value; renderFinder(); });
  $("quick").innerHTML = quick.map(([r, t]) => `<button type="button" class="chip" id="q-${r}${t}" data-r="${r}" data-t="${t}">${chordName(r, t)}</button>`).join("");
  $("quick").querySelectorAll("button").forEach(b => b.addEventListener("click", () => { cRoot = b.dataset.r; cType = b.dataset.t; renderFinder(); }));
}

// ---- Fretboard ----
function intervalLabel(semis) { return INTERVALS[semis][0]; }
function renderFretboard() {
  const mode = $("fb-mode").value, root = $("fb-root").value, rootPc = pcOf(root);
  const tuning = TUNINGS.find(t => t.id === $("fb-tuning").value), lab = $("fb-label").value, frets = +$("fb-frets").value;
  const set = new Map(); let info = [], note = "";
  if (mode === "scale") {
    const id = $("fb-scale").value; info = scaleNotes(root, id); info.forEach(n => set.set(n.pc, n));
    note = (SCALE_NOTES[id] ? SCALE_NOTES[id] + " " : "") + `Formula: ${SCALE[id].f.join(" ")}.`;
  } else if (mode === "chord") {
    const id = $("fb-chord").value; info = chordNotes(root, id); info.forEach(n => set.set(n.pc, n));
    note = `${chordName(root, id)} is made from ${info.map(n => n.name).join(", ")}. Look for these notes all over the neck, not just in one shape.`;
  } else if (mode === "note") {
    set.set(rootPc, { name: root, label: "1", pc: rootPc }); info = [set.get(rootPc)];
    note = `Every ${root} on the neck.`;
  } else {
    for (let pc = 0; pc < 12; pc++) set.set(pc, { name: pc === rootPc ? root : PCNAME[pc], label: intervalLabel((pc - rootPc + 12) % 12), pc });
    note = `Every note. ${root} is highlighted and the others are labelled by their distance from it.`;
  }
  const Wt = 1000, L = 66, FW = Wt - L - 16, top = 26, sg = 26, bottom = top + 5 * sg, H = bottom + 34;
  const k = FW / (1 - Math.pow(2, -frets / 12));
  const fx = n => L + k * (1 - Math.pow(2, -n / 12));
  const X = v => hand === "left" ? Wt - v : v;
  const y = i => top + (5 - i) * sg;
  let s = `<svg viewBox="0 0 ${Wt} ${H}" role="img" aria-label="Guitar fretboard, ${hand}-handed, ${esc(mode)} view">`;
  for (const n of [3,5,7,9,15,17,19,21]) if (n <= frets) s += `<circle class="inlay" cx="${X((fx(n - 1) + fx(n)) / 2)}" cy="${(top + bottom) / 2}" r="7"/>`;
  if (frets >= 12) for (const dy of [top + sg * 1.5, top + sg * 3.5]) s += `<circle class="inlay" cx="${X((fx(11) + fx(12)) / 2)}" cy="${dy}" r="7"/>`;
  if (frets >= 24) for (const dy of [top + sg * 1.5, top + sg * 3.5]) s += `<circle class="inlay" cx="${X((fx(23) + fx(24)) / 2)}" cy="${dy}" r="7"/>`;
  for (let n = 1; n <= frets; n++) s += `<line class="fret" x1="${X(fx(n))}" y1="${top}" x2="${X(fx(n))}" y2="${bottom}"/>`;
  s += `<line class="nutl" x1="${X(L)}" y1="${top - 2}" x2="${X(L)}" y2="${bottom + 2}"/>`;
  for (let i = 0; i < 6; i++) s += `<line class="fstring" x1="${X(L)}" y1="${y(i)}" x2="${X(fx(frets))}" y2="${y(i)}" stroke-width="${(2.4 - i * 0.28).toFixed(2)}"/>`;
  for (let n = 1; n <= frets; n++) s += `<text class="fnum" x="${X((fx(n - 1) + fx(n)) / 2)}" y="${bottom + 22}" text-anchor="middle">${n}</text>`;
  for (let i = 0; i < 6; i++) {
    s += `<text class="sname" x="${X(14)}" y="${y(i) + 4}" text-anchor="middle">${esc(tuning.names[i])}</text>`;
    for (let f = 0; f <= frets; f++) {
      const pc = (tuning.pcs[i] + f) % 12, n = set.get(pc); if (!n) continue;
      const cx = f === 0 ? X(L - 24) : X((fx(f - 1) + fx(f)) / 2), isRoot = pc === rootPc;
      const text = lab === "none" ? "" : lab === "degrees" ? n.label : n.name;
      s += `<circle class="nd${isRoot ? " root" : ""}" cx="${cx}" cy="${y(i)}" r="11"/>`;
      if (text) s += `<text class="nl${isRoot ? " root" : ""}" x="${cx}" y="${y(i) + 4}" text-anchor="middle">${esc(text)}</text>`;
    }
  }
  $("fb").innerHTML = s + `</svg>`;
  $("fb-chips").innerHTML = (mode === "all") ? "" : info.map((n, i) => `<span class="nchip${i === 0 ? " root" : ""}">${esc(n.name)}<small>${esc(n.label)}</small></span>`).join("");
  $("fb-note").textContent = note;
}
function initFretboard() {
  $("fb-root").innerHTML = optionsOf(NOTE_ROOTS); $("fb-root").value = "A";
  const groups = [...new Set(SCALES.map(s => s.group))];
  $("fb-scale").innerHTML = groups.map(g => `<optgroup label="${g}">` + SCALES.filter(s => s.group === g).map(s => `<option value="${s.id}">${s.name}</option>`).join("") + `</optgroup>`).join("");
  $("fb-scale").value = "minpent";
  $("fb-chord").innerHTML = CHORD_TYPES.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
  $("fb-tuning").innerHTML = TUNINGS.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
  const toggle = () => { const m = $("fb-mode").value; $("fb-scale-wrap").hidden = m !== "scale"; $("fb-chord-wrap").hidden = m !== "chord"; };
  ["fb-mode","fb-root","fb-scale","fb-chord","fb-tuning","fb-label","fb-frets"].forEach(id => $(id).addEventListener("change", () => { toggle(); renderFretboard(); }));
  toggle();
}
