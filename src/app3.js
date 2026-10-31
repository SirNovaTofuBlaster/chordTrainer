// ---- Daily exercises ----
const ROUTINE = [
  { id: "warm", name: "Finger warm-up", mins: 2, what: "Spider exercise: fingers 1, 2, 3, 4 on four frets in a row, one note each, across all six strings and back." },
  { id: "perfect", name: "Chord Perfect Practice", mins: 5, what: "Finger a chord, strum, pick each string one by one, strum again, lift your hand off and repeat. Fix any string that buzzes or is muted." },
  { id: "silent", name: "Silent changes", mins: 2, what: "Switch between two chords without strumming. Do 20 changes and look for fingers that can stay put." },
  { id: "oneminute", name: "One-minute changes", mins: 3, what: "Three pairs, one minute each. Count your clean changes and write the number down." },
  { id: "strum", name: "Strumming hand", mins: 3, what: "Count 1 2 3 4 with a down strum on each number. Then add up strums on the 'and'. Keep your hand moving." },
  { id: "songs", name: "Play a song", mins: 5, what: "Pick one song and play it through, even if it is rough. Drills only help once you use them on real music." },
];
const SRC = {
  omc: ["JustinGuitar: One Minute Changes", "https://justinguitar.com/guitar-lessons/one-minute-changes-exercise-b1-110"],
  stage1: ["JustinGuitar: Stage 1 practice schedule", "https://justinguitar.com/guitar-lessons/stage-1-practice-schedule-bc-119"],
  forum: ["JustinGuitar community: practising chord changes", "https://community.justinguitar.com/t/how-do-people-incorporate-practicing-chord-changes-in-the-learning-routine/395975"],
  perfect: ["JustinGuitar community: Chord Perfect Practice", "https://community.justinguitar.com/t/how-do-i-properly-use-the-chord-perfect-practice-on-the-app/200534"],
  muted: ["JustinGuitar community: muted thin strings", "https://community.justinguitar.com/t/small-hands-any-tips-for-arching-over-the-thin-string-so-they-are-not-muted-when-playing-chords-ps-learning-guitar-has-given-me-a-new-found-respect-for-guitar-players/351317"],
  dadd: ["D'Addario: 20-minute practice routine", "https://www.daddario.com/en-eu/blogs/guitar/20-minute-practice-routine"],
  gg15: ["GoodGuitarist: 15-minute beginner routine", "https://goodguitarist.com/improve-fast-with-this-15-minute-beginner-guitar-practice-routine"],
  ggfast: ["GoodGuitarist: practising switching chords", "https://goodguitarist.com/fastest-way-to-practice-switching-chords"],
  challenge: ["GuitarLessons.com: 5-minute chord changing challenge", "https://guitarlessons.com/guitar-lessons/guitar-lessons-for-beginners/chord-changing-challenge/"],
  spider: ["Guitar World: the spider exercise", "https://guitarworld.com/lessons/spider-exercise"],
};
const EXERCISES = [
  { name: "Chord Perfect Practice", mins: "5 min", why: "Makes sure every string in the chord rings clearly before you worry about speed. Spend about 3 minutes on each of two chords.",
    steps: ["Finger the chord.", "Strum it once.", "Pick each string on its own, starting from the lowest string the chord uses.", "If a string is dead or buzzing, adjust your fingers and pick it again.", "Strum the chord again.", "Lift your hand right off the neck, then start over."], src: ["perfect", "dadd"] },
  { name: "Silent changes", mins: "2 min", why: "Takes the strumming out so your fingers learn the movement. Look for an anchor finger, a finger that stays on the same string or moves very little between the two chords.",
    steps: ["Pick two chords.", "Switch between them without strumming, at least 20 times.", "Check each finger lands right behind its fret.", "Try to move all fingers at the same moment, not one at a time."], src: ["gg15", "dadd"] },
  { name: "One-minute changes", mins: "3 min", why: "The most recommended chord exercise. It shows you your progress in a single number.",
    steps: ["Pick two chords.", "Start a one-minute timer and switch back and forth as many times as you can.", "Count only changes where the new chord is in place. Sounding a little wonky is fine early on.", "Write the number down. Try to beat it tomorrow.", "Rotate through about three pairs a day, or five if you have time."], src: ["omc", "forum"] },
  { name: "Chord changing challenge", mins: "5 min", why: "Five one-minute rounds that get faster each time. Good for the pair that gives you the most trouble.",
    steps: ["Round 1: switch between the two chords as cleanly as you can, with no metronome.", "Round 2: set a metronome to about 70 BPM (slower if you need) and change every 4 beats.", "Round 3: raise the tempo by 5 to 10 BPM and keep the changes clean.", "Round 4: raise it again. Picture the next chord before you move to it.", "Round 5: raise it once more and notice how each shape feels as you reach it."], src: ["challenge"] },
  { name: "Slow first, then with a beat", mins: "3 min", why: "Accuracy first, speed second. Speed comes from repeating clean changes, not from rushing.",
    steps: ["Place your fingers on the first chord and strum.", "Move slowly to the second chord and check every finger before you strum.", "When that feels easy, change on the beat with a metronome.", "Raise the tempo a little at a time."], src: ["ggfast"] },
  { name: "Strumming hand count", mins: "3 min", why: "Your strumming hand needs practice too. Do it on muted strings so you can focus on the rhythm.",
    steps: ["Strum down on every number: 1 2 3 4.", "Add the gaps: 1 and 2 and 3 and 4 and, with small downs on the numbers.", "Add ups on the 'and', and keep your hand moving even when you miss the strings.", "Try a pattern such as down, down-up, down-up."], src: ["gg15"] },
  { name: "Two-chord loop", mins: "5 min", why: "Puts the change and the strum together, which is what a song asks of you.",
    steps: ["Play the first chord for four bars, counting 1 2 3 4 each bar.", "Play the second chord for four bars.", "Start with down strums only, then use your pattern.", "Once that is easy, make it three or four chords in a row, then time it with a metronome."], src: ["gg15", "forum"] },
  { name: "Spider warm-up", mins: "2 min", why: "Builds finger independence and gets your hand moving. Start with all down picks, then alternate.",
    steps: ["Put fingers 1 to 4 on four frets in a row.", "Play one note with each finger in order, 1-2-3-4.", "Move to the next string and repeat, all the way across and back.", "Stay close to the fret wire and keep your fingers parallel to the frets.", "Later try other orders such as 4-3-2-1 or 3-2-1-4."], src: ["spider"] },
  { name: "Fix muted thin strings", mins: "ongoing", why: "Dull thin strings in a chord usually come from fingers leaning onto them.",
    steps: ["Use your fingertips, with each finger as close to straight up from the fretboard as you can.", "Press only hard enough for the note to ring. Pressing harder than that is a common habit.", "Check one string at a time to find which finger is touching it.", "Soft fingertips are normal at first. Calluses build up over a few weeks.", "Do short sessions, about 15 minutes, split up if your fingers get sore."], src: ["muted"] },
  { name: "Play songs", mins: "5 to 10 min", why: "Every source says the same thing: drills are not a replacement for playing music.",
    steps: ["Learn a new chord, then try songs that use it with chords you already know.", "Practise the chord pairs your song uses. C usually goes with Am or Em in songs.", "Do a few minutes of drills, then play the song.", "Go back to drills only on days when your changes feel slow."], src: ["forum", "stage1"] },
];
const MILES = [
  "30 changes a minute between D and A before you move on to the next chord.",
  "40 changes a minute, D, A and E known from memory, and one or two songs you can play.",
  "60 changes a minute (one a second) is the long-term target.",
];
const PAIRS = [["G","maj","C","maj"],["G","maj","D","maj"],["C","maj","D","maj"],["A","min","C","maj"],["E","min","C","maj"],["A","min","E","min"],["D","maj","A","maj"],["A","maj","E","maj"],["D","maj","E","min"],["C","maj","F","maj"]];

let daily = {};
try { daily = JSON.parse(localStorage.getItem("ct-daily")) || {}; } catch (e) {}
const dateKey = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const todayKey = () => dateKey(new Date());
function saveDaily() {
  const keep = Object.keys(daily).sort().slice(-90), o = {}; keep.forEach(k => o[k] = daily[k]); daily = o;
  try { localStorage.setItem("ct-daily", JSON.stringify(daily)); } catch (e) {}
}
const doneToday = () => daily[todayKey()] || [];
function streakDays() {
  const d = new Date(); let n = 0;
  if (!(daily[dateKey(d)] || []).length) d.setDate(d.getDate() - 1);
  while ((daily[dateKey(d)] || []).length) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function updateSummary() {
  const done = doneToday(), total = ROUTINE.reduce((a, r) => a + r.mins, 0), mins = ROUTINE.filter(r => done.includes(r.id)).reduce((a, r) => a + r.mins, 0);
  const pct = Math.round(mins / total * 100);
  $("ex-fill").style.width = pct + "%"; $("ex-bar").setAttribute("aria-valuenow", pct);
  $("ex-summary").textContent = `${done.length} of ${ROUTINE.length} done · ${mins} of ${total} minutes`;
  const s = streakDays();
  $("ex-streak").textContent = s ? `${s} ${s === 1 ? "day" : "days"} in a row` : "Start your streak today";
  $("ex-streak").classList.toggle("on", s > 0);
  document.querySelectorAll(".ex-row").forEach(r => r.classList.toggle("done", done.includes(r.dataset.id)));
}
function setDone(id, on) {
  const k = todayKey(), set = new Set(daily[k] || []);
  on ? set.add(id) : set.delete(id);
  daily[k] = ROUTINE.map(r => r.id).filter(x => set.has(x));
  if (!daily[k].length) delete daily[k];
  saveDaily();
  const box = $("ex-chk-" + id); if (box) box.checked = on;
  updateSummary();
}
let exTimer = null, exTimerId = null, exLeft = 0, exCtx = null;
const fmtTime = s => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
function stopTimer() {
  clearInterval(exTimer); exTimer = null;
  if (exTimerId) { const b = document.querySelector(`[data-timer="${exTimerId}"]`); if (b) b.textContent = "Start timer"; }
  exTimerId = null;
}
function exBeep() {
  if (!exCtx) return;
  const t = exCtx.currentTime;
  [0, 0.25, 0.5].forEach(o => {
    const os = exCtx.createOscillator(), g = exCtx.createGain();
    os.frequency.value = 880; g.gain.setValueAtTime(0.25, t + o); g.gain.exponentialRampToValueAtTime(0.001, t + o + 0.2);
    os.connect(g).connect(exCtx.destination); os.start(t + o); os.stop(t + o + 0.22);
  });
}
function tickTimer() {
  const b = document.querySelector(`[data-timer="${exTimerId}"]`);
  if (b) b.textContent = fmtTime(exLeft) + " · Stop";
  if (exLeft <= 0) { const id = exTimerId; stopTimer(); exBeep(); setDone(id, true); return; }
  exLeft--;
}
function startTimer(id) {
  const same = exTimerId === id; stopTimer(); if (same) return;
  try { exCtx = exCtx || new (window.AudioContext || window.webkitAudioContext)(); exCtx.resume(); } catch (e) { exCtx = null; }
  exTimerId = id; exLeft = ROUTINE.find(r => r.id === id).mins * 60;
  tickTimer(); exTimer = setInterval(tickTimer, 1000);
}
function todaysPairs() {
  const d = new Date(), n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5), s = (n * 3) % PAIRS.length;
  return [0, 1, 2].map(i => PAIRS[(s + i) % PAIRS.length]);
}
function loadPair(p) {
  [["c1r", p[0]], ["c1t", p[1]], ["c2r", p[2]], ["c2t", p[3]]].forEach(([id, v]) => { $(id).value = v; $(id).dispatchEvent(new Event("change")); });
  $("practice").scrollIntoView({ behavior: "smooth" });
}
function renderRoutine() {
  stopTimer();
  const done = doneToday();
  $("ex-list").innerHTML = ROUTINE.map(r => `<li class="ex-row" data-id="${r.id}">
    <label class="ex-check" for="ex-chk-${r.id}"><input type="checkbox" id="ex-chk-${r.id}" data-id="${r.id}"${done.includes(r.id) ? " checked" : ""}><span class="ex-title">${r.name} <small>${r.mins} min</small></span></label>
    <span class="ex-what">${esc(r.what)}</span>
    <button type="button" class="mini" id="ex-timer-${r.id}" data-timer="${r.id}">Start timer</button></li>`).join("");
  updateSummary();
}
function initExercises() {
  renderRoutine();
  $("ex-list").addEventListener("change", e => { if (e.target.matches("input[data-id]")) setDone(e.target.dataset.id, e.target.checked); });
  $("ex-list").addEventListener("click", e => { const b = e.target.closest("button[data-timer]"); if (b) startTimer(b.dataset.timer); });
  $("ex-all").addEventListener("click", () => { stopTimer(); daily[todayKey()] = ROUTINE.map(r => r.id); saveDaily(); renderRoutine(); });
  $("ex-reset").addEventListener("click", () => { stopTimer(); delete daily[todayKey()]; saveDaily(); renderRoutine(); });
  $("ex-pairs").innerHTML = todaysPairs().map((p, i) => `<div class="ex-pair"><b>${chordName(p[0], p[1])} <span aria-hidden="true">↔</span><span class="sr-only"> and </span> ${chordName(p[2], p[3])}</b><button type="button" class="mini" id="ex-pair-${i}" data-pair="${i}">Open in trainer</button></div>`).join("");
  $("ex-pairs").addEventListener("click", e => { const b = e.target.closest("button[data-pair]"); if (b) loadPair(todaysPairs()[+b.dataset.pair]); });
  $("ex-miles").innerHTML = MILES.map(m => `<li>${m}</li>`).join("");
  $("ex-lib").innerHTML = EXERCISES.map((x, i) => `<details class="exd" id="exd-${i}"><summary><span class="exd-name">${x.name}</span><span class="exd-meta">${x.mins}</span></summary>
    <div class="exd-body"><p>${x.why}</p><ol>${x.steps.map(s => `<li>${s}</li>`).join("")}</ol>
    <p class="muted src">From ${x.src.map(k => `<a href="${SRC[k][1]}" target="_blank" rel="noopener noreferrer">${SRC[k][0]}</a>`).join(" and ")}</p></div></details>`).join("");
  $("ex-src").innerHTML = Object.values(SRC).map(s => `<li><a href="${s[1]}" target="_blank" rel="noopener noreferrer">${s[0]}</a></li>`).join("");
}
initExercises();
