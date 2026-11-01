// ---- My strumming patterns (saved in the browser, can be sent to the trainer) ----
let strumSaved = [];
try {
  const raw = JSON.parse(localStorage.getItem("ct-strum"));
  if (Array.isArray(raw)) strumSaved = raw.filter(p => p && Array.isArray(p.s) && [6, 8, 16].includes(p.s.length))
    .map(p => ({ id: String(p.id), name: String(p.name || "Pattern").slice(0, 40), s: p.s.map(x => x === "D" || x === "U" ? x : "") }));
} catch (e) {}
let sbEdit = { id: null, name: "", s: Array(8).fill("") };
let sbTimer = null, sbIdx = 0, sbCtx = null, sbMsgTimer = null;
const ARROW = { D: "↓", U: "↑", "": "·" }, ARROW_WORD = { D: "down", U: "up", "": "rest" };
const arrowsOf = s => s.map(x => ARROW[x]).join(" ");

function syncTrainerPatterns() {
  Object.keys(PATTERNS).filter(k => k.startsWith("my-")).forEach(k => delete PATTERNS[k]);
  strumSaved.forEach(p => { PATTERNS["my-" + p.id] = { name: p.name, note: "Your own pattern.", s: p.s }; });
  const sel = $("pattern"), cur = sel.value;
  const base = Object.entries(PATTERNS).filter(([k]) => !k.startsWith("my-")).map(([k, p]) => `<option value="${k}">${p.name}</option>`).join("");
  const mine = strumSaved.map(p => `<option value="my-${p.id}">${esc(p.name)}  ${arrowsOf(p.s)}</option>`).join("");
  sel.innerHTML = base + (mine ? `<optgroup label="My patterns">${mine}</optgroup>` : "");
  if ([...sel.options].some(o => o.value === cur)) sel.value = cur; else sel.value = "four";
  sel.dispatchEvent(new Event("change"));
}
function saveStrum() { try { localStorage.setItem("ct-strum", JSON.stringify(strumSaved)); } catch (e) {} syncTrainerPatterns(); }
function sbSay(msg) { $("sb-hint").textContent = msg; clearTimeout(sbMsgTimer); sbMsgTimer = setTimeout(() => $("sb-hint").textContent = "", 2500); }

function renderSlots() {
  $("sb-slots").innerHTML = sbEdit.s.map((v, i) => {
    const beat = i % 2 === 0, label = beat ? i / 2 + 1 : "&";
    return `<button type="button" class="sb-slot${beat ? " beat" : ""}${v ? " set" : ""}" id="sb-slot-${i}" data-i="${i}" aria-label="Count ${label}: ${ARROW_WORD[v]}"><span>${ARROW[v]}</span><small>${label}</small></button>`;
  }).join("");
}
function renderSaved() {
  $("sb-saved").innerHTML = `<button type="button" class="chip" id="sb-new" data-id="">+ New</button>` +
    strumSaved.map(p => `<button type="button" class="chip" id="sb-chip-${p.id}" data-id="${p.id}" aria-pressed="${p.id === sbEdit.id}" title="${arrowsOf(p.s)}">${esc(p.name)}</button>`).join("");
  $("sb-del").disabled = !sbEdit.id;
}
function renderEditor() {
  $("sb-name").value = sbEdit.name; $("sb-len").value = sbEdit.s.length;
  renderSlots(); renderSaved();
}
function nextVariation(name) {
  const m = name.match(/^(.*?) v(\d+)$/), base = m ? m[1] : name; let n = m ? +m[2] + 1 : 2;
  while (strumSaved.some(p => p.name === `${base} v${n}`)) n++;
  return `${base} v${n}`;
}
function saveCurrent(asVariation) {
  let name = $("sb-name").value.trim() || "Pattern " + (strumSaved.length + 1);
  const isNew = !sbEdit.id;
  if (asVariation && !isNew) { name = nextVariation(name); sbEdit.id = null; }
  if (sbEdit.id) { const p = strumSaved.find(x => x.id === sbEdit.id); if (p) { p.name = name; p.s = [...sbEdit.s]; } }
  else { sbEdit.id = String(Date.now()); strumSaved.push({ id: sbEdit.id, name, s: [...sbEdit.s] }); }
  sbEdit.name = name; saveStrum(); renderEditor();
  sbSay(asVariation && !isNew ? "Saved as " + name : "Saved");
}
function stopStrumPlay() {
  clearTimeout(sbTimer); sbTimer = null;
  document.querySelectorAll("#sb-slots .sb-slot").forEach(b => b.classList.remove("on"));
  $("sb-play").textContent = "Play";
}
function strumTick() {
  document.querySelectorAll("#sb-slots .sb-slot").forEach((b, i) => b.classList.toggle("on", i === sbIdx));
  if (sbCtx && sbIdx % 2 === 0) {
    const o = sbCtx.createOscillator(), g = sbCtx.createGain(), t = sbCtx.currentTime;
    o.frequency.value = sbIdx === 0 ? 1500 : 1000; g.gain.setValueAtTime(sbIdx === 0 ? 0.3 : 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    o.connect(g).connect(sbCtx.destination); o.start(t); o.stop(t + 0.06);
  }
  sbIdx = (sbIdx + 1) % sbEdit.s.length;
  sbTimer = setTimeout(strumTick, 60000 / +$("sb-bpm").value / 2);
}
function initStrum() {
  renderEditor(); syncTrainerPatterns();
  $("sb-slots").addEventListener("click", e => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    const i = +b.dataset.i, order = ["", "D", "U"]; sbEdit.s[i] = order[(order.indexOf(sbEdit.s[i]) + 1) % 3];
    b.classList.toggle("set", !!sbEdit.s[i]); b.querySelector("span").textContent = ARROW[sbEdit.s[i]];
    b.setAttribute("aria-label", `Count ${i % 2 === 0 ? i / 2 + 1 : "&"}: ${ARROW_WORD[sbEdit.s[i]]}`);
  });
  $("sb-name").addEventListener("input", e => { sbEdit.name = e.target.value; });
  $("sb-len").addEventListener("change", e => { const n = +e.target.value; sbEdit.s = Array.from({ length: n }, (_, i) => sbEdit.s[i] || ""); stopStrumPlay(); renderSlots(); });
  $("sb-saved").addEventListener("click", e => {
    const b = e.target.closest("button[data-id]"); if (!b) return;
    stopStrumPlay();
    if (!b.dataset.id) sbEdit = { id: null, name: "", s: Array(8).fill("") };
    else { const p = strumSaved.find(x => x.id === b.dataset.id); sbEdit = { id: p.id, name: p.name, s: [...p.s] }; }
    renderEditor();
  });
  $("sb-fill").addEventListener("click", () => {
    const toks = $("sb-type").value.trim().split(/[\s,]+/).filter(Boolean);
    if (!toks.length) { sbSay("Type something like D - D U - U D U"); return; }
    const map = t => /^(d|down|↓)$/i.test(t) ? "D" : /^(u|up|↑)$/i.test(t) ? "U" : "";
    sbEdit.s = sbEdit.s.map((_, i) => i < toks.length ? map(toks[i]) : "");
    renderSlots(); sbSay(toks.length > sbEdit.s.length ? "Only the first " + sbEdit.s.length + " fit" : "Filled");
  });
  $("sb-save").addEventListener("click", () => saveCurrent(false));
  $("sb-var").addEventListener("click", () => saveCurrent(true));
  $("sb-clear").addEventListener("click", () => { stopStrumPlay(); sbEdit.s = sbEdit.s.map(() => ""); renderSlots(); });
  $("sb-del").addEventListener("click", () => {
    if (!sbEdit.id) return; stopStrumPlay();
    strumSaved = strumSaved.filter(p => p.id !== sbEdit.id); sbEdit = { id: null, name: "", s: Array(8).fill("") };
    saveStrum(); renderEditor(); sbSay("Deleted");
  });
  $("sb-play").addEventListener("click", () => {
    if (sbTimer) { stopStrumPlay(); return; }
    try { sbCtx = sbCtx || new (window.AudioContext || window.webkitAudioContext)(); sbCtx.resume(); } catch (e) { sbCtx = null; }
    sbIdx = 0; $("sb-play").textContent = "Stop"; strumTick();
  });
  $("sb-use").addEventListener("click", () => {
    if (!sbEdit.id) saveCurrent(false);
    $("pattern").value = "my-" + sbEdit.id; $("pattern").dispatchEvent(new Event("change"));
    $("practice").scrollIntoView({ behavior: "smooth" });
  });
}
initStrum();
