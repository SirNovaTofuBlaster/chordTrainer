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
  try { localStorage.setItem("ct-tab", id); } catch (e) {}
  if (location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
  if (scroll) window.scrollTo(0, 0);
}
document.querySelectorAll("nav.jump a").forEach(a => a.addEventListener("click", e => { e.preventDefault(); goTab(a.getAttribute("href").slice(1)); }));
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
  if (mode === "mine") { const m = mine.map(c => [c.root, c.type, c.vi || 0]); if (new Set(m.map(c => c[0] + c[1])).size >= 4) return m; }
  return QUICK.map(([r, t]) => [r, t, 0]);
}
function renderQuizArt() {
  if (!qCur) return;
  const vs = chordVoicings(qCur[0], qCur[1]);
  $("q-art").innerHTML = chordSVG(vs[qCur[2]] || vs[0], { label: "Mystery chord" });
}
function nextQuiz() {
  const pool = quizPool(); let c = pick(pool);
  if (qCur && pool.length > 1) while (c[0] + c[1] === qCur[0] + qCur[1]) c = pick(pool);
  qCur = c; qLock = false; renderQuizArt();
  const right = chordName(c[0], c[1]);
  const others = [...new Set([...pool, ...QUICK.map(([r, t]) => [r, t, 0])].map(x => chordName(x[0], x[1])))].filter(n => n !== right);
  $("q-opts").innerHTML = shuffle([right, ...shuffle(others).slice(0, 3)]).map(n => `<button type="button" class="chip" data-n="${esc(n)}">${esc(n)}</button>`).join("");
  $("q-msg").textContent = "";
  if ($("q-pool").value === "mine" && new Set(mine.map(c => c.root + c.type)).size < 4) $("q-msg").textContent = "Add at least 4 chords to My chords to be quizzed on them. Using beginner chords for now.";
}
function quizScore() { $("q-score").textContent = `${qRight} right out of ${qTotal} · streak ${qStreak} · best streak ${loadNum("ct-quiz-best")}`; }
$("q-opts").addEventListener("click", e => {
  const b = e.target.closest("button[data-n]"); if (!b || qLock) return; qLock = true;
  const right = chordName(qCur[0], qCur[1]), ok = b.dataset.n === right;
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
