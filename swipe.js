/* ALCHEMIST V130.2 | MASTER SYNC */

let db, VAULT = [], POOL = [], SCORE = 0, INDEX = 1, SEL_PATH = "", SEL_CORE = "";
const STORE_NAME = "Vaults";
let LAST_IMPORTED_SET = null;

/* ---------- DEFAULT VAULT ---------- */
const DEFAULT_VAULT_DATA = [
    { id:"DEF_001", set:"CORE_VAULT", dom:"ENERGY", dep:"Kinetics",
      q:"Why does the rate of electron transfer (k_et) paradoxically decrease in the Marcus Inverted Region?",
      u:"Barrier Height Increases", r:"Electronic Coupling Drops", l:"Solvent Friction Limit",
      ans:"UP", expl:"Once −ΔG° exceeds λ, the intersection shifts uphill.",
      hint:"Think Marcus parabolas.", context:"Marcus inverted region explanation." }
];

/* ---------- FORMATTER ---------- */
const format = t => {
    if (!t) return "";
    return t.toString()
        .replace(/&Delta;|Delta/g,'Δ')
        .replace(/&lambda;|lambda/g,'λ')
        .replace(/<=>/g,'⇌')
        .replace(/->/g,'→')
        .replace(/\^([-+]?\d+)/g,'<sup>$1</sup>')
        .replace(/_(\d+)/g,'<sub>$1</sub>')
        .replace(/\n/g,'<br>');
};

/* ---------- DB ---------- */
const request = indexedDB.open("AlchemistDB", 1);
request.onupgradeneeded = e => e.target.result.createObjectStore(STORE_NAME);
request.onsuccess = e => { db = e.target.result; seed(); };

function seed() {
    const store = db.transaction([STORE_NAME], "readonly").objectStore(STORE_NAME);
    store.get("CORE_VAULT").onsuccess = e => {
        if (!e.target.result) {
            const tx = db.transaction([STORE_NAME], "readwrite");
            tx.objectStore(STORE_NAME).put(DEFAULT_VAULT_DATA, "CORE_VAULT");
        }
    };
}

/* ---------- IMPORT ---------- */
function importDataset() {
    const raw = document.getElementById("data-input").value.trim();
    if (!raw) return;

    const rows = raw.split(/\n/);
    const parsed = [];

    for (let r of rows) {
        const c = r.split(/\t/);
        if (c.length >= 9 && c[0].toLowerCase() !== "id") {
            parsed.push({
                id:c[0], set:c[1], dom:c[2], dep:c[3],
                q:c[4], u:c[5], r:c[6], l:c[7],
                ans:c[8].toUpperCase(),
                expl:c[9]||"", hint:c[10]||"", context:c[11]||""
            });
        }
    }

    if (!parsed.length) {
        alert("DATA ERROR");
        return;
    }

    const tx = db.transaction([STORE_NAME], "readwrite");
    tx.objectStore(STORE_NAME).put(parsed, parsed[0].set);
    tx.oncomplete = () => {
        LAST_IMPORTED_SET = parsed[0].set;
        document.getElementById("start-btn").style.display = "block";
    };
}

/* ---------- START SESSION ---------- */
function startSession() {
    if (!LAST_IMPORTED_SET) return;
    loadDataset(LAST_IMPORTED_SET);
}

/* ---------- LOAD ---------- */
function loadDataset(name) {
    db.transaction([STORE_NAME], "readonly")
      .objectStore(STORE_NAME)
      .get(name).onsuccess = e => {
        VAULT = e.target.result;
        document.getElementById("portal").style.display = "none";
        document.getElementById("header").style.display = "flex";
        document.getElementById("stack").style.display = "flex";
        renderS0();
    };
}

/* ---------- FLOW ---------- */
function renderS0() {
    renderSlide("SELECT MODE","TEST","LEARN","QUIZ+LEARN","DRILL","S_PATH");
}
function renderS1() {
    renderSlide("MAINLINE CORE","CHANGE","MATTER","ENERGY","ANALYSIS","S_CORE");
}

function start() {
    SCORE = 0; INDEX = 1;
    POOL = VAULT.slice(0,20);
    renderNext();
}

function renderSlide(q,up,l,r,d,type) {
    const s = document.getElementById("stack");
    s.innerHTML = "";
    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `
        <div class="card-q">${q}</div>
        <div class="swipe-label sl-up">${up}</div>
        <div class="swipe-label sl-left">${l}</div>
        <div class="swipe-label sl-right">${r}</div>
        <div class="swipe-label sl-down">${d}</div>`;
    s.appendChild(c);
    bindPhysics(c,{type});
}

function renderNext() {
    const s = document.getElementById("stack");
    s.innerHTML = "";
    if (!POOL.length) { renderEnd(); return; }

    const q = POOL[0];
    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `
        <div class="card-q">${format(q.q)}</div>
        <div class="swipe-label sl-up">${format(q.u)}</div>
        <div class="swipe-label sl-left">${format(q.l)}</div>
        <div class="swipe-label sl-right">${format(q.r)}</div>
        <div class="swipe-label sl-down">⬇ HINT</div>`;
    s.appendChild(c);
    bindPhysics(c,q);
    updateHUD();
}

/* ---------- PHYSICS (UNCHANGED) ---------- */
function bindPhysics(el,data){
    let sx,sy,dx=0,dy=0,active=false,dir="";
    el.addEventListener("touchstart",e=>{
        active=true;
        sx=e.touches[0].clientX;
        sy=e.touches[0].clientY;
        el.style.transition="none";
    },{passive:false});

    el.addEventListener("touchmove",e=>{
        if(!active)return;
        e.preventDefault();
        dx=e.touches[0].clientX-sx;
        dy=e.touches[0].clientY-sy;
        el.style.transform=`translate(${dx*0.5}px,${dy*0.5}px) rotate(${dx/20}deg)`;
    },{passive:false});

    el.addEventListener("touchend",()=>{
        if(!active)return;
        active=false;
        if(Math.abs(dx)>60||Math.abs(dy)>60) route(el,data,dir);
        else resetCard(el);
    });
}

function route(el,data,dir){
    if(data.type==="S_PATH"){SEL_PATH=dir;renderS1();return;}
    if(data.type==="S_CORE"){SEL_CORE=dir;start();return;}
    POOL.shift(); INDEX++; renderNext();
}

function resetCard(el){
    el.style.transition="0.4s cubic-bezier(0.175,0.885,0.32,1.275)";
    el.style.transform="none";
}

function renderEnd(){
    document.getElementById("stack").innerHTML =
        "<div class='card'><div class='card-q'>DONE</div></div>";
}

function updateHUD(){
    document.getElementById("p-text").innerHTML = `${INDEX}/20 UNITS`;
    document.getElementById("progress-bar").style.width = `${(INDEX/20)*100}%`;
    document.getElementById("score-text").innerHTML = `${SCORE} XP`;
}

function closeOverlay(){
    document.getElementById("global-overlay").classList.remove("active");
}
