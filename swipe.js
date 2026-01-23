/* ALCHEMIST V130.2 | ATOMIC JS ENGINE
   Rigor Level: Ph.D. Boundary
   Environment: Acode / Mobile WebView Stable
*/

let db, VAULT = [], POOL = [], MISTAKES = [], SCORE = 0, MODE = "INIT", INDEX = 1, SEL_PATH = "", SEL_CORE = "";
const STORE_NAME = "Vaults";

// 1. ATOMIC FORMATTER (The Fix for Chemical Notation)
const format = (t) => {
    if (!t) return "";
    return t.toString()
        // Greek & Core Symbols
        .replace(/&Delta;|Delta/g, 'Δ') 
        .replace(/&lambda;|lambda/g, 'λ')
        .replace(/&nu;|nu/g, 'ν')
        .replace(/&sigma;|sigma/g, 'σ')
        .replace(/&kappa;|kappa/g, 'κ')
        
        // Reactions & Flow
        .replace(/<=>/g, '⇌')
        .replace(/->/g, '→')
        
        // High-Rigor Exponents (‡, °, charges)
        .replace(/\^‡/g, '<sup>‡</sup>') 
        .replace(/\^o/g, '°') 
        .replace(/\^([-+]?\d+|\d+[-+]?)/g, '<sup>$1</sup>') 
        
        // Chemical Subscripts
        .replace(/_(\d+)/g, '<sub>$1</sub>')    
        .replace(/_([a-z]+)/g, '<sub>$1</sub>') 
        
        // Layout
        .replace(/\n/g, '<br>');
};

// 2. DATABASE SYSTEM
const request = indexedDB.open("AlchemistDB", 1);
request.onupgradeneeded = e => { e.target.result.createObjectStore(STORE_NAME); };
request.onsuccess = e => { db = e.target.result; refreshLibrary(); };

function refreshLibrary() {
    const store = db.transaction([STORE_NAME], "readonly").objectStore(STORE_NAME);
    const container = document.getElementById('library'); container.innerHTML = "";
    store.openCursor().onsuccess = e => {
        const cursor = e.target.result;
        if (cursor) {
            const div = document.createElement('div'); div.className = "topic-tile";
            div.onclick = () => loadDataset(cursor.key);
            // Use format() even here for consistent UI
            div.innerHTML = `<span class="topic-name">${format(cursor.key)}</span><span style="font-size:10px;color:#555">${cursor.value.length} CARDS</span>`;
            container.appendChild(div); cursor.continue();
        }
    };
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

// 3. UI STATE ENGINE
function renderS0() { MODE = "S_PATH"; renderSlide("SELECT MODE", "TEST (STRICT)", "LEARN (BRIDGE)", "QUIZ + LEARN", "QUIZ (DRILL)"); }
function renderS1() { MODE = "S_CORE"; renderSlide("MAINLINE CORE", "CHANGE", "ENERGY", "MATTER", "ANALYSIS"); }

function start() { 
    MODE = "ACTIVE"; INDEX = 1; SCORE = 0; 
    POOL = VAULT.filter(v => v.dom.toUpperCase() === SEL_CORE).sort(() => 0.5 - Math.random()).slice(0, 20); 
    if(!POOL.length) POOL = VAULT.slice(0,20); 
    renderNext(); 
}

function renderSlide(q, up, lt, rt, dn) { 
    const s = document.getElementById('stack'); s.innerHTML = ""; 
    const c = document.createElement('div'); c.className = "card"; 
    c.innerHTML = `<div class="card-q">${format(q)}</div><div class="swipe-label sl-up">${format(up)}</div><div class="swipe-label sl-left">${format(lt)}</div><div class="swipe-label sl-right">${format(rt)}</div><div class="swipe-label sl-down">${format(dn)}</div>`; 
    s.appendChild(c); bindPhysics(c, {}); 
}

function renderNext() { 
    const s = document.getElementById('stack'); s.innerHTML = ""; 
    if (!POOL.length) { renderEnd(); return; } 
    const q = { ...POOL[0] }; 
    const c = document.createElement('div'); c.className = "card"; 

    // Critical: Label logic for Learning vs Quiz
    let lbl = (SEL_PATH.includes("LEARN")) ? "⬇ DEEP DIVE" : "⬇ HINT"; 

    c.innerHTML = `<div class="card-q">${format(q.q)}</div><div class="swipe-label sl-up">${format(q.u)}</div><div class="swipe-label sl-left">${format(q.l)}</div><div class="swipe-label sl-right">${format(q.r)}</div><div class="swipe-label sl-down">${lbl}</div>`; 
    
    s.appendChild(c); bindPhysics(c, q); 
    updateHUD(); 
}

// 4. PHYSICS & NAVIGATION
function route(el, data, dir) {
    if (MODE === "S_PATH") { SEL_PATH = dir; renderS1(); }
    else if (MODE === "S_CORE") { SEL_CORE = dir; start(); }
    else {
        if (dir === "DOWN") { 
            if (SEL_PATH === "UP") { resetCard(el); return; } // Strict Mode Lock
            openOverlay(data); resetCard(el); return; 
        }
        POOL.shift(); INDEX++; renderNext();
    }
}

function bindPhysics(el, data) {
    let sx, sy, dx, dy, active = false, dir = null;
    el.addEventListener('touchstart', e => { 
        active = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY; el.style.transition = "none";
    }, {passive: false});

    el.addEventListener('touchmove', e => {
        if (!active) return; e.preventDefault();
        dx = e.touches[0].clientX - sx; dy = e.touches[0].clientY - sy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        el.style.transform = `translate3d(${dx*0.5}px, ${dy*0.5}px, 0) rotate(${dx/20}deg)`;
        
        el.querySelectorAll('.swipe-label').forEach(l => l.style.opacity = 0);
        if (dist > 30) {
            const angle = Math.atan2(-dy, dx) * 180 / Math.PI;
            if (angle > 45 && angle < 135) dir = "UP";
            else if (angle < -45 && angle > -135) dir = "DOWN";
            else if (angle > 135 || angle < -135) dir = "LEFT";
            else dir = "RIGHT";
            const label = el.querySelector(`.sl-${dir.toLowerCase()}`);
            if (label) label.style.opacity = 1;
        }
    }, {passive: false});

    el.addEventListener('touchend', () => {
        if (!active) return; active = false;
        if (Math.abs(dx) > 60 || Math.abs(dy) > 60) route(el, data, dir);
        else resetCard(el);
    });
}

// 5. MODAL & SYSTEM HELPERS
function resetCard(el) { el.style.transition = "0.3s ease"; el.style.transform = "none"; }

function openOverlay(d) { 
    // Human-style Socratic Context rendering
    document.getElementById('overlay-content').innerHTML = `
        <div style="color:var(--gold);font-weight:900;font-size:10px;margin-bottom:10px">LOGIC_CORE</div>
        ${format(d.expl)}<br><br>
        <div style="color:var(--blue);font-weight:900;font-size:10px;margin-bottom:10px">RESEARCH_CONTEXT</div>
        ${format(d.context)}
    `; 
    document.getElementById('global-overlay').classList.add('active'); 
}

function closeOverlay() { document.getElementById('global-overlay').classList.remove('active'); }

async function importDataset() { 
    const raw = document.getElementById('data-input').value.trim(); if (!raw) return; 
    const lines = raw.split(/\n/); let parsed = []; 
    for (let line of lines) { 
        let c = line.split(/\t/); 
        if (c.length >= 9 && c[0].toLowerCase() !== "id") {
            parsed.push({ 
                id: c[0], set: c[1], dom: c[2], dep: c[3], q: c[4], 
                u: c[5], r: c[6], l: c[7], ans: c[8], 
                expl: c[9], hint: c[10], context: c[11] 
            }); 
        }
    } 
    db.transaction([STORE_NAME], "readwrite").objectStore(STORE_NAME).put(parsed, parsed[0].set).onsuccess = () => location.reload();
}

function updateHUD() { 
    document.getElementById('p-text').innerHTML = `${INDEX}/20`; 
    document.getElementById('progress-bar').style.width = `${(INDEX/20)*100}%`; 
}

function renderEnd() { 
    document.getElementById('stack').innerHTML = `<div class='card'><div class='card-q'>CALIBRATION COMPLETE</div><div class='swipe-label sl-up'>RESTART</div></div>`; 
    bindPhysics(document.querySelector('.card'), {}); MODE="END"; 
}
