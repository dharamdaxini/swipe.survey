/* ALCHEMIST V130.2 | MASTER SYNC
   Rigor: Ph.D. Boundary
   Auth: Source-Locked Default Vault
*/

let db, VAULT = [], POOL = [], SCORE = 0, INDEX = 1, SEL_PATH = "", SEL_CORE = "";
const STORE_NAME = "Vaults";

// 1. PERMANENT DEFAULT DATA (Hardcoded Core)
const DEFAULT_VAULT_DATA = [
    { id: "DEF_001", set: "CORE_VAULT", dom: "ENERGY", dep: "Kinetics", q: "Why does the rate of electron transfer (k_et) paradoxically decrease in the Marcus Inverted Region?", u: "Barrier Height Increases", r: "Electronic Coupling Drops", l: "Solvent Friction Limit", ans: "UP", expl: "You likely assumed more exothermicity always equals speed; but once -DeltaG^o exceeds lambda; the parabolas intersect 'uphill'.", hint: "The potential surfaces cross at a higher point.", context: "In the inverted region; the product state sink is so deep that the intersection with the reactant curve moves back towards the reactant's higher energy coordinates." },
    { id: "DEF_002", set: "CORE_VAULT", dom: "MATTER", dep: "Structure", q: "Why is the 'Gomberg Dimer' a quinoid instead of the sterically intuitive hexaphenylethane?", u: "Para-Attack Geometry", r: "Aromaticity Shielding", l: "Delta_Bond Overlap", ans: "UP", expl: "You likely saw Ph_3C on paper and drew a simple C-C bond; but six phenyl rings cannot physically fit in that space.", hint: "Steric clash is the ultimate dealbreaker.", context: "Steric repulsion forces the dimerization to occur at the para-position of one phenyl ring; sacrificing local aromaticity to avoid Van der Waals overlap." },
    { id: "DEF_003", set: "CORE_VAULT", dom: "CHANGE", dep: "Selectivity", q: "In a system of fast interconverting conformers A <=> B; what dictates the product ratio P_A/P_B?", u: "DeltaDeltaG^‡ of Transition States", r: "Ground State Ratio [A]/[B]", l: "Interconversion Speed", ans: "UP", expl: "You likely followed ground-state populations; but the Curtin-Hammett principle proves that transition state height alone dictates the ratio.", hint: "The TS^‡ is the only gatekeeper.", context: "DeltaDeltaG^‡ determines the relative rates of product formation; rendering the initial equilibrium population ([A]/[B]) irrelevant to final selectivity." },
    { id: "DEF_004", set: "CORE_VAULT", dom: "ENERGY", dep: "Thermo", q: "Why is the Zero-Point Energy (ZPE) of a C-D bond lower than that of a C-H bond?", u: "Higher Reduced Mass", r: "Shorter Bond Length", l: "Electronegativity Pull", ans: "UP", expl: "You might think D is 'stronger'; but ZPE is purely a quantum vibrational floor (1/2 hnu); and higher mass lowers the frequency.", hint: "The vibrational 'floor' is mass-dependent.", context: "Heavier isotopes sit deeper in the potential well. This depth increases the DeltaG^‡ required for cleavage; driving the Primary Kinetic Isotope Effect." },
    { id: "DEF_005", set: "CORE_VAULT", dom: "ANALYSIS", dep: "AAS", q: "Why is a Hollow Cathode Lamp (HCL) required for Atomic Absorption instead of a broad-spectrum lamp?", u: "Narrow Line Width", r: "Total Photon Flux", l: "Ionization Efficiency", ans: "UP", expl: "You likely thought a bright white light would work; but atomic absorption lines are so narrow they require an element-specific source.", hint: "The source must match the analyte.", context: "The HCL provides emission lines with the exact nu required to excite ground-state atoms in the flame; maximizing sensitivity and selectivity." }
];

// 2. ATOMIC FORMATTER
const format = (t) => {
    if (!t) return "";
    return t.toString()
        .replace(/&Delta;|Delta/g, 'Δ').replace(/&lambda;|lambda/g, 'λ').replace(/&nu;|nu/g, 'ν')
        .replace(/&sigma;|sigma/g, 'σ').replace(/&kappa;|kappa/g, 'κ')
        .replace(/<=>/g, '⇌').replace(/->/g, '→')
        .replace(/\^‡/g, '<sup>‡</sup>').replace(/\^o/g, '°')
        .replace(/\^([-+]?\d+|\d+[-+]?)/g, '<sup>$1</sup>')
        .replace(/_(\d+)/g, '<sub>$1</sub>').replace(/_([a-z]+)/g, '<sub>$1</sub>')
        .replace(/\n/g, '<br>');
};

// 3. PROTECTED DATABASE LOGIC
const request = indexedDB.open("AlchemistDB", 1);
request.onupgradeneeded = e => { e.target.result.createObjectStore(STORE_NAME); };
request.onsuccess = e => { db = e.target.result; checkAndSeed(); };

function checkAndSeed() {
    const store = db.transaction([STORE_NAME], "readonly").objectStore(STORE_NAME);
    const check = store.get("CORE_VAULT");
    check.onsuccess = () => {
        if (!check.result) {
            const tx = db.transaction([STORE_NAME], "readwrite");
            tx.objectStore(STORE_NAME).put(DEFAULT_VAULT_DATA, "CORE_VAULT");
            tx.oncomplete = () => refreshLibrary();
        } else refreshLibrary();
    };
}

function refreshLibrary() {
    const store = db.transaction([STORE_NAME], "readonly").objectStore(STORE_NAME);
    const container = document.getElementById('library'); container.innerHTML = "";
    store.openCursor().onsuccess = e => {
        const cursor = e.target.result;
        if (cursor) {
            const div = document.createElement('div'); div.className = "topic-tile";
            div.onclick = () => loadDataset(cursor.key);
            div.innerHTML = `<span class="topic-name">${cursor.key}</span>`;
            container.appendChild(div); cursor.continue();
        }
    };
}

// 4. IMPORT & LOAD
async function importDataset() {
    const input = document.getElementById('data-input');
    const raw = input.value.trim(); if (!raw) return;
    const lines = raw.split(/\n/); let parsed = [];
    for (let line of lines) {
        let c = line.split(/\t/); 
        if (c.length < 5) c = line.split(/\s{3,}/);
        if (c.length >= 9 && c[0].toLowerCase() !== "id") {
            parsed.push({ id: c[0], set: c[1], dom: c[2], dep: c[3], q: c[4], u: c[5], r: c[6], l: c[7], ans: c[8].toUpperCase(), expl: c[9]||"", hint: c[10]||"", context: c[11]||"" });
        }
    }
    if (parsed.length) {
        const tx = db.transaction([STORE_NAME], "readwrite");
        tx.objectStore(STORE_NAME).put(parsed, parsed[0].set);
        tx.oncomplete = () => location.reload();
    } else alert("DATA ERROR: Check column spacing.");
}

function loadDataset(name) {
    db.transaction([STORE_NAME], "readonly").objectStore(STORE_NAME).get(name).onsuccess = e => {
        VAULT = e.target.result;
        document.getElementById('portal').style.display = 'none';
        document.getElementById('header').style.display = 'flex';
        document.getElementById('stack').style.display = 'flex';
        renderS0();
    };
}

// 5. SELECTION & SESSION
function renderS0() { renderSlide("SELECT MODE", "TEST (STRICT)", "LEARN (BRIDGE)", "QUIZ + LEARN", "QUIZ (DRILL)", "S_PATH"); }
function renderS1() { renderSlide("MAINLINE CORE", "CHANGE", "MATTER", "ENERGY", "ANALYSIS", "S_CORE"); }

function start() {
    INDEX = 1; SCORE = 0;
    POOL = VAULT.filter(v => v.dom.toUpperCase() === SEL_CORE).sort(() => 0.5 - Math.random()).slice(0, 20);
    if (!POOL.length) POOL = VAULT.slice(0, 20);
    renderNext();
}

function renderSlide(q, up, lt, rt, dn, type) {
    const s = document.getElementById('stack'); s.innerHTML = "";
    const c = document.createElement('div'); c.className = "card";
    c.innerHTML = `<div class="card-q">${q}</div><div class="swipe-label sl-up">${up}</div><div class="swipe-label sl-left">${lt}</div><div class="swipe-label sl-right">${rt}</div><div class="swipe-label sl-down">${dn}</div>`;
    bindPhysics(c, {type: type});
}

function renderNext() {
    const s = document.getElementById('stack'); s.innerHTML = "";
    if (!POOL.length) { renderEnd(); return; }
    const q = POOL[0];
    const c = document.createElement('div'); c.className = "card";
    let lbl = (SEL_PATH === "LEFT" || SEL_PATH === "RIGHT") ? "⬇ DEEP DIVE" : "⬇ HINT";
    c.innerHTML = `<div class="card-q">${format(q.q)}</div><div class="swipe-label sl-up">${format(q.u)}</div><div class="swipe-label sl-left">${format(q.l)}</div><div class="swipe-label sl-right">${format(q.r)}</div><div class="swipe-label sl-down">${lbl}</div>`;
    bindPhysics(c, q);
    updateHUD();
}

// 6. PHYSICS & ROUTING
function route(el, data, dir) {
    if (data.type === "S_PATH") { SEL_PATH = dir; renderS1(); return; }
    if (data.type === "S_CORE") { SEL_CORE = dir; start(); return; }
    if (dir === "DOWN") { if (SEL_PATH === "UP") { resetCard(el); return; } openOverlay(data); resetCard(el); } 
    else {
        const mappedDir = (dir === "LEFT" ? "LEFT" : dir === "RIGHT" ? "RIGHT" : "UP");
        if (mappedDir === data.ans) SCORE += 10;
        POOL.shift(); INDEX++; renderNext();
    }
}

function bindPhysics(el, data) {
    let sx, sy, dx = 0, dy = 0, active = false, dir = "";
    el.addEventListener('touchstart', e => { active = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY; el.style.transition = "none"; }, {passive: false});
    el.addEventListener('touchmove', e => {
        if (!active) return; e.preventDefault();
        dx = e.touches[0].clientX - sx; dy = e.touches[0].clientY - sy;
        el.style.transform = `translate3d(${dx*0.5}px, ${dy*0.5}px, 0) rotate(${dx/20}deg)`;
        el.querySelectorAll('.swipe-label').forEach(l => l.style.opacity = 0);
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 30) {
            const ang = Math.atan2(-dy, dx) * 180 / Math.PI;
            dir = (ang > 45 && ang < 135) ? "UP" : (ang < -45 && ang > -135) ? "DOWN" : (ang > 135 || ang < -135) ? "LEFT" : "RIGHT";
            const l = el.querySelector(`.sl-${dir.toLowerCase()}`); if (l) l.style.opacity = 1;
        }
    }, {passive: false});
    el.addEventListener('touchend', () => {
        if (!active) return; active = false;
        if (Math.abs(dx) > 60 || Math.abs(dy) > 60) route(el, data, dir);
        else resetCard(el);
    });
}

function resetCard(el) { el.style.transition = "0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"; el.style.transform = "none"; }
function openOverlay(d) { document.getElementById('overlay-content').innerHTML = `<b>LOGIC</b><br>${format(d.expl)}<br><br><b>CONTEXT</b><br>${format(d.context)}`; document.getElementById('global-overlay').classList.add('active'); }
function closeOverlay() { document.getElementById('global-overlay').classList.remove('active'); }
function updateHUD() { document.getElementById('p-text').innerHTML = `${INDEX}/20 UNITS`; document.getElementById('progress-bar').style.width = `${(INDEX/20)*100}%`; document.getElementById('score-text').innerHTML = `${SCORE} XP`; }
function renderEnd() { document.getElementById('stack').innerHTML = "<div class='card'><div class='card-q'>COMPLETE</div><button class='btn btn-gold' onclick='location.reload()'>RESTART</button></div>"; }
function clearLibrary() { if(confirm("Purge Library?")) { db.transaction([STORE_NAME], "readwrite").objectStore(STORE_NAME).clear(); location.reload(); } }
