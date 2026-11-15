// ---- Mirror video ----
// Plays a YouTube video (through YouTube's own embedded player) or a direct video file, flipped left-to-right.
let vid = null; // { kind: "yt"|"file", ... }
let vidA = null, vidB = null, vidPoll = null, ytReady = null;
const fmtT = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
function parseVideoUrl(text) {
  const t = String(text).trim();
  if (!t) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(t)) return { kind: "yt", id: t, start: 0 };
  let u; try { u = new URL(/^[a-z]+:\/\//i.test(t) ? t : "https://" + t); } catch (e) { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const host = u.hostname.replace(/^(www\.|m\.|music\.)/, "");
  const secs = v => { if (!v) return 0; if (/^\d+$/.test(v)) return +v; const m = v.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/); return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0; };
  let id = null;
  if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else { const m = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?]+)/); if (m) id = m[1]; }
  }
  if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return { kind: "yt", id, start: secs(u.searchParams.get("t") || u.searchParams.get("start")) };
  if (host.includes("youtu")) return null;
  if (/\.(mp4|webm|mov|m4v|ogv)$/i.test(u.pathname)) return { kind: "file", url: u.href };
  return null;
}
function vidMsg(t) { $("vid-msg").textContent = t; }
function applyMirror() { $("vid-media").classList.toggle("flip", $("vid-mirror").checked); try { localStorage.setItem("ct-vmirror", $("vid-mirror").checked ? "1" : "0"); } catch (e) {} }
function loadYT() {
  if (ytReady) return ytReady;
  ytReady = new Promise((res, rej) => {
    if (window.YT && YT.Player) return res();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); res(); };
    const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; s.onerror = () => { ytReady = null; rej(new Error("load")); };
    document.head.appendChild(s);
    setTimeout(() => { if (!(window.YT && YT.Player)) { ytReady = null; rej(new Error("timeout")); } }, 12000);
  });
  return ytReady;
}
const vidApi = {
  time: () => !vid ? 0 : vid.kind === "yt" ? (vid.p.getCurrentTime ? vid.p.getCurrentTime() : 0) : vid.el.currentTime,
  dur: () => !vid ? 0 : vid.kind === "yt" ? (vid.p.getDuration ? vid.p.getDuration() : 0) : (vid.el.duration || 0),
  playing: () => !vid ? false : vid.kind === "yt" ? (vid.p.getPlayerState && vid.p.getPlayerState() === 1) : !vid.el.paused,
  play: () => { if (!vid) return; vid.kind === "yt" ? vid.p.playVideo() : vid.el.play(); },
  pause: () => { if (!vid) return; vid.kind === "yt" ? vid.p.pauseVideo() : vid.el.pause(); },
  seek: s => { if (!vid) return; s = Math.max(0, Math.min(s, vidApi.dur() || s)); vid.kind === "yt" ? vid.p.seekTo(s, true) : (vid.el.currentTime = s); },
  rate: r => { if (!vid) return; vid.kind === "yt" ? vid.p.setPlaybackRate(r) : (vid.el.playbackRate = r); },
};
function vidPause() { try { if (vid && vidApi.playing()) vidApi.pause(); } catch (e) {} }
function vidTick() {
  if (!vid) return;
  let t = 0, d = 0; try { t = vidApi.time(); d = vidApi.dur(); } catch (e) { return; }
  if (!$("vid-seek").matches(":active")) $("vid-seek").value = d ? Math.round(t / d * 1000) : 0;
  $("vid-time").textContent = fmtT(t) + " / " + fmtT(d);
  $("vid-play").textContent = vidApi.playing() ? "Pause" : "Play";
  if (vidA !== null && vidB !== null && vidB > vidA && t >= vidB) vidApi.seek(vidA);
}
function vidLoopText() { $("vid-loop-txt").textContent = vidA === null ? "" : vidB === null ? `Start ${fmtT(vidA)}. Now set the end.` : `Repeating ${fmtT(vidA)} to ${fmtT(vidB)}`; }
function vidClearLoop() { vidA = vidB = null; vidLoopText(); }
async function loadVideo(text) {
  const r = parseVideoUrl(text);
  if (!r) { vidMsg("That doesn't look like a YouTube link or a direct video file link. Try a link like https://www.youtube.com/watch?v=..."); return; }
  vidPause(); vidClearLoop();
  $("vid-stage").hidden = false; $("vid-rate").value = "1";
  $("vid-media").innerHTML = "";
  try { localStorage.setItem("ct-vurl", text.trim()); } catch (e) {}
  if (r.kind === "file") {
    const el = document.createElement("video"); el.src = r.url; el.playsInline = true; el.preload = "metadata"; el.setAttribute("playsinline", "");
    el.addEventListener("error", () => vidMsg("This file couldn't be loaded. The site that hosts it may block other websites from playing it."));
    el.addEventListener("loadedmetadata", () => vidMsg("Ready. Press Play."));
    $("vid-media").appendChild(el); vid = { kind: "file", el }; vidMsg("Loading..."); applyMirror(); vidTick(); return;
  }
  vidMsg("Loading from YouTube...");
  try { await loadYT(); } catch (e) { vidMsg("Couldn't reach YouTube. Check your connection or any ad blocker, then try again."); $("vid-stage").hidden = true; return; }
  const holder = document.createElement("div"); $("vid-media").appendChild(holder);
  vid = { kind: "yt", p: null };
  vid.p = new YT.Player(holder, {
    videoId: r.id, host: "https://www.youtube-nocookie.com",
    playerVars: { controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3, start: r.start || 0, origin: location.origin },
    events: {
      onReady: () => { vidMsg("Ready. Press Play."); applyMirror(); },
      onError: e => vidMsg([101, 150].includes(e.data) ? "The owner of this video doesn't allow it to be played on other websites. Try another video." : e.data === 100 ? "This video was not found or is private." : "YouTube couldn't play this video. Try another one."),
    },
  });
  applyMirror();
}
$("vid-form").addEventListener("submit", e => { e.preventDefault(); loadVideo($("vid-url").value); });
$("vid-mirror").addEventListener("change", applyMirror);
$("vid-play").addEventListener("click", () => vidApi.playing() ? vidApi.pause() : vidApi.play());
$("vid-tap").addEventListener("click", () => vidApi.playing() ? vidApi.pause() : vidApi.play());
$("vid-back").addEventListener("click", () => vidApi.seek(vidApi.time() - 5));
$("vid-fwd").addEventListener("click", () => vidApi.seek(vidApi.time() + 5));
$("vid-rate").addEventListener("change", e => vidApi.rate(+e.target.value));
$("vid-seek").addEventListener("input", e => vidApi.seek(vidApi.dur() * e.target.value / 1000));
$("vid-a").addEventListener("click", () => { vidA = vidApi.time(); vidB = null; vidLoopText(); });
$("vid-b").addEventListener("click", () => { if (vidA === null) { vidLoopText(); return; } const t = vidApi.time(); if (t > vidA + 0.5) { vidB = t; vidLoopText(); } else $("vid-loop-txt").textContent = "The end must be after the start."; });
$("vid-clear").addEventListener("click", vidClearLoop);
vidPoll = setInterval(() => { if (!$("video").hidden) vidTick(); }, 250);
try {
  const m = localStorage.getItem("ct-vmirror"); $("vid-mirror").checked = m === null ? hand === "left" : m === "1";
  const u = localStorage.getItem("ct-vurl"); if (u) $("vid-url").value = u;
} catch (e) {}
