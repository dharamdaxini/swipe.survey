let DATABASE = [], POOL = [], MISTAKES = [], SCORE = 0;
let MODE = "MENU_DIFF", CUR_DATASET = "", CUR_TOPIC = "", SESSION_LIMIT = 20, CUR_INDEX = 0;

window.onload = () => {
    const saved = localStorage.getItem('alchemist_vault');
    if (saved) document.getElementById('data-input').value = saved;
};

function vaultAndInject() {
    const raw = document.getElementById('data-input').value.trim();
    if (!raw) return;
    localStorage.setItem('alchemist_vault', raw);
    process(raw);
    document.getElementById('portal').style.display = 'none';
    ['header', 'stack'].forEach(id => document.getElementById(id).style.display = 'flex');
}

function process(raw) {
    const lines = raw.split(/\r?\n/);
    DATABASE = lines.map(line => {
        // Safe CSV Split (Regex handles commas inside quotes)
        const pattern = /(".*?"|[^",\t\s][^",\t]*|(?<=,|^)(?=$|,))/g;
        const cols = (line.match(pattern) || []).map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length < 8) return null;
        return {
            id: cols[0], ds: cols[1], tp: cols[2], ty: cols[3],
            q: cols[4], u: cols[5], r: cols[6], l: cols[7],
            c: cols[8] || "RIGHT", ex: cols[9] || ""
        };
    }).filter(x => x !== null && x.id.toLowerCase() !== "id");
    renderDiff();
}

const format = (t) => t ? t.toString().replace(/(\d)\s*x\s*10\^(-?\d+)/g, '$1×10<sup>$2</sup>').replace(/([A-Z][a-z]?)(\d+)/g, '$1<sub>$2</sub>') : "";

/* V81.1 Legacy Magnetic Physics Engine */
function bindPhysics(el, data) {
    let x = 0, y = 0, sx = 0, sy = 0, active = false, td = null;
    const lbs = { up: el.querySelector('.sl-up'), lt: el.querySelector('.sl-left'), rt: el.querySelector('.sl-right') };
    const MAX_RADIUS = 38; 

    el.ontouchstart = e => { active = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY; el.style.transition = "none"; };
    window.ontouchmove = e => { 
        if (!active) return; 
        let dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy; 
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > MAX_RADIUS) { x = dx * (MAX_RADIUS/dist); y = dy * (MAX_RADIUS/dist); } else { x = dx; y = dy; }
        requestAnimationFrame(() => { if (active) el.style.transform = `translate3d(${x}px,${y}px,0) rotate(${dx/12}deg) scale(1.05)`; });
        const ang = Math.atan2(-dy, dx) * (180 / Math.PI);
        Object.values(lbs).forEach(l => { if (l) l.style.opacity = 0; });
        if (dist > 20) {
            let d = (ang >= 45 && ang < 135) ? "up" : (ang >= 135 || ang < -135) ? "lt" : "rt";
            if (lbs[d]) lbs[d].style.opacity = 1; td = d.toUpperCase();
        }
    };
    window.ontouchend = () => { if (!active) return; active = false; if (Math.sqrt(x*x + y*y) > 30) handleAction(el, data, td); else { el.style.transition = "0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)"; el.style.transform = "none"; } };
}

function renderMenu(q, up, lt, rt) { const s = document.getElementById('stack'); s.innerHTML = ""; const c = document.createElement('div'); c.className = "card"; c.innerHTML = `<div class="card-q">${q}</div><div class="swipe-label sl-up">${up}</div><div class="swipe-label sl-left">${lt}</div><div class="swipe-label sl-right">${rt}</div>`; s.appendChild(c); bindPhysics(c, {}); }
function renderDiff() { MODE = "MENU_DIFF"; renderMenu("CHOOSE SET", "SET A", "SET B", "SET C"); }
function renderTopic(ds) { MODE = "MENU_TOPIC"; CUR_DATASET = ds; renderMenu("DOMAIN", "PHYSICAL", "ORGANIC", "INORGANIC"); }
function renderVolume() { MODE = "MENU_VOLUME"; renderMenu("SESSION", "20 Qs", "50 Qs", "100 Qs"); }
function startQuiz(limit) { SESSION_LIMIT = limit; POOL = DATABASE.filter(q => q.ds === CUR_DATASET).sort(() => 0.5 - Math.random()).slice(0, limit); renderNext(); }

function renderNext() {
    const s = document.getElementById('stack'); s.innerHTML = "";
    if (!POOL.length) { renderDiff(); return; }
    const q = { ...POOL[0] };
    const items = [{ t: q.u, c: q.c === "UP" }, { t: q.r, c: q.c === "RIGHT" }, { t: q.l, c: q.c === "LEFT" }].sort(() => Math.random() - 0.5);
    q.u = items[0].t; q.r = items[1].t; q.l = items[2].t; q.c = items[0].c ? "UP" : (items[1].c ? "RIGHT" : "LEFT");
    const c = document.createElement('div'); c.className = "card";
    c.innerHTML = `<div class="card-q">${format(q.q)}</div><div class="swipe-label sl-up">${q.u}</div><div class="swipe-label sl-left">${q.l}</div><div class="swipe-label sl-right">${q.r}</div>`;
    s.appendChild(c); bindPhysics(c, q);
}

function handleAction(el, data, dir) {
    if (MODE === "MENU_DIFF") renderTopic(dir === "UP" ? "SET_A" : dir === "LT" ? "SET_B" : "SET_C");
    else if (MODE === "MENU_TOPIC") renderVolume();
    else if (MODE === "MENU_VOLUME") startQuiz(dir === "UP" ? 20 : dir === "LT" ? 50 : 100);
    else { POOL.shift(); renderNext(); }
}
