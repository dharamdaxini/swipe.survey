<script>
/* ============================================================
   ALCHEMIST FINAL BACKEND ENGINE
   - Hard resets stale data
   - Version-gated storage
   - Clean master.json ingestion
   - Safe boot (never stuck)
============================================================ */

/* ================= CONFIG ================= */
const MASTER_URL =
  "https://raw.githubusercontent.com/dharamdaxini/swipe.survey/e939bcc47c331c43fb8875e3a77f1125329a3810/master.json";

const USER_KEY = "ALCHEMIST_DATA_V1";
const VERSION_KEY = "ALCHEMIST_VERSION";
const APP_VERSION = "v136.17";

/* ================= UI ================= */
const UI = {
  stack: document.getElementById("stack"),
  id: document.getElementById("id-ui"),
  xp: document.getElementById("xp-ui"),
  bar: document.getElementById("progress-bar"),
  review: document.getElementById("review-text")
};

/* ================= STATE ================= */
let RAW_DATA = [];
let MASTER_DATA = [];
let USER_DATA = [];

let SET_CURSOR = 0;
let ACTIVE_SET = null;
let POOL = [];
let WRONG = [];
let REVIEW_INDEX = 0;
let SESSION_ALL = [];
let XP = 0;
let VOLUME_LIMIT = null;
let ATTEMPTED = new Set();

/* ================= VERSION ENFORCEMENT ================= */
(function enforceVersion(){
  const v = localStorage.getItem(VERSION_KEY);
  if(v !== APP_VERSION){
    localStorage.removeItem(USER_KEY);
    localStorage.setItem(VERSION_KEY, APP_VERSION);
  }
})();

/* ================= UTILS ================= */
function chemText(t){
  if(!t) return "";
  return String(t)
    .replace(/_([0-9]+)/g,"<sub>$1</sub>")
    .replace(/\^([0-9+\-]+)/g,"<sup>$1</sup>")
    .replace(/<->|↔|\\rightleftharpoons/g,"⇌");
}

function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

/* ================= DATA NORMALIZATION ================= */
function normalize(d){
  if(!d || !d.id || !d.q || !d.u || !d.l || !d.r) return null;

  let c = d.correct;
  if(c==="UP"||c==="A") c=d.u;
  else if(c==="LEFT"||c==="B") c=d.l;
  else if(c==="RIGHT"||c==="C") c=d.r;

  return {
    id: String(d.id),
    set: d.set || "SET_A",
    dom: d.dom || "GENERAL",
    topic: d.topic || "",
    q: d.q,
    u: d.u,
    l: d.l,
    r: d.r,
    correct: c || d.u,
    logic: d.logic || "",
    hint: d.hint || "",
    trap: d.trap || "",
    step1: d.step1 || "",
    step2: d.step2 || ""
  };
}

/* ================= RENDER ================= */
function card(text, labels, cb){
  UI.stack.innerHTML="";
  const el=document.createElement("div");
  el.className="card";
  el.innerHTML=`
    <div class="card-q">${chemText(text).replace(/\n/g,"<br>")}</div>
    <div class="swipe-label sl-up">${labels.up||""}</div>
    <div class="swipe-label sl-left">${labels.left||""}</div>
    <div class="swipe-label sl-right">${labels.right||""}</div>
    <div class="swipe-label sl-down">${labels.down||""}</div>
  `;
  UI.stack.appendChild(el);
  new PhysicsController(el,{onCommit:cb});
}

/* ================= FLOW ================= */
function begin(){
  UI.review.textContent="";
  card(
    "BEGIN SESSION",
    {up:"QUIZ",down:"MY PDF",left:"RAPID",right:"LEARN"},
    dir=>{ if(dir==="UP") setPick(); }
  );
}

function setPick(){
  const sets=[...new Set(RAW_DATA.map(d=>d.set))];
  if(!sets.length){
    card("NO DATA",{down:"RETRY"},begin);
    return;
  }
  card(
    sets[SET_CURSOR],
    {up:"SELECT",down:"BACK"},
    dir=>{
      if(dir==="UP"){ACTIVE_SET=sets[SET_CURSOR];startQuiz();}
      if(dir==="DOWN") begin();
    }
  );
}

function startQuiz(){
  POOL=shuffle(RAW_DATA.filter(d=>d.set===ACTIVE_SET));
  WRONG=[];
  SESSION_ALL=[];
  XP=0;
  ATTEMPTED.clear();
  nextQ();
}

function nextQ(){
  UI.review.textContent="";
  if(!POOL.length){ begin(); return; }

  const d=POOL.shift();
  UI.id.textContent=d.id;
  SESSION_ALL.push(d);

  const opts=shuffle([d.u,d.l,d.r]);
  card(
    d.q,
    {up:opts[0],left:opts[1],right:opts[2]},
    ()=>nextQ()
  );
}

/* ================= INIT ================= */
async function init(){
  try{
    USER_DATA=JSON.parse(localStorage.getItem(USER_KEY)||"[]");
  }catch{
    USER_DATA=[];
  }

  try{
    const r=await fetch(MASTER_URL,{cache:"no-store"});
    MASTER_DATA=await r.json();
  }catch{
    MASTER_DATA=[];
  }

  RAW_DATA=[
    ...MASTER_DATA.map(normalize).filter(Boolean),
    ...USER_DATA.map(normalize).filter(Boolean)
  ];

  begin();
}

init();
</script>
