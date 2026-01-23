/* --- GLOBAL STATE --- */
let VAULT = [], POOL = [], MISTAKES = [], SCORE = 0;
let MODE = "INIT", INDEX = 1, IS_REVIEW = false;
let SEL_PATH = "", SEL_VOL = 20, SEL_DEPTH = "", SEL_DOMAIN = "", SEL_DIFF = "";

/* --- INITIALIZATION & PERSISTENCE --- */
window.onload = () => {
    // Force cache bypass via URL versioning
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('v')) { window.location.search = '?v=117.1'; }
    
    const cached = localStorage.getItem('alch_v117_vault');
    if (cached) document.getElementById('data-input').value = cached;
};

function masterInit() {
    const raw = document.getElementById('data-input').value.trim();
    if (!raw) return alert("VAULT EMPTY: Please paste your CSV data.");
    localStorage.setItem('alch_v117_vault', raw);
    
    // CSV Parser with Regex to handle commas inside quotes
    const lines = raw.split(/\r?\n/);
    VAULT = lines.map(line => {
        const regex = /(".*?"|[^",\t\s][^",\t]*|(?<=,|^)(?=$|,))/g;
        const c = (line.match(regex) || []).map(x => x.replace(/^"|"$/g, '').trim());
        if (c.length < 11) return null;
        return { 
            id: c[0], diff: c[1], domain: c[2], depth: c[3], 
            q: c[4], u: c[5], r: c[6], l: c[7], 
            ans: c[8], expl: c[9], hint: c[10] 
        };
    }).filter(x => x && x.id.toLowerCase() !== "id");

    document.getElementById('portal').style.display = 'none';
    document.getElementById('header').style.display = 'block';
    document.getElementById('stack').style.display = 'flex';
    renderSlide_1_Path();
}

/* --- FUNNEL NAVIGATION --- */
function renderSlide_1_Path() { MODE = "SEL_PATH"; renderSlide("CHOOSE YOUR PATH", "---", "LEARN (V81.1)", "QUIZ (V111.0)", "---"); }
function renderSlide_2_Vol() { MODE = "SEL_VOL"; renderSlide("TOTAL QUESTIONS", "10 Qs", "20 Qs", "30 Qs", "50 Qs"); }
function renderSlide_3_Depth() { MODE = "SEL_DEPTH"; renderSlide("SELECT DEPTH", "CONCEPT", "MATH", "APPLICATION", "LOGIC"); }
function renderSlide_4_Domain() { MODE = "SEL_DOMAIN"; renderSlide("CHOOSE DOMAIN", "PHYSICAL", "ORGANIC", "INORGANIC", "ANALYTICAL"); }
function renderSlide_5_Diff() { MODE = "SEL_DIFF"; renderSlide("DIFFICULTY", "SET A", "SET B", "SET C", "SET D"); }

function startSession() {
    MODE = "ACTIVE"; IS_REVIEW = false; INDEX = 1; SCORE = 0; MISTAKES = [];
    
    // Filter Pool based on Niche Selection
    let filtered = VAULT.filter(v => v.diff === SEL_DIFF);
    // Secondary filters (if data exists for these niches)
    const deepFilter = filtered.filter(v => v.depth.toUpperCase() === SEL_DEPTH && v.domain.toUpperCase() === SEL_DOMAIN);
    if (deepFilter.length > 0) filtered = deepFilter;
    
    POOL = filtered.sort(() => 0.5 - Math.random()).slice(0, SEL_VOL);
    renderNext();
}

/* --- RENDER ENGINE --- */
function renderSlide(q, up, lt, rt, dn) {
    const s = document.getElementById('stack'); s.innerHTML = "";
    const c = document.createElement('div'); c.className = "card";
    c.innerHTML = `
        <div class="card-q">${q}</div>
        <div class="swipe-label sl-up">${up}</div>
        <div class="swipe-label sl-left">${lt}</div>
        <div class="swipe-label sl-right">${rt}</div>
        <div class="swipe-label sl-down">${dn}</div>
    `;
    s.appendChild(c); bindPhysics(c, {});
}

function renderNext() {
    const s = document.getElementById('stack'); s.innerHTML = "";
    if (!POOL.length) { renderEnd(); return; }
    
    const q = { ...POOL[0] };
    const c = document.createElement('div'); c.className = "card";

    if (MODE === "REVIEW") {
        const correctText = q.ans === "UP" ? q.u : (q.ans === "RIGHT" ? q.r : q.l);
        c.innerHTML = `
            <div class="review-content">
                <span class="review-label">QUESTION</span><span class="review-text">${format(q.q)}</span>
                <span class="review-label">CORRECT ANSWER</span><span class="review-text" style="color:var(--green)">${format(correctText)}</span>
                <span class="review-label">LOGIC ANALYSIS</span><span class="review-text">${format(q.expl)}</span>
            </div>
            <div class="swipe-label sl-rt">NEXT ENTRY</div>
        `;
    } else {
        // Randomize Options for Quiz integrity
        const opts = [{ t: q.u, c: q.ans === "UP" }, { t: q.r, c: q.ans === "RIGHT" }, { t: q.l, c: q.ans === "LEFT" }].sort(() => Math.random() - 0.5);
        q.u = opts[0].t; q.r = opts[1].t; q.l = opts[2].t;
        q.ans = opts[0].c ? "UP" : (opts[1].c ? "RIGHT" : "LEFT");

        let dnLabel = (SEL_PATH === "QUIZ") ? "⬇ MARK AS UNSURE" : "⬇ VIEW ANALYSIS";
        
        c.innerHTML = `
            <div class="card-q">${format(q.q)}</div>
            <div class="swipe-label sl-up">${q.u}</div>
            <div class="swipe-label sl-left">${q.l}</div>
            <div class="swipe-label sl-right">${q.r}</div>
            <div class="swipe-label sl-down">${dnLabel}</div>
            <div class="overlay">
                <div class="overlay-body">${format(q.expl)}</div>
                <button class="btn" onclick="this.parentElement.classList.remove('active')">BACK</button>
            </div>
        `;
    }
    s.appendChild(c); bindPhysics(c, q); updateHUD();
}

function renderEnd() {
    MODE = "END"; const s = document.getElementById('stack'); s.innerHTML = ""; const c = document.createElement('div'); c.className = "card";
    c.innerHTML = `
        <div class="card-q">SESSION COMPLETE</div>
        <div class="swipe-label sl-up">RESTART</div>
        <div class="swipe-label sl-left">CORE MENU</div>
        <div class="swipe-label sl-right">NEW NICHE</div>
        <div class="swipe-label sl-down">${MISTAKES.length > 0 ? 'REVIEW MISTAKES' : 'PERFECT SCORE'}</div>
    `;
    s.appendChild(c); bindPhysics(c, {});
}

/* --- CORE ROUTING LOGIC --- */
    function route(el, data, dir) {
        if (MODE === "S_PATH") { 
            SEL_PATH = dir; 
            renderS1(); 
        }
        else if (MODE === "S_CORE") { 
            SEL_CORE = dir; 
            start(); 
        }
        else {
            if (dir === "DOWN") {
                // --- PEDAGOGICAL GUARDRAIL ---
                // If in TEST mode, ignore the downward swipe entirely
                if (SEL_PATH === "UP") { 
                    el.style.transition = "0.3s ease"; 
                    el.style.transform = "none"; 
                    return; 
                }
                
                // Otherwise, open the specific content for the current path
                openOverlay(data); 
                el.style.transition = "0.3s ease"; 
                el.style.transform = "none"; 
                return; 
            }
            POOL.shift(); INDEX++; renderNext();
        }
    }

    function openOverlay(d) {
        let content = "";
        
        // Context-Sensitive Content Mapping
        if (SEL_PATH === "LT") { // LEARN (BRIDGE) mode
            content = `<strong>LOGIC</strong><br>${format(d.expl)}<br><br><strong>CONTEXT</strong><br>${format(d.context)}`;
        } else { // QUIZ or QUIZ + LEARN
            content = `<strong>HINT</strong><br>${format(d.hint)}`;
        }

        document.getElementById('overlay-content').innerHTML = content;
        document.getElementById('global-overlay').classList.add('active');
    }

    } 
    else { 
        // --- CRITICAL FIX START ---
        if (dir === "DN") { 
            // 1. Open the modal
            openOverlay(data); 
            // 2. Reset card position so it doesn't fly away
            el.style.transition = "0.4s ease";
            el.style.transform = "none"; 
            // 3. STOP execution here (don't shift the pool)
            return; 
        } 
        // --- CRITICAL FIX END ---

        // Only advance if the direction was UP, LEFT, or RIGHT
        if (dir === data.ans.replace('LEFT','LT').replace('RIGHT','RT')) SCORE += 10; 
        else MISTAKES.push(data); 
        
        POOL.shift(); 
        INDEX++; 
        renderNext(); 
    } 
}

    
    // END SLIDE ROUTING
    else if (MODE === "END") { 
        if (dir === "UP") startSession(); 
        else if (dir === "DN" && MISTAKES.length > 0) { IS_REVIEW=true; POOL=[...MISTAKES]; INDEX=1; MODE="REVIEW"; renderNext(); } 
        else renderSlide_1_Path(); 
    }
    
    // REVIEW ROUTING
    else if (MODE === "REVIEW") { if (dir === "RT") { POOL.shift(); INDEX++; renderNext(); } }
    
    // ACTIVE SESSION ROUTING
    else {
        if (dir === "DN") {
            if (SEL_PATH === "QUIZ") {
                MISTAKES.push(data); // "Unsure" counts as mistake for review
                nextCard();
            } else {
                el.querySelector('.overlay').classList.add('active');
                el.style.transform = "none";
            }
            return;
        }
        
        // Answer Validation
        const isCorrect = (dir === data.ans.replace('LEFT','LT').replace('RIGHT','RT'));
        if (isCorrect) SCORE += 10; else if (!IS_REVIEW) MISTAKES.push(data);
        nextCard();
    }
}

function nextCard() { POOL.shift(); INDEX++; renderNext(); }

/* --- PHYSICS & UI UTILITIES --- */
function bindPhysics(el, data) {
    let x=0, y=0, sx=0, sy=0, active=false, dir=null;
    el.ontouchstart = e => { active=true; sx=e.touches[0].clientX; sy=e.touches[0].clientY; el.style.transition="none"; };
    window.ontouchmove = e => { 
        if (!active) return; 
        let dx = e.touches[0].clientX-sx, dy = e.touches[0].clientY-sy; const dist = Math.sqrt(dx*dx+dy*dy);
        if (dist > 38) { x=dx*(38/dist); y=dy*(38/dist); } else { x=dx; y=dy; }
        requestAnimationFrame(() => { if (active) el.style.transform = `translate3d(${x}px,${y}px,0) rotate(${dx/12}deg) scale(1.05)`; });
        const ang = Math.atan2(-dy, dx)*(180/Math.PI);
        el.querySelectorAll('.swipe-label').forEach(l => l.style.opacity=0);
        if (dist > 20) {
            let d = (ang >= 45 && ang < 135) ? ".sl-up" : (ang >= 135 || ang < -135) ? ".sl-left" : (ang >= -135 && ang < -45) ? ".sl-down" : ".sl-right";
            const targetLabel = el.querySelector(d); 
            if (targetLabel) { targetLabel.style.opacity = 1; dir = d.replace('.sl-','').toUpperCase(); }
        }
    };
    window.ontouchend = () => { if(!active) return; active=false; if(Math.sqrt(x*x+y*y)>30) route(el, data, dir); else { el.style.transition="0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)"; el.style.transform="none"; } };
}

function updateHUD() { 
    document.getElementById('p-text').innerText = `${INDEX} / ${POOL.length + INDEX - 1}`; 
    document.getElementById('score-text').innerText = `${SCORE} XP`; 
    document.getElementById('progress-bar').style.width = `${(INDEX/(POOL.length+INDEX-1))*100}%`; 
}

const format = (t) => {
    if (!t) return "";
    return t.toString()
        // 1. Greek Symbols & Units
        .replace(/Delta/g, '&Delta;')
        .replace(/lambda/g, '&lambda;')
        .replace(/nu/g, '&nu;')
        .replace(/sigma/g, '&sigma;')
        .replace(/epsilon/g, '&epsilon;')
        .replace(/phi/g, '&phi;')
        // 2. High-Rigor Exponents (‡, degrees, charges)
        .replace(/\^‡/g, '<sup>&Dagger;</sup>') 
        .replace(/\^o/g, '<sup>&deg;</sup>') 
        .replace(/\^(\+|-|\d+)/g, '<sup>$1</sup>')
        // 3. Complex Subscripts (Stoichiometry & States)
        .replace(/_(\d+)/g, '<sub>$1</sub>') 
        .replace(/_([a-z]+)/g, '<sub>$1</sub>') // e.g., k_et, E_a
        // 4. Mathematical Operators
        .replace(/->/g, '&rarr;')
        .replace(/<=>/g, '&rightleftharpoons;');
};
