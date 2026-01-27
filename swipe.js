/* ALCHEMIST v130.2 | FINAL STABLE BUILD */

let db, VAULT = [], POOL = [], SCORE = 0, INDEX = 1, SEL_PATH = "UP", SEL_CORE = "";
const STORE_NAME = "Vaults";

/* =========================
   CANONICAL TSV HEADER
========================= */
const CANONICAL_HEADER = [
  "id","set","domain","subdomain","difficulty","question",
  "opt_a","opt_b","opt_c","answer",
  "logic","hint","context",
  "field1","field2","field3","field4","field5",
  "field6","field7","field8","field9","field10",
  "field11","field12","field13","field14","field15"
];

/* =========================
   FORMATTER
========================= */
const format = t => t ? t.toString()
.replace(/<=>/g,"⇌").replace(/->/g,"→")
.replace(/\^([-+]?\d+)/g,"<sup>$1</sup>")
.replace(/_(\d+)/g,"<sub>$1</sub>")
.replace(/\n/g,"<br>") : "";

/* =========================
   DATABASE
========================= */
const request = indexedDB.open("AlchemistDB",1);
request.onupgradeneeded = e => e.target.result.createObjectStore(STORE_NAME);
request.onsuccess = e => { db = e.target.result; };

/* =========================
   IMPORT DATASET (FIXED)
========================= */
function importDataset(){
    const raw = document.getElementById("data-input").value.trim();
    if(!raw){ alert("Paste TSV first"); return; }

    const lines = raw.split(/\n/).filter(Boolean);
    let start = 0;

    if(lines[0].split("\t")[0].toLowerCase()==="id") start = 1;

    const parsed = [];

    for(let i=start;i<lines.length;i++){
        const cols = lines[i].split("\t");
        if(cols.length < 6) continue;

        const row = {};
        CANONICAL_HEADER.forEach((h,idx)=>{
            row[h] = cols[idx] || "";
        });
        parsed.push(row);
    }

    if(!parsed.length){ alert("Invalid TSV"); return; }

    const setName = parsed[0].set || "IMPORTED_SET";

    const tx = db.transaction([STORE_NAME],"readwrite");
    tx.objectStore(STORE_NAME).put(parsed,setName);
    tx.oncomplete = ()=>{
        VAULT = parsed;
        document.getElementById("data-input").value =
`IMPORTED ✔
ROWS: ${parsed.length}
SET: ${setName}`;
    };
}

/* =========================
   START SLIDES
========================= */
function startFromPortal(){
    if(!VAULT.length){ alert("Import dataset first"); return; }
    document.getElementById("portal").style.display="none";
    document.getElementById("header").style.display="block";
    document.getElementById("stack").style.display="flex";
    start();
}

/* =========================
   SESSION
========================= */
function start(){
    SCORE=0; INDEX=1;
    POOL=[...VAULT].slice(0,20);
    renderNext();
}

/* =========================
   RENDER CARD (FIXED)
========================= */
function renderNext(){
    const s=document.getElementById("stack");
    s.innerHTML="";
    if(!POOL.length){ renderEnd(); return; }

    const q=POOL[0];
    const c=document.createElement("div");
    c.className="card";

    c.innerHTML=`
    <div class="card-q">
        <b>${q.id}</b><br>
        <span style="opacity:.6">${q.domain} • ${q.subdomain}</span><br><br>
        ${format(q.question)}
        <br><br>
        A) ${q.opt_a}<br>
        B) ${q.opt_b}<br>
        C) ${q.opt_c}
    </div>

    <div class="swipe-label sl-up">ANSWER</div>
    <div class="swipe-label sl-left">${q.opt_a}</div>
    <div class="swipe-label sl-right">${q.opt_b}</div>
    <div class="swipe-label sl-down">HINT</div>
    `;
    bindPhysics(c,q);
    s.appendChild(c);
    updateHUD();
}

/* =========================
   PHYSICS (UNCHANGED)
========================= */
function bindPhysics(el,data){
    let sx,sy,dx=0,dy=0,active=false,dir="";
    el.addEventListener("touchstart",e=>{
        active=true;
        sx=e.touches[0].clientX;
        sy=e.touches[0].clientY;
        el.style.transition="none";
    },{passive:false});

    el.addEventListener("touchmove",e=>{
        if(!active) return;
        e.preventDefault();
        dx=e.touches[0].clientX-sx;
        dy=e.touches[0].clientY-sy;
        el.style.transform=`translate(${dx}px,${dy}px) rotate(${dx/20}deg)`;
        const ang=Math.atan2(-dy,dx)*180/Math.PI;
        dir=(ang>45&&ang<135)?"UP":(ang<-45&&ang>-135)?"DOWN":(ang>135||ang<-135)?"LEFT":"RIGHT";
    },{passive:false});

    el.addEventListener("touchend",()=>{
        if(!active) return;
        active=false;
        if(Math.abs(dx)>60||Math.abs(dy)>60) route(el,data,dir);
        else resetCard(el);
    });
}

/* =========================
   ROUTING
========================= */
function route(el,data,dir){
    if(dir==="DOWN"){
        openOverlay(data);
        resetCard(el);
        return;
    }
    if(dir==="UP" && data.answer==="OPT_A") SCORE+=10;
    POOL.shift(); INDEX++;
    renderNext();
}

function resetCard(el){
    el.style.transition="0.4s";
    el.style.transform="none";
}

/* =========================
   OVERLAY
========================= */
function openOverlay(d){
    document.getElementById("overlay-content").innerHTML=
    `<b>LOGIC</b><br>${format(d.logic)}<br><br><b>HINT</b><br>${format(d.hint)}`;
    document.getElementById("global-overlay").classList.add("active");
}
function closeOverlay(){
    document.getElementById("global-overlay").classList.remove("active");
}

/* =========================
   HUD
========================= */
function updateHUD(){
    document.getElementById("p-text").innerText=`${INDEX}/20`;
    document.getElementById("score-text").innerText=`${SCORE} XP`;
    document.getElementById("progress-bar").style.width=`${INDEX/20*100}%`;
}

function renderEnd(){
    document.getElementById("stack").innerHTML=
    `<div class="card"><div class="card-q">COMPLETE</div></div>`;
}
