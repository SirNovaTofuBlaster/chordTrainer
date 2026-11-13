// ---- Pentatonic tab ----
const PT_LABELS = { minor: ["1", "b3", "4", "5", "b7"], major: ["1", "2", "3", "5", "6"] };
$("pt-root").innerHTML = ROOTS.map(r => `<option value="${r}">${r}${ROOT_ALT[r] ? " (" + ROOT_ALT[r] + ")" : ""}</option>`).join("");
$("pt-root").value = "A";
function ptNameOf(root, kind, pc) {
  const rp = pcOf(root), lab = PT_LABELS[kind].find(l => (rp + parseLabel(l).semis) % 12 === pc);
  return { lab, name: spell(root, lab) };
}
function ptSVG(box, root, kind, labelMode, cur) {
  const open = box.lo === 0, base = open ? 1 : box.lo, last = box.hi, rows = Math.max(4, last - base + 1);
  const W = 162, top = open ? 38 : 30, left = 48, gap = 17, fh = 24, H = top + fh * rows + 10;
  const x = i => left + gap * (hand === "left" ? 5 - i : i), rp = pcOf(root);
  let s = `<svg class="chord pt-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Box ${box.number}, frets ${box.lo} to ${box.hi}, ${hand}-handed">`;
  for (let i = 0; i < 6; i++) s += `<line class="grid-line" x1="${x(i)}" y1="${top}" x2="${x(i)}" y2="${top + fh * rows}"/>`;
  for (let r = 1; r <= rows; r++) s += `<line class="grid-line" x1="${left}" y1="${top + fh * r}" x2="${left + gap * 5}" y2="${top + fh * r}"/>`;
  s += open ? `<line class="nut" x1="${left - 1}" y1="${top}" x2="${left + gap * 5 + 1}" y2="${top}"/>` : `<line class="grid-line" x1="${left}" y1="${top}" x2="${left + gap * 5}" y2="${top}"/>`;
  for (let r = 0; r < rows; r++) s += `<text class="fret-no" x="${left - 25}" y="${top + fh * r + fh / 2 + 3}" text-anchor="middle">${base + r}</text>`;
  box.strings.forEach((pair, i) => pair.forEach(fr => {
    const pc = (OPEN_PC[i] + fr) % 12, isRoot = pc === rp, y = fr === 0 ? top - 12 : top + fh * (fr - base) + fh / 2;
    const info = ptNameOf(root, kind, pc), text = labelMode === "none" ? "" : labelMode === "degrees" ? info.lab : info.name;
    const isCur = cur && cur.s === i && cur.fr === fr;
    s += `<circle class="dot${isRoot ? "" : " pn"}${isCur ? " cur" : ""}" cx="${x(i)}" cy="${y}" r="8.5"/>`;
    if (text) s += `<text class="fnum${isRoot ? "" : " pn"}${isCur ? " cur" : ""}" x="${x(i)}" y="${y + 3.2}" text-anchor="middle" style="font-size:${text.length > 1 ? 8 : 9.5}px">${esc(text)}</text>`;
  }));
  return s + `</svg>`;
}
function renderPenta() {
  const root = $("pt-root").value, kind = $("pt-kind").value, lm = $("pt-label").value, boxes = pentaBoxes(root, kind);
  const names = PT_LABELS[kind].map(l => spell(root, l));
  const rel = kind === "minor" ? { r: spell(root, "b3"), k: "major" } : { r: spell(root, "6"), k: "minor" };
  $("pt-notes").innerHTML = `<b>${root} ${kind} pentatonic:</b> <span class="pt-chips">${names.map((n, i) => `<span class="nchip${i === 0 ? " root" : ""}">${esc(n)}<small>${PT_LABELS[kind][i]}</small></span>`).join("")}</span>`;
  $("pt-same").textContent = `${root} ${kind} pentatonic has the same five notes as ${rel.r} ${rel.k} pentatonic, so the shapes are the same. Only the root changes.`;
  $("pt-grid").innerHTML = boxes.map(b => {
    const rootsTxt = b.rootFrets.map((f, s) => f.length ? `${STRING_LETTERS[s]} string fret ${f.join(" or ")}` : "").filter(Boolean).slice(0, 3).join(", ");
    return `<div class="panel pt-card"><div class="pt-head"><b>Box ${b.number}</b><span class="muted">frets ${b.lo} to ${b.hi}</span></div>${ptSVG(b, root, kind, lm)}<span class="muted pt-roots">Root: ${rootsTxt}</span></div>`;
  }).join("");
}
["pt-root", "pt-kind", "pt-label"].forEach(id => $(id).addEventListener("change", renderPenta));
document.querySelectorAll("button[data-hand]").forEach(b => b.addEventListener("click", renderPenta));
$("pt-neck").addEventListener("click", () => {
  $("fb-mode").value = "scale"; $("fb-root").value = $("pt-root").value;
  $("fb-scale").value = $("pt-kind").value === "major" ? "majpent" : "minpent";
  $("fb-mode").dispatchEvent(new Event("change")); goTab("fretboard");
});
renderPenta();

// ---- Exercise 1: play the box note by note ----
let ppIdx = -1, ppTimer = null, ppCtx = null;
function ppSeq() {
  const box = pentaBoxes($("pt-root").value, $("pt-kind").value)[+$("pp-box").value];
  const up = []; box.strings.forEach((pair, s) => pair.forEach(fr => up.push({ s, fr })));
  const dir = $("pp-dir").value, down = up.slice().reverse();
  return { box, seq: dir === "up" ? up : dir === "down" ? down : up.concat(down.slice(1)) };
}
function ppTab(box, cur) {
  const names = ["e", "B", "G", "D", "A", "E"];
  return [5, 4, 3, 2, 1, 0].map((si, row) => {
    const pair = box.strings[si], on = cur && cur.s === si;
    return names[row] + "|-" + pair.map(f => String(f).padEnd(3, "-")).join("-") + "|" + (on ? " <" : "");
  }).join("\n");
}
function renderPlay() {
  const root = $("pt-root").value, kind = $("pt-kind").value, { box, seq } = ppSeq(), cur = ppIdx >= 0 ? seq[ppIdx] : null;
  $("pp-art").innerHTML = ptSVG(box, root, kind, $("pt-label").value, cur);
  $("pp-tab").textContent = ppTab(box, cur);
  if (cur) {
    const info = ptNameOf(root, kind, (OPEN_PC[cur.s] + cur.fr) % 12);
    $("pp-now").textContent = `Note ${ppIdx + 1} of ${seq.length}: ${STRING_LETTERS[cur.s]} string, ${cur.fr === 0 ? "open" : "fret " + cur.fr} (${info.name})`;
  } else $("pp-now").textContent = "Press Start, or use Next note.";
}
function ppClick() {
  if (!$("pp-sound").checked) return;
  try {
    ppCtx = ppCtx || new (window.AudioContext || window.webkitAudioContext)(); ppCtx.resume();
    const o = ppCtx.createOscillator(), g = ppCtx.createGain(); o.frequency.value = 900; g.gain.value = 0.08;
    o.connect(g); g.connect(ppCtx.destination); o.start(); o.stop(ppCtx.currentTime + 0.04);
  } catch (e) { ppCtx = null; }
}
function ppAdvance() {
  const { seq } = ppSeq(); ppIdx = (ppIdx + 1) % seq.length; renderPlay(); ppClick();
}
function ppStop() { clearInterval(ppTimer); ppTimer = null; $("pp-go").textContent = "Start"; }
$("pp-go").addEventListener("click", () => {
  if (ppTimer) return ppStop();
  $("pp-go").textContent = "Stop"; ppAdvance(); ppTimer = setInterval(ppAdvance, 60000 / +$("pp-bpm").value);
});
$("pp-step").addEventListener("click", () => { ppStop(); ppAdvance(); });
$("pp-reset").addEventListener("click", () => { ppStop(); ppIdx = -1; renderPlay(); });
["pp-box", "pp-dir", "pp-bpm", "pt-root", "pt-kind", "pt-label"].forEach(id => $(id).addEventListener("change", () => { ppStop(); ppIdx = -1; renderPlay(); }));
document.querySelectorAll("button[data-hand]").forEach(b => b.addEventListener("click", renderPlay));
renderPlay();
// stop when leaving the tab
window.addEventListener("hashchange", ppStop);
