// ---- Tabs: one section on screen at a time ----
const TAB_IDS = [...document.querySelectorAll("main > section[id]")].map(s => s.id).filter(id => id !== "intro" && id !== "tuning");
function goTab(id, scroll = true) {
  if (id === "tuning") id = "reference";
  if (!TAB_IDS.includes(id)) id = "chords";
  TAB_IDS.forEach(t => { $(t).hidden = t !== id; });
  $("intro").hidden = id !== "chords"; $("tuning").hidden = id !== "reference";
  document.querySelectorAll("nav.jump a").forEach(a => {
    const on = a.getAttribute("href") === "#" + id;
    if (on) { a.setAttribute("aria-current", "page"); a.scrollIntoView({ block: "nearest", inline: "center" }); } else a.removeAttribute("aria-current");
  });
  if (typeof stopSpider === "function") stopSpider();
  try { localStorage.setItem("ct-tab", id); } catch (e) {}
  if (location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
  if (scroll) window.scrollTo(0, 0);
}
document.querySelectorAll("nav.jump a, #home-link").forEach(a => a.addEventListener("click", e => { e.preventDefault(); goTab(a.getAttribute("href").slice(1)); }));
window.addEventListener("hashchange", () => goTab(location.hash.slice(1)));
let startTab = location.hash.slice(1);
if (!startTab) { try { startTab = localStorage.getItem("ct-tab") || "chords"; } catch (e) { startTab = "chords"; } }
goTab(startTab, false);

// ---- Drills ----
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const loadNum = k => { try { return +localStorage.getItem(k) || 0; } catch (e) { return 0; } };
const saveNum = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

// Strumming ladder
const LADDER = [
  ["eighths", "Steady down-up on every half beat. Count 1 and 2 and 3 and 4 and. Spend most of your time here."],
  ["dud", "Same swing, but miss the strings on the first up."],
  ["folk", "Same swing with two strokes missed. The most useful pattern there is."],
  ["riptide", "The Riptide verse. Miss beat 3, then up, down, up."],
];
let ladderDone = [];
try { const l = JSON.parse(localStorage.getItem("ct-ladder")); if (Array.isArray(l)) ladderDone = l; } catch (e) {}
function renderLadder() {
  $("ladder").innerHTML = LADDER.map(([k, tip], i) => {
    const p = PATTERNS[k], done = ladderDone.includes(k);
    return `<li class="${done ? "done" : ""}"><label><input type="checkbox" data-k="${k}" ${done ? "checked" : ""}> <b>${i + 1}. ${p.name}</b></label><p class="muted">${tip}</p><div class="strum">${slotsHTML(p.s)}</div><button type="button" class="mini" data-try="${k}">Practise at 60 BPM</button></li>`;
  }).join("");
}
$("ladder").addEventListener("change", e => {
  const k = e.target.dataset.k; if (!k) return;
  ladderDone = e.target.checked ? [...new Set([...ladderDone, k])] : ladderDone.filter(x => x !== k);
  try { localStorage.setItem("ct-ladder", JSON.stringify(ladderDone)); } catch (err) {}
  renderLadder();
});
$("ladder").addEventListener("click", e => {
  const b = e.target.closest("button[data-try]"); if (!b) return;
  $("pattern").value = b.dataset.try; $("pattern").dispatchEvent(new Event("change"));
  $("tempo").value = 60; $("tempo").dispatchEvent(new Event("input")); $("tempo").dispatchEvent(new Event("change"));
  goTab("practice");
});

// Name the chord
let qCur = null, qRight = 0, qTotal = 0, qStreak = 0, qLock = false;
function quizPool() {
  const mode = $("q-pool").value;
  if (mode === "majmin") return ROOTS.flatMap(r => [[r, "maj", 0], [r, "min", 0]]);
  if (mode === "mine") { const m = mine.filter(c => chordVoicings(c.root, c.type, c.bass).length).map(c => [c.root, c.type, c.vi || 0, c.bass || ""]); if (new Set(m.map(c => chordName(c[0], c[1], c[3]))).size >= 4) return m; }
  return QUICK.map(([r, t]) => [r, t, 0]);
}
function renderQuizArt() {
  if (!qCur) return;
  const vs = chordVoicings(qCur[0], qCur[1], qCur[3]);
  $("q-art").innerHTML = chordSVG(vs[qCur[2]] || vs[0], { label: "Mystery chord" });
}
function nextQuiz() {
  const pool = quizPool(); let c = pick(pool);
  if (qCur && pool.length > 1) while (chordName(c[0], c[1], c[3]) === chordName(qCur[0], qCur[1], qCur[3])) c = pick(pool);
  qCur = c; qLock = false; renderQuizArt();
  const right = chordName(c[0], c[1], c[3]);
  const others = [...new Set([...pool, ...QUICK.map(([r, t]) => [r, t, 0])].map(x => chordName(x[0], x[1], x[3])))].filter(n => n !== right);
  $("q-opts").innerHTML = shuffle([right, ...shuffle(others).slice(0, 3)]).map(n => `<button type="button" class="chip" data-n="${esc(n)}">${esc(n)}</button>`).join("");
  $("q-msg").textContent = "";
  if ($("q-pool").value === "mine" && new Set(mine.map(c => c.root + c.type)).size < 4) $("q-msg").textContent = "Add at least 4 chords to My chords to be quizzed on them. Using beginner chords for now.";
}
function quizScore() { $("q-score").textContent = `${qRight} right out of ${qTotal} · streak ${qStreak} · best streak ${loadNum("ct-quiz-best")}`; }
$("q-opts").addEventListener("click", e => {
  const b = e.target.closest("button[data-n]"); if (!b || qLock) return; qLock = true;
  const right = chordName(qCur[0], qCur[1], qCur[3]), ok = b.dataset.n === right;
  qTotal++; if (ok) { qRight++; qStreak++; if (qStreak > loadNum("ct-quiz-best")) saveNum("ct-quiz-best", qStreak); } else qStreak = 0;
  $("q-opts").querySelectorAll("button").forEach(x => { x.disabled = true; if (x.dataset.n === right) x.setAttribute("aria-pressed", "true"); });
  $("q-msg").textContent = ok ? "Yes, " + right + "." : "Not quite. That one is " + right + ".";
  quizScore(); setTimeout(nextQuiz, ok ? 900 : 2200);
});
$("q-pool").addEventListener("change", nextQuiz);

// Find the note
let nCur = null, nRight = 0, nTotal = 0, nStreak = 0, nLock = false;
const STRING_WORDS = ["thickest E", "A", "D", "G", "B", "thinnest e"];
function renderNoteArt() {
  if (!nCur) return;
  const [s, f] = nCur, frets = Array(6).fill(null), fingers = Array(6).fill(0); frets[s] = f;
  $("n-art").innerHTML = chordSVG({ frets, fingers, base: f <= 4 ? 1 : f - 1 }, { label: "One note" });
}
function nextNote() {
  const max = +$("n-range").value; let c;
  do { c = [Math.floor(Math.random() * 6), Math.floor(Math.random() * (max + 1))]; } while (nCur && c[0] === nCur[0] && c[1] === nCur[1]);
  nCur = c; nLock = false; renderNoteArt();
  $("n-q").textContent = `What note is the ${STRING_WORDS[c[0]]} string${c[1] === 0 ? " played open" : " at fret " + c[1]}?`;
  $("n-opts").innerHTML = PCNAME.map((n, pc) => `<button type="button" class="chip" data-pc="${pc}">${n}</button>`).join("");
  $("n-msg").textContent = "";
}
function noteScore() { $("n-score").textContent = `${nRight} right out of ${nTotal} · streak ${nStreak} · best streak ${loadNum("ct-note-best")}`; }
$("n-opts").addEventListener("click", e => {
  const b = e.target.closest("button[data-pc]"); if (!b || nLock) return; nLock = true;
  const pc = (STD_PC[nCur[0]] + nCur[1]) % 12, ok = +b.dataset.pc === pc;
  nTotal++; if (ok) { nRight++; nStreak++; if (nStreak > loadNum("ct-note-best")) saveNum("ct-note-best", nStreak); } else nStreak = 0;
  $("n-opts").querySelectorAll("button").forEach(x => { x.disabled = true; if (+x.dataset.pc === pc) x.setAttribute("aria-pressed", "true"); });
  $("n-msg").textContent = ok ? "Yes, " + PCNAME[pc] + "." : "Not quite. It is " + PCNAME[pc] + ".";
  noteScore(); setTimeout(nextNote, ok ? 900 : 2200);
});
$("n-range").addEventListener("change", nextNote);
document.querySelectorAll("button[data-hand]").forEach(b => b.addEventListener("click", () => { renderQuizArt(); renderNoteArt(); }));
renderLadder(); nextQuiz(); quizScore(); nextNote(); noteScore();

// ---- Spider exercise ----
var spTimer = null;
const SPIDER_ORDERS = [["1 2 3 4", [1, 2, 3, 4]], ["4 3 2 1", [4, 3, 2, 1]], ["1 3 2 4", [1, 3, 2, 4]], ["1 2 4 3", [1, 2, 4, 3]], ["2 1 4 3", [2, 1, 4, 3]], ["1 4 2 3", [1, 4, 2, 3]]];
let spSeq = [], spIdx = 0, spCtx = null;
$("sp-fret").innerHTML = Array.from({ length: 9 }, (_, i) => `<option value="${i + 1}">Frets ${i + 1} to ${i + 4}</option>`).join("");
$("sp-order").innerHTML = SPIDER_ORDERS.map(([n], i) => `<option value="${i}">${n}</option>`).join("");
function spiderSeq() {
  const start = +$("sp-fret").value, order = SPIDER_ORDERS[+$("sp-order").value][1], strs = [0, 1, 2, 3, 4, 5];
  if ($("sp-dir").value === "back") strs.push(...[4, 3, 2, 1, 0]);
  return strs.flatMap(s => order.map(f => ({ s, fret: start + f - 1, finger: f })));
}
function spiderSVG(cur) {
  const start = +$("sp-fret").value, W = 190, top = 34, left = 40, gap = 22, fh = 30, rows = 4, H = top + fh * rows + 24;
  const x = i => left + gap * (hand === "left" ? 5 - i : i);
  let s = `<svg class="chord spider-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Spider exercise diagram, ${hand}-handed">`;
  for (let i = 0; i < 6; i++) s += `<line class="grid-line" x1="${x(i)}" y1="${top}" x2="${x(i)}" y2="${top + fh * rows}"/>`;
  for (let r = 1; r <= rows; r++) s += `<line class="grid-line" x1="${left}" y1="${top + fh * r}" x2="${left + gap * 5}" y2="${top + fh * r}"/>`;
  s += start === 1 ? `<line class="nut" x1="${left - 1}" y1="${top}" x2="${left + gap * 5 + 1}" y2="${top}"/>` : `<line class="grid-line" x1="${left}" y1="${top}" x2="${left + gap * 5}" y2="${top}"/>`;
  for (let r = 0; r < rows; r++) s += `<text class="fret-no" x="${left - 14}" y="${top + fh * r + fh / 2 + 3}" text-anchor="middle">${start + r}</text>`;
  for (let i = 0; i < 6; i++) for (let r = 0; r < rows; r++) s += `<circle class="spd-ghost" cx="${x(i)}" cy="${top + fh * r + fh / 2}" r="7"/>`;
  if (cur) {
    const cy = top + fh * (cur.fret - start) + fh / 2;
    s += `<circle class="dot" cx="${x(cur.s)}" cy="${cy}" r="10"/><text class="fnum" x="${x(cur.s)}" y="${cy + 4}" text-anchor="middle">${cur.finger}</text>`;
  }
  STRING_LETTERS.forEach((n, i) => { s += `<text class="sname${cur && cur.s === i ? " cur" : ""}" x="${x(i)}" y="${top + fh * rows + 16}" text-anchor="middle">${n}</text>`; });
  return s + `</svg>`;
}
function renderSpider() {
  const cur = spTimer && spSeq[spIdx] ? spSeq[spIdx] : null;
  $("sp-art").innerHTML = spiderSVG(cur);
  const order = SPIDER_ORDERS[+$("sp-order").value][1];
  if (cur) {
    $("sp-now").textContent = `${STRING_WORDS[cur.s][0].toUpperCase() + STRING_WORDS[cur.s].slice(1)} string · fret ${cur.fret} · finger ${cur.finger}`;
    const base = Math.floor(spIdx / 4) * 4;
    $("sp-steps").innerHTML = order.map((f, i) => `<span class="${base + i === spIdx ? "on" : ""}">${f}</span>`).join("");
    $("sp-count").textContent = `Note ${spIdx + 1} of ${spSeq.length}`;
  } else { $("sp-steps").innerHTML = order.map(f => `<span>${f}</span>`).join(""); }
}
function spiderTick() {
  renderSpider();
  const cur = spSeq[spIdx];
  if (spCtx) {
    const o = spCtx.createOscillator(), g = spCtx.createGain(), t = spCtx.currentTime, first = spIdx % 4 === 0;
    o.frequency.value = first ? 1500 : 1000; g.gain.setValueAtTime(first ? 0.3 : 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    o.connect(g).connect(spCtx.destination); o.start(t); o.stop(t + 0.06);
  }
  spIdx = (spIdx + 1) % spSeq.length;
  spTimer = setTimeout(spiderTick, 60000 / +$("sp-bpm").value);
}
function stopSpider() {
  if (!spTimer) return;
  clearTimeout(spTimer); spTimer = null; spIdx = 0;
  $("sp-go").textContent = "Start spider"; $("sp-now").textContent = "Stopped. Press start to go again."; $("sp-count").textContent = "";
  renderSpider();
}
$("sp-go").addEventListener("click", () => {
  if (spTimer) { stopSpider(); return; }
  try { spCtx = spCtx || new (window.AudioContext || window.webkitAudioContext)(); spCtx.resume(); } catch (e) { spCtx = null; }
  spSeq = spiderSeq(); spIdx = 0; $("sp-go").textContent = "Stop"; spiderTick();
});
["sp-fret", "sp-order", "sp-dir"].forEach(id => $(id).addEventListener("change", () => { if (spTimer) { clearTimeout(spTimer); spTimer = null; spSeq = spiderSeq(); spIdx = 0; spTimer = 1; spiderTick(); } else renderSpider(); }));
document.querySelectorAll("button[data-hand]").forEach(b => b.addEventListener("click", renderSpider));
renderSpider();
