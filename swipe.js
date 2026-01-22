/* --- Alchemist Core Logic --- */
let DATABASE = [], POOL = [], MISTAKES = [], SCORE = 0;
let MODE = "MENU_DIFF", CUR_DATASET = "", CUR_TOPIC = "", CUR_DEPTH = "", SESSION_LIMIT = 20, CUR_INDEX = 0;
const NEXT_LVL = { "SET_A": "SET_B", "SET_B": "SET_C", "SET_C": "SET_D", "SET_D": "SET_A" };

function initVault() {
    const lines = VAULT_DATA.trim().split('\n');
    DATABASE = lines.map(line => {
        try {
            if (!line.includes('❌')) return null;
            const id = line.substring(0, 10), ds = id.substring(0, 5);
            const type = ["CONCEPT", "MATH", "APPLICATION", "TROUBLESHOOTING"].find(t => line.includes(t)) || "CONCEPT";
            const explStart = line.indexOf('❌'), weightMatch = line.match(/(\d\.\d+)$/);
            const weight = weightMatch ? weightMatch[1] : "0.5";
            const middle = line.substring(line.indexOf(type) + type.length, explStart).trim();
            const dirs = ["UP", "RIGHT", "LEFT", "DOWN"];
            const correct = dirs.find(d => middle.endsWith(d)) || "RIGHT";
            const qAndO = middle.substring(0, middle.length - correct.length).trim();
            
            // SAFE-SPLIT PARSER: Fixes empty slides
            const qIndex = qAndO.lastIndexOf('?');
            const question = qIndex !== -1 ? qAndO.substring(0, qIndex + 1) : qAndO + "?";
            const optsRaw = qIndex !== -1 ? qAndO.substring(qIndex + 1).trim() : "";
            const opts = optsRaw.replace(/([a-z0-9])([A-Z])/g, '$1|$2').split('|').map(s => s.trim());

            const cleanEx = line.substring(explStart, line.lastIndexOf(weight)).replace(/[❌✅]/g, '').trim();
            return { id, ds, ty: type, q: question, u: opts[0]||"Opt A", r: opts[1]||"Opt B", l: opts[2]||"Opt C", c: correct, ex: cleanEx };
        } catch (e) { return null; }
    }).filter(x => x !== null);
    if(document.getElementById('loader')) document.getElementById('loader').remove();
    renderDiff();
}

const format = (t) => t ? t.toString().replace(/(\d)\s*x\s*10\^(-?\d+)/g, '$1×10<sup>$2</sup>').replace(/([A-Z][a-z]?)(\d+)/g, '$1<sub>$2</sub>').replace(/->/g, '→').replace(/\|\|/g, '<br><br>') : "";
function updateHUD() { document.getElementById('rank-ui').innerText = `${CUR_INDEX} / ${SESSION_LIMIT}`; document.getElementById('progress-bar').style.width = `${(CUR_INDEX / SESSION_LIMIT) * 100}%`; }
function addToLog(msg, action) { const tape = document.getElementById('history-tape'); tape.querySelectorAll('.active').forEach(el => el.classList.remove('active')); const div = document.createElement('div'); div.className = "log-item active"; div.innerHTML = `> ${msg}`; if (action) div.onclick = action; tape.prepend(div); }
function renderMenu(q, up, lt, rt, dn) { const s = document.getElementById('stack'); s.innerHTML = ""; const c = document.createElement('div'); c.className = "card"; c.innerHTML = `<div class="card-q">${q}</div><div class="swipe-label sl-up">${up}</div><div class="swipe-label sl-left">${lt}</div><div class="swipe-label sl-right">${rt}</div><div class="swipe-label sl-down">${dn}</div>`; s.appendChild(c); bindPhysics(c, {}); }

function renderDiff() { MODE = "MENU_DIFF"; addToLog("READY", null); renderMenu("SELECT DIFFICULTY", "SET A", "SET B", "SET C", "SET D"); }
function renderTopic(ds) { MODE = "MENU_TOPIC"; CUR_DATASET = ds.replace(/\s/g, '_'); addToLog(ds, renderDiff); renderMenu("CHOOSE DOMAIN", "PHYSICAL", "ORGANIC", "INORGANIC", "ANALYTICAL"); }
function renderDepth(tp) { MODE = "MENU_DEPTH"; CUR_TOPIC = tp; addToLog(tp, () => renderTopic(CUR_DATASET)); renderMenu("SELECT DEPTH", "CONCEPT", "MATH", "DATA", "LOGIC"); }
function renderVolume(dp) { MODE = "MENU_VOLUME"; CUR_DEPTH = dp; addToLog(dp, () => renderDepth(CUR_TOPIC)); renderMenu("SESSION VOLUME", "10 Qs", "20 Qs", "30 Qs", "50 Qs"); }
function startQuiz(limit) { SESSION_LIMIT = parseInt(limit); CUR_INDEX = 1; MISTAKES = []; POOL = DATABASE.filter(q => q.ds === CUR_DATASET).sort(() => Math.random() - 0.5).slice(0, SESSION_LIMIT); MODE = "QUIZ"; renderNext(); }

function renderNext() {
    const s = document.getElementById('stack'); s.innerHTML = "";
    if (!POOL.length) { renderEnd(); return; }
    updateHUD(); const q = { ...POOL[0] };
    const items = [{ t: q.u, c: q.c === "UP" }, { t: q.r, c: q.c === "RIGHT" }, { t: q.l, c: q.c === "LEFT" }].sort(() => Math.random() - 0.5);
    q.u = items[0].t; q.r = items[1].t; q.l = items[2].t;
    q.c = items[0].c ? "UP" : (items[1].c ? "RIGHT" : "LEFT");
    const c = document.createElement('div'); c.className = "card";
    c.innerHTML = `<div class="card-q">${format(q.q)}</div><div class="swipe-label sl-up">${q.u}</div><div class="swipe-label sl-left">${q.l}</div><div class="swipe-label sl-right">${q.r}</div><div class="swipe-label sl-down">⬇ VIEW LOGIC</div><div class="overlay"><div class="overlay-body">${format(q.ex)}</div><button class="btn" onclick="this.parentElement.classList.remove('active')">BACK</button></div>`;
    s.appendChild(c); bindPhysics(c, q);
}

function renderEnd() {
    MODE = "END"; const s = document.getElementById('stack'); s.innerHTML = ""; const c = document.createElement('div'); c.className = "card";
    c.innerHTML = `<div class="card-q">MISSION COMPLETE<br><span style="color:var(--gold); font-size:1.8rem">${SCORE} XP</span></div><div class="swipe-label sl-up">RESTART</div><div class="swipe-label sl-left">MENU</div><div class="swipe-label sl-right">LEVEL UP</div><div class="swipe-label sl-down">REVIEW MISTAKES</div>`;
    s.appendChild(c); bindPhysics(c, {});
}

/* MAGNETIC PHYSICS ENGINE (V81.1 Legacy) */
function bindPhysics(el, data) {
    let x = 0, y = 0, sx = 0, sy = 0, active = false, td = null;
    const lbs = { up: el.querySelector('.sl-up'), dn: el.querySelector('.sl-down'), lt: el.querySelector('.sl-left'), rt: el.querySelector('.sl-right') };
    const MAX_RADIUS = 38; 

    el.onmousedown = el.ontouchstart = e => { 
        active = true; const p = e.touches ? e.touches[0] : e; sx = p.clientX; sy = p.clientY; 
        el.style.transition = "none"; 
    };
    
    window.onmousemove = window.ontouchmove = e => { 
        if (!active) return; 
        const p = e.touches ? e.touches[0] : e; 
        let dx = p.clientX - sx; let dy = p.clientY - sy; 
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance > MAX_RADIUS) {
            const ratio = MAX_RADIUS / distance;
            x = dx * ratio; y = dy * ratio;
        } else { x = dx; y = dy; }
        
        requestAnimationFrame(() => {
            if (active) { el.style.transform = `translate3d(${x}px,${y}px,0) rotate(${dx/12}deg) scale(1.05)`; }
        });
        
        const ang = Math.atan2(-dy, dx) * (180 / Math.PI);
        Object.values(lbs).forEach(l => { if (l) l.style.opacity = 0; });
        if (distance > 20) {
            let d = (ang >= 45 && ang < 135) ? "up" : (ang >= 135 || ang < -135) ? "lt" : (ang >= -135 && ang < -45) ? "dn" : "rt";
            if (lbs[d]) lbs[d].style.opacity = 1; td = d.toUpperCase();
        }
    };
    
    window.onmouseup = window.ontouchend = e => { 
        if (!active) return; active = false; 
        const p = e.changedTouches ? e.changedTouches[0] : e;
        const finalDist = Math.sqrt(Math.pow(p.clientX - sx, 2) + Math.pow(p.clientY - sy, 2));

        if (finalDist > 30) { handleAction(el, data, td); } 
        else { 
            el.style.transition = "transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)"; 
            el.style.transform = "none"; 
        } 
    };
}

function handleAction(el, data, dir) {
    if (MODE === "MENU_DIFF") renderTopic(dir === "UP" ? "SET A" : dir === "LT" ? "SET B" : dir === "RT" ? "SET C" : "SET D");
    else if (MODE === "MENU_TOPIC") renderDepth(dir === "UP" ? "Physical" : dir === "LT" ? "Organic" : dir === "RT" ? "Inorganic" : "Analytical");
    else if (MODE === "MENU_DEPTH") renderVolume(dir === "UP" ? "CONCEPT" : dir === "LT" ? "MATH" : dir === "RT" ? "DATA" : "LOGIC");
    else if (MODE === "MENU_VOLUME") startQuiz(dir === "UP" ? 10 : dir === "LT" ? 20 : dir === "RT" ? 30 : 50);
    else if (MODE === "END") {
        if (dir === "UP") startQuiz(SESSION_LIMIT);
        else if (dir === "LT") renderDiff();
        else if (dir === "RT") { CUR_DATASET = NEXT_LVL[CUR_DATASET] || "SET_A"; startQuiz(SESSION_LIMIT); }
        else if (dir === "DN") { if (MISTAKES.length > 0) { POOL = [...MISTAKES]; MISTAKES = []; CUR_INDEX = 1; SESSION_LIMIT = POOL.length; MODE = "QUIZ"; renderNext(); } else renderDiff(); }
    } else {
        if (dir === "DN") { el.querySelector('.overlay').classList.add('active'); el.style.transform = "none"; return; }
        const ad = dir.replace('LT', 'LEFT').replace('RT', 'RIGHT');
        if (ad === data.c) { SCORE += 10; document.getElementById('xp-ui').innerText = `${SCORE} XP`; }
        else { if(!MISTAKES.find(m => m.id === data.id)) MISTAKES.push(data); }
        POOL.shift(); CUR_INDEX++; renderNext();
    }
}
window.onload = initVault;
