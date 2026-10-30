// ---- Music theory data. Strings are listed thickest (low E) to thinnest (high e). ----
const LET = ["C","D","E","F","G","A","B"];
const LPC = [0,2,4,5,7,9,11];
const MAJ_STEPS = [0,2,4,5,7,9,11];
const ROOTS = ["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
const ROOT_ALT = { Db:"C#", Eb:"D#", "F#":"Gb", Ab:"G#", Bb:"A#" };

function pcOf(name) {
  let a = 0; for (const ch of name.slice(1)) a += ch === "#" ? 1 : -1;
  return (LPC[LET.indexOf(name[0])] + a + 120) % 12;
}
function parseLabel(label) {
  const m = label.match(/^([b#]*)(\d+)$/);
  const acc = m[1].split("").reduce((a, c) => a + (c === "#" ? 1 : -1), 0);
  const deg = +m[2];
  return { deg, semis: (MAJ_STEPS[(deg - 1) % 7] + acc + 120) % 12 };
}
function spell(root, label) {
  const { deg, semis } = parseLabel(label);
  const pc = (pcOf(root) + semis) % 12;
  const li = (LET.indexOf(root[0]) + deg - 1) % 7;
  let d = (pc - LPC[li] + 12) % 12; if (d > 6) d -= 12;
  return LET[li] + (d === 0 ? "" : d > 0 ? "#".repeat(d) : "b".repeat(-d));
}

const CHORD_TYPES = [
  { id: "maj",  sym: "",     name: "Major",          f: ["1","3","5"] },
  { id: "min",  sym: "m",    name: "Minor",          f: ["1","b3","5"] },
  { id: "5",    sym: "5",    name: "Power chord",    f: ["1","5"] },
  { id: "6",    sym: "6",    name: "Major 6th",      f: ["1","3","5","6"] },
  { id: "m6",   sym: "m6",   name: "Minor 6th",      f: ["1","b3","5","6"] },
  { id: "7",    sym: "7",    name: "Dominant 7th",   f: ["1","3","5","b7"] },
  { id: "maj7", sym: "maj7", name: "Major 7th",      f: ["1","3","5","7"] },
  { id: "m7",   sym: "m7",   name: "Minor 7th",      f: ["1","b3","5","b7"] },
  { id: "9",    sym: "9",    name: "Dominant 9th",   f: ["1","3","5","b7","9"] },
  { id: "add9", sym: "add9", name: "Add 9",          f: ["1","3","5","9"] },
  { id: "sus2", sym: "sus2", name: "Suspended 2nd",  f: ["1","2","5"] },
  { id: "sus4", sym: "sus4", name: "Suspended 4th",  f: ["1","4","5"] },
  { id: "dim",  sym: "dim",  name: "Diminished",     f: ["1","b3","b5"] },
  { id: "dim7", sym: "dim7", name: "Diminished 7th", f: ["1","b3","b5","bb7"] },
  { id: "m7b5", sym: "m7b5", name: "Half-diminished", f: ["1","b3","b5","b7"] },
  { id: "aug",  sym: "aug",  name: "Augmented",      f: ["1","3","#5"] },
];
const TYPE = Object.fromEntries(CHORD_TYPES.map(t => [t.id, t]));

// Movable shapes: frets relative to the barre fret. null = muted.
const E_SHAPES = {
  maj: [0,2,2,1,0,0], min: [0,2,2,0,0,0], "5": [0,2,2,null,null,null], "6": [0,2,2,1,2,0],
  m6: [0,2,2,0,2,0], "7": [0,2,0,1,0,0], maj7: [0,2,1,1,0,0], m7: [0,2,0,0,0,0],
  "9": [0,2,0,1,0,2], add9: [0,2,2,1,0,2], sus4: [0,2,2,2,0,0], m7b5: [0,1,0,0,3,null],
};
const A_SHAPES = {
  maj: [null,0,2,2,2,0], min: [null,0,2,2,1,0], "5": [null,0,2,2,null,null], "6": [null,0,2,2,2,2],
  m6: [null,0,2,2,1,2], "7": [null,0,2,0,2,0], maj7: [null,0,2,1,2,0], m7: [null,0,2,0,1,0],
  sus2: [null,0,2,2,0,0], sus4: [null,0,2,2,3,0], dim: [null,0,1,2,1,null], dim7: [null,0,1,2,1,2],
  m7b5: [null,0,1,0,1,null], aug: [null,0,3,2,2,1],
};
const N = null;
// Open-position shapes with hand-picked fingering.
const OPEN = {
  "C|maj": [[N,3,2,0,1,0],[0,3,2,0,1,0]], "G|maj": [[3,2,0,0,0,3],[3,2,0,0,0,4]],
  "D|maj": [[N,N,0,2,3,2],[0,0,0,1,3,2]], "A|maj": [[N,0,2,2,2,0],[0,0,1,2,3,0]],
  "E|maj": [[0,2,2,1,0,0],[0,2,3,1,0,0]], "A|min": [[N,0,2,2,1,0],[0,0,2,3,1,0]],
  "E|min": [[0,2,2,0,0,0],[0,2,3,0,0,0]], "D|min": [[N,N,0,2,3,1],[0,0,0,2,3,1]],
  "A|7": [[N,0,2,0,2,0],[0,0,2,0,3,0]], "B|7": [[N,2,1,2,0,2],[0,2,1,3,0,4]],
  "C|7": [[N,3,2,3,1,0],[0,3,2,4,1,0]], "D|7": [[N,N,0,2,1,2],[0,0,0,2,1,3]],
  "E|7": [[0,2,0,1,0,0],[0,2,0,1,0,0]], "G|7": [[3,2,0,0,0,1],[3,2,0,0,0,1]],
  "C|maj7": [[N,3,2,0,0,0],[0,3,2,0,0,0]], "D|maj7": [[N,N,0,2,2,2],[0,0,0,1,2,3]],
  "A|maj7": [[N,0,2,1,2,0],[0,0,2,1,3,0]], "G|maj7": [[3,2,0,0,0,2],[3,2,0,0,0,1]],
  "F|maj7": [[N,N,3,2,1,0],[0,0,3,2,1,0]], "A|m7": [[N,0,2,0,1,0],[0,0,2,0,1,0]],
  "E|m7": [[0,2,0,0,0,0],[0,2,0,0,0,0]], "D|m7": [[N,N,0,2,1,1],[0,0,0,2,1,1]],
  "A|sus2": [[N,0,2,2,0,0],[0,0,1,2,0,0]], "A|sus4": [[N,0,2,2,3,0],[0,0,1,2,4,0]],
  "D|sus2": [[N,N,0,2,3,0],[0,0,0,1,3,0]], "D|sus4": [[N,N,0,2,3,3],[0,0,0,1,2,3]],
  "E|sus4": [[0,2,2,2,0,0],[0,2,3,4,0,0]], "C|add9": [[N,3,2,0,3,0],[0,3,2,0,4,0]],
  "E|9": [[0,2,0,1,0,2],[0,2,0,1,0,3]], "E|m6": [[0,2,2,0,2,0],[0,2,3,0,4,0]],
};
const EASY_F = { frets: [N,N,3,2,1,1], fingers: [0,0,3,2,1,1], barre: { from: 4, to: 5, fret: 1 }, base: 1, label: "Easy version" };

function movable(shape, fret, label) {
  const frets = shape.map(r => r === null ? null : r + fret);
  const rel0 = shape.map((r, i) => r === 0 ? i : -1).filter(i => i >= 0);
  const fingers = Array(6).fill(0);
  let barre = null;
  const others = shape.map((r, i) => ({ r, i })).filter(x => x.r > 0).sort((a, b) => a.r - b.r || a.i - b.i);
  let n = 1;
  if (fret > 0) {
    if (rel0.length >= 2) { barre = { from: Math.min(...rel0), to: Math.max(...rel0), fret }; rel0.forEach(i => fingers[i] = 1); }
    else if (rel0.length === 1) fingers[rel0[0]] = 1;
    n = 2;
  }
  others.forEach(x => { fingers[x.i] = Math.min(n++, 4); });
  return { frets, fingers, barre, base: fret > 0 ? fret : 1, label };
}
function chordName(root, typeId) { return root + TYPE[typeId].sym; }
function chordNotes(root, typeId) { return TYPE[typeId].f.map(l => ({ label: l, name: spell(root, l), pc: (pcOf(root) + parseLabel(l).semis) % 12 })); }

function chordVoicings(root, typeId) {
  const out = [], seen = new Set(), pc = pcOf(root);
  const add = v => { const k = v.frets.join(","); if (!seen.has(k)) { seen.add(k); out.push(v); } };
  const o = OPEN[root + "|" + typeId];
  if (o) add({ frets: o[0], fingers: o[1], barre: null, base: 1, label: "Open" });
  if (root === "F" && typeId === "maj") add(EASY_F);
  const cands = [];
  if (E_SHAPES[typeId]) cands.push(movable(E_SHAPES[typeId], (pc - 4 + 12) % 12, "E shape"));
  if (A_SHAPES[typeId]) cands.push(movable(A_SHAPES[typeId], (pc - 9 + 12) % 12, "A shape"));
  cands.sort((a, b) => a.base - b.base).forEach(v => {
    if (v.base === 1 && !v.barre && v.frets.every(f => f === null || f <= 4) && v.frets.some(f => f === 0)) v.label = "Open";
    else v.label = (v.barre ? "Barre" : "Movable") + ", " + v.label + ", fret " + (v.base);
    add(v);
  });
  return out;
}

// ---- Scales ----
const SCALES = [
  { group: "Major and its modes", id: "major", name: "Major (Ionian)", f: ["1","2","3","4","5","6","7"] },
  { group: "Major and its modes", id: "dorian", name: "Dorian", f: ["1","2","b3","4","5","6","b7"] },
  { group: "Major and its modes", id: "phrygian", name: "Phrygian", f: ["1","b2","b3","4","5","b6","b7"] },
  { group: "Major and its modes", id: "lydian", name: "Lydian", f: ["1","2","3","#4","5","6","7"] },
  { group: "Major and its modes", id: "mixolydian", name: "Mixolydian", f: ["1","2","3","4","5","6","b7"] },
  { group: "Major and its modes", id: "minor", name: "Natural minor (Aeolian)", f: ["1","2","b3","4","5","b6","b7"] },
  { group: "Major and its modes", id: "locrian", name: "Locrian", f: ["1","b2","b3","4","b5","b6","b7"] },
  { group: "Pentatonic and blues", id: "majpent", name: "Major pentatonic", f: ["1","2","3","5","6"] },
  { group: "Pentatonic and blues", id: "minpent", name: "Minor pentatonic", f: ["1","b3","4","5","b7"] },
  { group: "Pentatonic and blues", id: "blues", name: "Minor blues", f: ["1","b3","4","b5","5","b7"] },
  { group: "Pentatonic and blues", id: "majblues", name: "Major blues", f: ["1","2","b3","3","5","6"] },
  { group: "Minor variations", id: "harmonic", name: "Harmonic minor", f: ["1","2","b3","4","5","b6","7"] },
  { group: "Minor variations", id: "melodic", name: "Melodic minor", f: ["1","2","b3","4","5","6","7"] },
  { group: "Egyptian and Middle Eastern", id: "egyptian", name: "Egyptian (suspended pentatonic)", f: ["1","2","4","5","b7"] },
  { group: "Egyptian and Middle Eastern", id: "hijaz", name: "Hijaz (Phrygian dominant)", f: ["1","b2","3","4","5","b6","b7"] },
  { group: "Egyptian and Middle Eastern", id: "doubleharm", name: "Double harmonic (Hijaz Kar)", f: ["1","b2","3","4","5","b6","7"] },
  { group: "Egyptian and Middle Eastern", id: "nikriz", name: "Nikriz", f: ["1","2","b3","#4","5","6","b7"] },
  { group: "Egyptian and Middle Eastern", id: "hungarian", name: "Hungarian minor", f: ["1","2","b3","#4","5","b6","7"] },
  { group: "Egyptian and Middle Eastern", id: "persian", name: "Persian", f: ["1","b2","3","4","b5","b6","7"] },
  { group: "Japanese", id: "hirajoshi", name: "Hirajoshi", f: ["1","2","b3","5","b6"] },
  { group: "Japanese", id: "insen", name: "In Sen", f: ["1","b2","4","5","b7"] },
  { group: "Japanese", id: "iwato", name: "Iwato", f: ["1","b2","4","b5","b7"] },
  { group: "Symmetrical", id: "wholetone", name: "Whole tone", f: ["1","2","3","#4","#5","b7"] },
  { group: "Symmetrical", id: "dimwh", name: "Diminished (whole-half)", f: ["1","2","b3","4","b5","b6","6","7"] },
  { group: "Symmetrical", id: "dimhw", name: "Diminished (half-whole)", f: ["1","b2","b3","3","#4","5","6","b7"] },
];
const SCALE = Object.fromEntries(SCALES.map(s => [s.id, s]));
const SCALE_NOTES = {
  egyptian: "Western guitar books call this the Egyptian scale. It has five notes and no half steps, so it sounds open and a bit unresolved.",
  hijaz: "The scale most people mean by an Arabic or Middle Eastern sound. The step from the 2nd note to the 3rd is the big, exotic one. Also called Phrygian dominant, and it is the 5th mode of harmonic minor.",
  doubleharm: "Two of these big gaps. Known as Hijaz Kar in Arabic music and the Byzantine scale in Greek music.",
  nikriz: "Dorian with a raised 4th. Used in Arabic and Turkish music and in some Eastern European folk music.",
  hungarian: "Harmonic minor with a raised 4th.",
  persian: "A dark, tense scale with a flat 2nd and flat 5th.",
  hirajoshi: "A Japanese five-note scale with a sad, still sound.",
  insen: "Japanese five-note scale. Often used for a bare, traditional feel.",
  iwato: "Japanese five-note scale. Very tense because of the flat 5th.",
  blues: "Minor pentatonic plus the flat 5th, the 'blue note'.",
  minpent: "The first scale most guitarists learn for solos.",
  majpent: "Bright and friendly. Used all over country, folk and pop.",
};
function scaleNotes(root, id) {
  return SCALE[id].f.map(l => ({ label: l, name: spell(root, l), pc: (pcOf(root) + parseLabel(l).semis) % 12 }));
}

// ---- Keys ----
const NUMERALS = ["I","II","III","IV","V","VI","VII"];
function keyChords(root, mode) {
  const notes = scaleNotes(root, mode === "major" ? "major" : "minor");
  return notes.map((n, i) => {
    const t = [notes[i], notes[(i + 2) % 7], notes[(i + 4) % 7], notes[(i + 6) % 7]].map(x => x.pc);
    const d = (a, b) => (t[b] - t[a] + 12) % 12;
    let tri = "maj"; if (d(0,1) === 3 && d(0,2) === 7) tri = "min"; else if (d(0,1) === 3 && d(0,2) === 6) tri = "dim"; else if (d(0,1) === 4 && d(0,2) === 8) tri = "aug";
    const sev = d(0,3);
    let seventh = tri === "maj" ? (sev === 11 ? "maj7" : "7") : tri === "min" ? "m7" : (sev === 10 ? "m7b5" : "dim7");
    const rn = tri === "maj" ? NUMERALS[i] : tri === "min" ? NUMERALS[i].toLowerCase() : NUMERALS[i].toLowerCase() + "°";
    return { root: n.name, tri, seventh, numeral: rn, degree: i + 1 };
  });
}
const PROGRESSIONS = [
  { name: "Pop: I V vi IV", mode: "major", steps: [1,5,6,4], note: "Hundreds of pop songs use this loop." },
  { name: "Folk: I IV V", mode: "major", steps: [1,4,5], note: "Three chords that cover a huge amount of folk and country." },
  { name: "Doo-wop: I vi IV V", mode: "major", steps: [1,6,4,5], note: "The 50s loop." },
  { name: "Jazz: ii V I", mode: "major", steps: [2,5,1], note: "Best played with 7th chords.", sevenths: true },
  { name: "Sad pop: vi IV I V", mode: "major", steps: [6,4,1,5], note: "Same chords as the pop loop, starting on the minor." },
  { name: "Minor: i VII VI VII", mode: "minor", steps: [1,7,6,7], note: "Rock and epic-sounding minor loop." },
  { name: "Minor: i iv v", mode: "minor", steps: [1,4,5], note: "The minor-key version of I IV V." },
  { name: "Andalusian: i VII VI V", mode: "minor", steps: [1,7,6,5], note: "Flamenco-style descent." },
  { name: "12-bar blues", mode: "major", steps: [1,1,1,1,4,4,1,1,5,4,1,5], note: "One chord per bar. Play them as 7th chords for a bluesy sound.", sevenths: true },
];

// ---- Tunings ----
const STD_FREQ = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];
const STD_PC = [4,9,2,7,11,4];
const TUNINGS = [
  { id: "std",   name: "Standard (E A D G B E)",    pcs: [4,9,2,7,11,4],  names: ["E","A","D","G","B","e"] },
  { id: "dropd", name: "Drop D (D A D G B E)",      pcs: [2,9,2,7,11,4],  names: ["D","A","D","G","B","e"] },
  { id: "half",  name: "Half step down (Eb)",       pcs: [3,8,1,6,10,3],  names: ["Eb","Ab","Db","Gb","Bb","eb"] },
  { id: "dstd",  name: "Full step down (D standard)", pcs: [2,7,0,5,9,2], names: ["D","G","C","F","A","d"] },
  { id: "dadgad",name: "DADGAD",                    pcs: [2,9,2,7,9,2],   names: ["D","A","D","G","A","d"] },
  { id: "openg", name: "Open G (D G D G B D)",      pcs: [2,7,2,7,11,2],  names: ["D","G","D","G","B","d"] },
  { id: "opend", name: "Open D (D A D F# A D)",     pcs: [2,9,2,6,9,2],   names: ["D","A","D","F#","A","d"] },
  { id: "opene", name: "Open E (E B E G# B E)",     pcs: [4,11,4,8,11,4], names: ["E","B","E","G#","B","e"] },
  { id: "openc", name: "Open C (C G C G C E)",      pcs: [0,7,0,7,0,4],   names: ["C","G","C","G","C","e"] },
];
function openFreq(tuning) {
  return tuning.pcs.map((pc, i) => STD_FREQ[i] * Math.pow(2, (((pc - STD_PC[i] + 18) % 12) - 6) / 12));
}
const INTERVALS = [
  ["1","Root","0"],["b2","Minor 2nd","1"],["2","Major 2nd","2"],["b3","Minor 3rd","3"],["3","Major 3rd","4"],["4","Perfect 4th","5"],
  ["b5","Tritone","6"],["5","Perfect 5th","7"],["b6","Minor 6th","8"],["6","Major 6th","9"],["b7","Minor 7th","10"],["7","Major 7th","11"],
];

if (typeof module !== "undefined") module.exports = { pcOf, spell, CHORD_TYPES, TYPE, ROOTS, chordVoicings, chordNotes, scaleNotes, SCALES, keyChords, TUNINGS, openFreq, STD_PC };
