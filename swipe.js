/* --- CONFIGURATION --- */
const ENDPOINT = "https://script.google.com/macros/s/AKfycbwv_n-Q0J0hwRPIzy2D0mx54-fKNDmvKG0kPgZZwoN5xZGloJbAFP-upgMbGfJA-Lk/exec";
const NEXT_LEVEL = { "SET_A": "SET_B", "SET_B": "SET_C", "SET_C": "SET_D", "SET_D": "SET_A" };

/* --- DATA REPOSITORY --- */
const RAW_DATA = [
    // ... PASTE YOUR FULL 200 QUESTION JSON HERE ...
    {"id": "SET_A_0001", "ds": "SET_A", "tp": "Kinetics", "ty": "MATH", "q": "In a second-order reaction rate = k[A]², why is the half-life t₁/₂ dependent on initial concentration?", "u": "Rate decreases too slowly", "r": "Derivative depends on [A]²", "l": "Integral diverges", "c": "RIGHT", "ex": "✅ Integrating 1/[A]² yields t = 1/(k[A]₀).", "h": "Integration of power rule."},
    // (Add the rest of your data rows)
];

let POOL = [], MISTAKES = [], SCORE = 0, isTransitioning = false, startTime = 0;
let MODE = "DATASET_SELECT", CUR_DATASET = "", CUR_TOPIC = "", CUR_GENRE = "";

// Helper: Formats chemical formulas (subscripts/superscripts)
const formatChem = t => t ? t.toString().replace(/([A-Z][a-z]?)(\d+)/g,'$1<sub>$2</sub>').replace(/(\d*)([+\-])/g, '<sup>$1$2</sup>').replace(/\|\|/g, '<br><br>') : "";

function init() { 
    setTimeout(() => { document.getElementById('loader').remove(); renderDatasetSelect(); }, 800); 
    
    // --- V81.0 AUTO-SYNC RECOVERY ---
    try {
        const pending = JSON.parse(localStorage.getItem('pendingUploads') || "[]");
        if(pending.length > 0 && navigator.onLine) {
            console.log(`Syncing ${pending.length} offline sessions...`);
            pending.forEach(p => {
                new Image().src = `${ENDPOINT}?target=${p.target}&questionId=${p.questionId}&result=${p.result}&vectorChoice=${p.vectorChoice}&latency=${p.latency}`;
            });
            localStorage.removeItem('pendingUploads');
        }
    } catch(e) { console.log("Storage restricted"); }
}

/* --- MENU RENDERERS --- */
function renderDatasetSelect() { 
    MODE = "DATASET_SELECT"; 
    renderMenuCard("SELECT DIFFICULTY", "CORE FUNDAMENTALS", "INDUSTRIAL APPS", "ADVANCED THEORY", "EXPERT CHALLENGE"); 
}

function renderTopicSelect(ds) { 
    MODE = "TOPIC_SELECT"; CUR_DATASET = ds; 
    renderMenuCard("CHOOSE DOMAIN", "PHYSICAL", "ORGANIC", "INORGANIC", "ANALYTICAL"); 
}

function renderGenreSelect(tp) { 
    MODE = "GENRE_SELECT"; CUR_TOPIC = tp; 
    renderMenuCard("SELECT DEPTH", "CONCEPT MASTERY", "CALCULATION", "DATA ANALYSIS", "APPLIED LOGIC"); 
}

function renderMenuCard(q, up, lt, rt, dn) {
    const s = document.getElementById('stack'); s.innerHTML = "";
    const c = document.createElement('div'); c.className = "card";
    c.innerHTML = `<div class="card-q">${q}</div>
        <div class="swipe-label sl-up">${up}</div><div class="swipe-label sl-left">${lt}</div>
        <div class="swipe-label sl-right">${rt}</div><div class="swipe-label sl-down">${dn}</div>`;
    s.appendChild(c); bindPhysics(c);
}

/* --- RUNTIME ENGINE --- */
function startQuiz(genre) {
    CUR_GENRE = genre;
    
    // FILTER: Topic Clustering & Genre Mapping
    POOL = RAW_DATA.filter(q => {
        const matchDS = q.ds === CUR_DATASET;
        const t = q.tp.toLowerCase();
        let matchTP = false;

        if (CUR_TOPIC === "Physical") {
            matchTP = ["physical", "quantum", "kinetics", "thermo", "stat", "surface", "solid", "group", "fluid"].some(k => t.includes(k));
        } else if (CUR_TOPIC === "Analytical") {
            matchTP = ["analytical", "spectro", "chromat", "electro"].some(k => t.includes(k));
        } else if (CUR_TOPIC === "Organic") {
            matchTP = ["organic", "polymer", "acid"].some(k => t.includes(k));
        } else { matchTP = t.includes(CUR_TOPIC.toLowerCase()); }

        let matchTY = false;
        if (CUR_GENRE === "CONCEPT") matchTY = q.ty === "CONCEPT";
        else if (CUR_GENRE === "MATH") matchTY = q.ty === "MATH";
        else if (CUR_GENRE === "STATISTICS") matchTY = q.ty === "STATISTICS";
        else if (CUR_GENRE === "APPLICATION") matchTY = ["APPLICATION", "TROUBLESHOOTING"].includes(q.ty);
        else matchTY = true; 
        
        return matchDS && matchTP && matchTY;
    });

    // SHUFFLE
    for (let i = POOL.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [POOL[i], POOL[j]] = [POOL[j], POOL[i]];
    }

    if(!POOL.length) { 
        // Fallback: Broad search if niche is empty
        POOL = RAW_DATA.filter(q => q.ds === CUR_DATASET && q.tp.toLowerCase().includes(CUR_TOPIC.toLowerCase()));
        if(!POOL.length) { renderDatasetSelect(); return; }
    }
    renderNext();
}

function renderNext() {
    const s = document.getElementById('stack'); s.innerHTML = "";
    if(!POOL.length) { renderEnd(); return; }
    
    const q = POOL[0]; 
    const c = document.createElement('div'); c.className = "card";

    // Normalization
    const qText = q.q || q.question_text;
    const hText = q.h || q.hint;
    const exText = q.ex || q.explanation;
    const u = q.u || q.swipe_up_label;
    const r = q.r || q.swipe_right_label;
    const l = q.l || q.swipe_left_label;

    let displayHTML = `<div class="card-q">${formatChem(qText)}</div>`;
    if (MODE === "REVIEW") {
        c.style.borderColor = "var(--blue)";
        c.style.boxShadow = "0 0 15px rgba(52, 152, 219, 0.2)";
        displayHTML = `
            <div class="card-q" style="font-size:1.3rem; color:#bbb">
                <span style="color:var(--blue); font-size:0.8rem; letter-spacing:2px">LOGIC FIRST</span><br>
                ${formatChem(exText)}
            </div>
            <div style="text-align:center; margin-top:20px; font-style:italic; color:#555; font-size:0.9rem">Recall: ${formatChem(qText)}</div>
        `;
    }

    c.innerHTML = `
        ${displayHTML}
        <div class="swipe-label sl-up">${u}</div>
        <div class="swipe-label sl-left">${l}</div>
        <div class="swipe-label sl-right">${r}</div>
        <div class="swipe-label sl-down sl-down-hint">${MODE === "REVIEW" ? "GOT IT" : formatChem(hText)}</div>
        <div class="overlay">
            <div class="overlay-label">${MODE === "REVIEW" ? "NEXT CARD" : "LOGIC ANALYSIS"}</div>
            <div class="overlay-body">${formatChem(exText)}</div>
            <button class="btn" onclick="this.parentElement.classList.remove('active')">CONTINUE</button>
        </div>
    `;
    s.appendChild(c); document.getElementById('rank-ui').innerText = MODE === "REVIEW" ? "REVIEW" : (q.id || "Q"); 
    bindPhysics(c, q);
}

function renderEnd() {
    MODE = "SESSION_END";
    const s = document.getElementById('stack'); s.innerHTML = "";
    const c = document.createElement('div'); c.className = "card";
    const revCount = MISTAKES.length;

    c.innerHTML = `
        <div class="card-q">MISSION COMPLETE<br><span style="color:var(--gold); font-size:1.5rem">${SCORE} XP</span></div>
        <div style="margin: 15px 0; width: 100%; text-align:center;">
            <input type="text" id="userName" placeholder="CODENAME" style="background: #222; border: 1px solid #444; color: #fff; padding: 10px; border-radius: 6px; width: 60%; font-family: var(--font-code); text-align: center; text-transform: uppercase;">
            <div style="display:flex; gap:10px; justify-content:center; margin-top:10px;">
                <button onclick="submitSession()" style="background: var(--gold); color: #000; border: none; padding: 10px; border-radius: 6px; font-weight: 900; flex:1;">UPLOAD</button>
                <button onclick="downloadSummary()" style="background: #333; color: #fff; border: 1px solid #555; padding: 10px; border-radius: 6px; font-weight: 900; flex:1;">⬇ TO-DO</button>
            </div>
        </div>
        <div class="swipe-label sl-up">RESTART</div>
        <div class="swipe-label sl-down" style="color:${revCount > 0 ? 'var(--blue)' : '#333'}">REVIEW (${revCount})</div>
        <div class="swipe-label sl-left" style="color:var(--purple)">CHANGE TOPIC</div>
        <div class="swipe-label sl-right" style="color:var(--green)">LEVEL UP</div>
    `;
    s.appendChild(c); bindPhysics(c, {});
}

/* --- GLOBAL EXPORTS (Crucial for V81.0 Stability) --- */
window.submitSession = function() {
    const name = document.getElementById('userName').value.trim().toUpperCase();
    if(!name) { alert("Identify yourself."); return; }
    const payload = { target: "Telemetry", questionId: "SESSION_SUBMIT", result: name, vectorChoice: `Score: ${SCORE}`, latency: `Mistakes: ${MISTAKES.length}`, set: CUR_DATASET };
    
    // IMMEDIATE OFFLINE CHECK
    if (!navigator.onLine) {
        storeOffline(payload);
        return;
    }

    const img = new Image();
    img.src = `${ENDPOINT}?target=${payload.target}&questionId=${payload.questionId}&result=${payload.result}&vectorChoice=${payload.vectorChoice}&latency=${payload.latency}`;
    img.onload = () => { alert("UPLOAD COMPLETE."); document.getElementById('userName').disabled = true; };
    img.onerror = () => { storeOffline(payload); };
};

function storeOffline(payload) {
    alert("OFFLINE. Data saved to device.");
    try {
        const pending = JSON.parse(localStorage.getItem('pendingUploads') || "[]");
        pending.push(payload);
        localStorage.setItem('pendingUploads', JSON.stringify(pending));
    } catch(e) { alert("Device Storage Full"); }
}

window.downloadSummary = function() {
    let content = `ALCHEMIST REPORT\nOPERATOR: ${document.getElementById('userName').value||"UNKNOWN"}\nSCORE: ${SCORE}\n\n`;
    if (MISTAKES.length === 0) content += "CLEAN RUN.\n";
    else {
        content += "ACTION PLAN:\n\n";
        MISTAKES.forEach((m, i) => {
            content += `[ ] ${m.tp || "General"}: ${m.q}\n    FIX: ${m.ex.replace(/✅|❌/g,'').trim()}\n\n`;
        });
    }
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    a.download = `PLAN_${Date.now()}.txt`;
    a.click();
};

function bindPhysics(el, data) {
    let x=0, y=0, sx=0, sy=0, active=false, triggerDir=null;
    const labels = { up: el.querySelector('.sl-up'), dn: el.querySelector('.sl-down'), lt: el.querySelector('.sl-left'), rt: el.querySelector('.sl-right') };
    const start = e => { if(isTransitioning) return; active=true; const p = e.touches ? e.touches[0] : e; sx=p.clientX; sy=p.clientY; startTime = Date.now(); el.style.transition="none"; };
    const move = e => {
        if(!active) return; const p = e.touches ? e.touches[0] : e; const dx = p.clientX - sx, dy = p.clientY - sy, dist = Math.sqrt(dx*dx + dy*dy);
        x = (dist > 35) ? dx * (35/dist) : dx; y = (dist > 35) ? dy * (35/dist) : dy;
        let ang = Math.atan2(-y, x) * (180/Math.PI); if(ang<0) ang+=360;
        Object.values(labels).forEach(l => { if(l) l.style.opacity = 0; });
        if(dist > 10) {
            let L = (ang>=45&&ang<135)?labels.up:(ang>=135&&ang<225)?labels.lt:(ang>=225&&ang<315)?labels.dn:labels.rt;
            if(L) { L.style.opacity = Math.min(dist/30, 1); L.style.transform = `scale(${0.9 + (dist/100)})`; }
        }
        if((MODE==="QUIZ" || MODE==="REVIEW") && triggerDir==="DOWN") el.classList.add('study-active'); else el.classList.remove('study-active');
        el.style.transform = `translate3d(${x}px,${y}px,0) rotate(${x/20}deg)`;
        triggerDir = (dist >= 35) ? ((ang>=45&&ang<135)?"UP":(ang>=135&&ang<225)?"LEFT":(ang>=225&&ang<315)?"DOWN":"RIGHT") : null;
    };
    const end = () => {
        if(!active) return; active=false;
        if(triggerDir) {
            if((MODE==="QUIZ" || MODE==="REVIEW") && triggerDir==="DOWN") { el.querySelector('.overlay').classList.add('active'); el.style.transform="translate3d(0,0,0)"; }
            else handleAction(el, data, x, y, triggerDir);
        } else { el.style.transition="transform .4s"; el.style.transform="translate3d(0,0,0)"; el.classList.remove('study-active'); }
    };
    el.addEventListener('mousedown', start); window.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
    el.addEventListener('touchstart', start); el.addEventListener('touchmove', move); el.addEventListener('touchend', end);
}

function handleAction(el, data, x, y, dir) {
    isTransitioning = true;
    el.style.transition = "transform 0.4s ease-in, opacity 0.3s";
    el.style.transform = `translate3d(${x*12}px,${y*12}px,0)`; el.style.opacity = "0";

    setTimeout(() => {
        el.remove(); 
        if (MODE === "DATASET_SELECT") {
            const map = { UP: "SET_A", LEFT: "SET_B", RIGHT: "SET_C", DOWN: "SET_D" };
            renderTopicSelect(map[dir]);
        }
        else if (MODE === "TOPIC_SELECT") {
            const map = { UP: "Physical", LEFT: "Organic", RIGHT: "Inorganic", DOWN: "Analytical" };
            renderGenreSelect(map[dir]);
        }
        else if (MODE === "GENRE_SELECT") {
            if (dir === "UP") startQuiz("CONCEPT");
            else if (dir === "DOWN") startQuiz("APPLICATION");
            else if (dir === "LEFT") startQuiz("MATH");
            else if (dir === "RIGHT") startQuiz("STATISTICS");
            else isTransitioning = false; 
        }
        else if (MODE === "QUIZ" || MODE === "REVIEW") {
            const correct = dir === (data.c || data.correct);
            if(correct) SCORE += (MODE === "REVIEW" ? 5 : 10);
            else if(MODE === "QUIZ" && !MISTAKES.some(m => m.id === data.id)) MISTAKES.push(data);
            new Image().src = `${ENDPOINT}?target=Telemetry&questionId=${data.id}&result=${correct}&vectorChoice=${dir}&latency=${Date.now()-startTime}`;
            POOL.shift(); renderNext(); 
        }
        else if (MODE === "SESSION_END") {
            if (dir === "UP") location.reload();
            else if (dir === "DOWN") {
                if(MISTAKES.length === 0) { location.reload(); return; }
                MODE = "REVIEW"; POOL = [...MISTAKES]; MISTAKES = []; renderNext();
            }
            else if (dir === "LEFT") renderTopicSelect(CUR_DATASET);
            else if (dir === "RIGHT") { CUR_DATASET = NEXT_LEVEL[CUR_DATASET] || "SET_A"; startQuiz(CUR_GENRE); }
        }
        isTransitioning = false; updateUI();
    }, 400); 
}

function updateUI() { document.getElementById('xp-ui').innerText = `${SCORE} XP`; document.getElementById('progress-bar').style.width = `${(SCORE % 100)}%`; }
window.onload = init;
