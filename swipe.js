/* ALCHEMIST v130.3 | NEURAL BACKEND | SHUFFLE ENGINE ACTIVE */

let db, VAULT = [], POOL = [], SCORE = 0, INDEX = 1;
const STORE_NAME = "Vaults";

/* =========================
   UTILS: ENTROPY & FORMAT
========================= */
const format = t => t ? String(t)
    .replace(/<=>/g,"⇌").replace(/->/g,"→")
    .replace(/\^([-+]?\d+)/g,"<sup>$1</sup>")
    .replace(/_(\d+)/g,"<sub>$1</sub>")
    .replace(/\n/g,"<br>") : "";

// Fisher-Yates Shuffle Algorithm
const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

/* =========================
   DATABASE INITIALIZATION
========================= */
const request = indexedDB.open("AlchemistDB", 1);
request.onupgradeneeded = e => e.target.result.createObjectStore(STORE_NAME);
request.onsuccess = e => { db = e.target.result; };

/* =========================
   DATA INGESTION ENGINE
========================= */
const CANONICAL_HEADER = [
  "id","set","domain","subdomain","difficulty","question",
  "opt_a","opt_b","opt_c","answer",
  "logic","hint","context"
];

function importDataset(){
    const raw = document.getElementById("data-input").value.trim();
    if(!raw){ alert("Input Empty"); return; }

    const lines = raw.split(/\n/).filter(Boolean);
    // Auto-detect header row
    const start = lines[0].toLowerCase().startsWith("id") ? 1 : 0;
    const parsed = [];

    for(let i=start; i<lines.length; i++){
        const cols = lines[i].split("\t");
        if(cols.length < 6) continue; // Skip malformed rows

        const row = {};
        CANONICAL_HEADER.forEach((h, idx) => {
            row[h] = (cols[idx] || "").trim();
        });
        parsed.push(row);
    }

    if(!parsed.length){ alert("Parse Failed: Check TSV Format"); return; }

    const setName = parsed[0].set || "DEFAULT_SET";
    
    // DB Transaction
    const tx = db.transaction([STORE_NAME], "readwrite");
    tx.objectStore(STORE_NAME).put(parsed, setName);
    tx.oncomplete = () => {
        VAULT = parsed;
        document.getElementById("data-input").value = 
        `STATUS: SYNCHRONIZED\nSET: ${setName}\nCOUNT: ${parsed.length}\nREADY.`;
    };
}

/* =========================
   SESSION CONTROL
========================= */
function startFromPortal(){
    if(!VAULT.length){ alert("Inject Data First"); return; }
    
    // UI Transition
    document.getElementById("portal").style.display = "none";
    document.getElementById("header").style.display = "block";
    document.getElementById("stack").style.display = "flex";
    
    startSession();
}

function startSession(){
    SCORE = 0; 
    INDEX = 1;
    // Deep copy and Shuffle for randomness
    POOL = shuffle([...VAULT]).slice(0, 20); 
    renderNext();
}

/* =========================
   RENDER ENGINE
========================= */
function renderNext(){
    const s = document.getElementById("stack");
    s.innerHTML = "";
    
    if(!POOL.length){ renderEnd(); return; }

    const q = POOL[0];
    const c = document.createElement("div");
    c.className = "card";

    // Dynamic HTML Injection
    c.innerHTML = `
    <div class="card-q">
        <div style="font-size:0.7em; letter-spacing:1px; margin-bottom:10px; opacity:0.7;">
            ${q.id} // ${q.domain.toUpperCase()}
        </div>
        ${format(q.question)}
        <br><br>
        <div style="font-size:0.85em; text-align:left; margin-top:20px; line-height:1.6;">
            A) ${format(q.opt_a)}<br>
            B) ${format(q.opt_b)}<br>
            C) ${format(q.opt_c)}
        </div>
    </div>

    <div class="swipe-label sl-up">${q.opt_c}</div>
    <div class="swipe-label sl-left">${q.opt_a}</div>
    <div class="swipe-label sl-right">${q.opt_b}</div>
    <div class="swipe-label sl-down">HINT</div>
    `;

    bindPhysics(c, q);
    s.appendChild(c);
    updateHUD();
}

/* =========================
   PHYSICS ENGINE (Touch/Mouse)
========================= */
function bindPhysics(el, data){
    let sx, sy, dx=0, dy=0, active=false, dir="";

    const start = (x, y) => {
        active = true; sx = x; sy = y;
        el.style.transition = "none";
    };

    const move = (x, y) => {
        if(!active) return;
        dx = x - sx;
        dy = y - sy;
        
        // Rotation and Translation Math
        const rot = dx * 0.05; 
        el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;

        // Label Opacity Logic
        const labels = el.querySelectorAll('.swipe-label');
        labels.forEach(l => l.style.opacity = 0);

        const ang = Math.atan2(-dy, dx) * 180 / Math.PI;
        
        if(dy > 50 && Math.abs(dx) < 50) { dir="DOWN"; el.querySelector('.sl-down').style.opacity = dy/150; }
        else if(dy < -50 && Math.abs(dx) < 50) { dir="UP"; el.querySelector('.sl-up').style.opacity = -dy/150; }
        else if(dx < -50) { dir="LEFT"; el.querySelector('.sl-left').style.opacity = -dx/150; }
        else if(dx > 50) { dir="RIGHT"; el.querySelector('.sl-right').style.opacity = dx/150; }
    };

    const end = () => {
        if(!active) return;
        active = false;
        // Threshold for commit
        if(Math.hypot(dx, dy) > 80) route(el, data, dir);
        else resetCard(el);
    };

    // Touch Events
    el.addEventListener("touchstart", e => start(e.touches[0].clientX, e.touches[0].clientY), {passive:true});
    el.addEventListener("touchmove", e => move(e.touches[0].clientX, e.touches[0].clientY), {passive:false});
    el.addEventListener("touchend", end);

    // Mouse Events (For Desktop Testing)
    el.addEventListener("mousedown", e => start(e.clientX, e.clientY));
    window.addEventListener("mousemove", e => move(e.clientX, e.clientY));
    window.addEventListener("mouseup", end);
}

function resetCard(el){
    el.style.transition = "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)";
    el.style.transform = "translate(0,0) rotate(0deg)";
    el.querySelectorAll('.swipe-label').forEach(l => l.style.opacity = 0);
}

/* =========================
   LOGIC KERNEL
========================= */
function route(el, data, dir){
    if(dir === "DOWN"){
        openOverlay(data);
        resetCard(el);
        return;
    }

    // Logic Resolution
    let chosen = "";
    if(dir === "LEFT") chosen = "OPT_A";
    else if(dir === "RIGHT") chosen = "OPT_B";
    else if(dir === "UP") chosen = "OPT_C";

    // Scoring
    const correctVal = data.answer.trim().toUpperCase(); // Expects 'OPT_A', 'OPT_B', etc.
    
    if(chosen === correctVal) {
        SCORE += 10;
        // Visual feedback could be added here
    }

    // Cycle Next
    POOL.shift();
    INDEX++;
    renderNext();
}

/* =========================
   UI COMPONENTS
========================= */
function openOverlay(d){
    const overlay = document.getElementById("global-overlay");
    document.getElementById("overlay-content").innerHTML = `
        <div style="text-align:left;">
            <b style="color:#ffd700; letter-spacing:1px;">LOGIC MATRIX</b><hr style="border-color:#333">
            ${format(d.logic)}
            <br><br>
            <b style="color:#3498db; letter-spacing:1px;">NEURAL HINT</b><hr style="border-color:#333">
            ${format(d.hint)}
        </div>
    `;
    overlay.classList.add("active");
}

function closeOverlay(){
    document.getElementById("global-overlay").classList.remove("active");
}

function updateHUD(){
    document.getElementById("p-text").innerText = `Q ${INDEX} / 20`;
    document.getElementById("score-text").innerText = `${SCORE} XP`;
    document.getElementById("progress-bar").style.width = `${(INDEX/20)*100}%`;
}

function renderEnd(){
    document.getElementById("stack").innerHTML = `
    <div class="card" style="text-align:center;">
        <div class="card-q">
            <h2 style="color:#ffd700">SESSION COMPLETE</h2>
            <br>
            FINAL SCORE<br>
            <span style="font-size:3em; font-weight:900;">${SCORE}</span>
            <br><br>
            <button onclick="startFromPortal()" style="background:#333; color:#fff; border:1px solid #555; padding:10px 20px; font-family:inherit;">RESTART PROTOCOL</button>
        </div>
    </div>`;
}
