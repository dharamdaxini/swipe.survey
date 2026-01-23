/* ALCHEMIST V130.2 | MASTER ENGINE
   Environment: Acode / Mobile WebView Stable
   Logic: Socratic Chemistry Rigor
*/

let db, VAULT = [], POOL = [], MISTAKES = [], SCORE = 0, MODE = "INIT", INDEX = 1, SEL_PATH = "", SEL_CORE = "";
const STORE_NAME = "Vaults";

// 1. ATOMIC CHEMICAL FORMATTER
// Prioritizes Greek symbols, then high-rigor exponents, then molecular stoichiometry.
const format = (t) => {
    if (!t) return "";
    return t.toString()
        .replace(/&Delta;|Delta/g, 'Δ') 
        .replace(/&lambda;|lambda/g, 'λ')
        .replace(/&nu;|nu/g, 'ν')
        .replace(/&sigma;|sigma/g, 'σ')
        .replace(/&kappa;|kappa/g, 'κ')
        .replace(/<=>/g, '⇌')
        .replace(/->/g, '→')
        .replace(/\^‡/g, '<sup>‡</sup>') 
        .replace(/\^o/g, '°') 
        .replace(/\^([-+]?\d+|\d+[-+]?)/g, '<sup>$1</sup>') 
        .replace(/_(\d+)/g, '<sub>$1</sub>')    
        .replace(/_([a-z]+)/g, '<sub>$1</sub>') 
        .replace(/\n/g, '<br>');
};

// 2. INDEXED_DB INITIALIZATION
const request = indexedDB.open("AlchemistDB", 1);
request.onupgradeneeded = e => { e.target.result.createObjectStore(STORE_NAME); };
request.onsuccess = e => { db = e.target.result; refreshLibrary(); };

function refreshLibrary() {
    const store = db.transaction([STORE_NAME], "readonly").objectStore(STORE_NAME);
    const container = document.getElementById('library'); 
    container.innerHTML = "";
    store.openCursor().onsuccess = e => {
        const cursor = e.target.result;
        if (cursor) {
            const div = document.createElement('div'); 
            div.className = "topic-tile";
            div.onclick = () => loadDataset(cursor.key);
            div.innerHTML = `<span class="topic-name">${cursor.key}</span><span style="font-size:10px;color:#555">${cursor.value.length} UNITS</span>`;
            container.appendChild(div); 
            cursor.continue();
        }
    };
}

// 3. RESILIENT DATA IMPORT
async function importDataset() { 
    const input = document.getElementById('data-input');
    const btn = document.getElementById('import-btn');
    const raw = input.value.trim(); 
    if (!raw) return;
    
    btn.disabled = true;
    btn.innerText = "CHUNKING...";
    
    const lines = raw.split(/\n/); 
    let parsed = []; 
    
    for (let line of lines) { 
        let c = line.split(/\t/); 
        if (c.length < 5) c = line.split(/\s{3,}/); // Fallback for 3+ spaces
        
        if (c.length >= 9 && c[0].toLowerCase() !== "id") {
            parsed.push({ 
                id: c[0].trim(), set: c[1].trim(), dom: c[2].trim(), dep: c[3].trim(), 
                q: c[4].trim(), u: c[5].trim(), r: c[6].trim(), l: c[7].trim(), 
                ans: c[8].trim().toUpperCase(), 
                expl: c[9] ? c[9].trim() : "---", 
                hint: c[10] ? c[10].trim() : "---", 
                context: c[11] ? c[11].trim() : "---" 
            }); 
        }
    } 

    if (parsed.length > 0) {
        const tx = db.transaction([STORE_NAME], "readwrite");
        tx.objectStore(STORE_NAME).put(parsed, parsed[0].set);
        tx.oncomplete = () => location.reload();
    } else {
        alert("FORMAT ERROR: Ensure dataset has 12 columns.");
        btn.disabled = false;
        btn.innerText = "REGISTER TO VAULT";
    }
}

// 4. CORE ENGINE LOGIC
function loadDataset(name) { 
    db.transaction([STORE_NAME], "readonly").objectStore(STORE_NAME).get(name).onsuccess = e => { 
        VAULT = e.target.result; 
        document.getElementById('portal').style.display = 'none'; 
        document.getElementById('header').style.display = 'flex'; 
        document.getElementById('stack').style.display = 'flex'; 
        renderS0(); 
    }; 
}

function renderS0() { renderSlide("SELECT MODE", "TEST (STRICT)", "LEARN (BRIDGE)", "QUIZ + LEARN", "QUIZ (DRILL)", "S_PATH"); }
function renderS1() { renderSlide("MAINLINE CORE", "CHANGE", "MATTER", "ENERGY", "ANALYSIS", "S_CORE"); }

function start() { 
    INDEX = 1; SCORE = 0; 
    POOL = VAULT.filter(v => v.dom.toUpperCase() === SEL_CORE).sort(() => 0.5 - Math.random()).slice(0, 20); 
    if(!POOL.length) POOL = VAULT.slice(0, 20); 
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
    const q = { ...POOL[0] }; 
    const c = document.createElement('div'); c.className = "card"; 
    let lbl = (SEL_PATH === "LEFT" || SEL_PATH === "RIGHT") ? "⬇ DEEP DIVE" : "⬇ HINT"; 

    c.innerHTML = `<div class="card-q">${format(q.q)}</div><div class="swipe-label sl-up">${format(q.u)}</div><div class="swipe-label sl-left">${format(q.l)}</div><div class="swipe-label sl-right">${format(q.r)}</div><div class="swipe-label sl-down">${lbl}</div>`; 
    
    s.appendChild(c); bindPhysics(c, q); 
    updateHUD(); 
}

// 5. PHYSICS & ROUTING
function route(el, data, dir) {
    if (data.type === "S_PATH") { SEL_PATH = dir; renderS1(); return; }
    if (data.type === "S_CORE") { SEL_CORE = dir; start(); return; }
    
    if (dir === "DOWN") { 
        if (SEL_PATH === "UP") { resetCard(el); return; } // Test mode lockout
        openOverlay(data); resetCard(el); return; 
    }
    
    const mappedDir = (dir === "LEFT" ? "LEFT" : dir === "RIGHT" ? "RIGHT" : "UP");
    if (mappedDir === data.ans) SCORE += 10;
    POOL.shift(); INDEX++; renderNext();
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

// 6. MODAL & HUD
function resetCard(el) { el.style.transition = "0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"; el.style.transform = "none"; }
function openOverlay(d) { 
    document.getElementById('overlay-content').innerHTML = `<b>LOGIC</b><br>${format(d.expl)}<br><br><b>CONTEXT</b><br>${format(d.context)}`; 
    document.getElementById('global-overlay').classList.add('active'); 
}
function closeOverlay() { document.getElementById('global-overlay').classList.remove('active'); }

function updateHUD() { 
    document.getElementById('p-text').innerHTML = `${INDEX}/20 UNITS`; 
    document.getElementById('progress-bar').style.width = `${(INDEX/20)*100}%`; 
    document.getElementById('score-text').innerHTML = `${SCORE} XP`;
}

function renderEnd() { 
    document.getElementById('stack').innerHTML = "<div class='card'><div class='card-q'>MISSION COMPLETE</div><button class='btn btn-gold' onclick='location.reload()'>RESTART</button></div>"; 
}
function clearLibrary() { if(confirm("Purge Library?")) { db.transaction([STORE_NAME], "readwrite").objectStore(STORE_NAME).clear(); location.reload(); } }
