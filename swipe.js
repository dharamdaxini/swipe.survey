/* --- ALCHEMIST V91.1 OMNI-LOOP ENGINE --- */

// ... [Keep Parser and Initialization Logic from V90.0] ...

/* 1. UPDATED END SLIDE RENDERER */
function renderEnd() {
    MODE = "END"; 
    const s = document.getElementById('stack'); 
    s.innerHTML = ""; 
    const c = document.createElement('div'); 
    c.className = "card";
    
    document.getElementById('rank-ui').innerText = "COMPLETE";
    const mistakesCount = MISTAKES.length;
    
    c.innerHTML = `
        <div class="card-q">
            MISSION COMPLETE<br>
            <span style="color:var(--gold); font-size:1.8rem">${SCORE} XP</span><br>
            <span style="color:#555; font-size:0.8rem; font-family:var(--font-code)">${mistakesCount} GAPS DETECTED</span>
        </div>
        <div class="swipe-label sl-up">RESTART</div>
        <div class="swipe-label sl-left">MENU</div>
        <div class="swipe-label sl-right" style="color:var(--green)">LEVEL UP</div>
        <div class="swipe-label sl-down" style="color:${mistakesCount > 0 ? 'var(--blue)' : '#333'}">
            ${mistakesCount > 0 ? 'REVIEW MISTAKES' : 'EXIT'}
        </div>`;
    
    s.appendChild(c); 
    bindPhysics(c, {});
}

/* 2. UPDATED ACTION HANDLER (THE LOOP LOGIC) */
function handleAction(el, data, dir) {
    // Menu States
    if(MODE === "DATASET_SELECT") { renderTopicSelect(dir === "UP"?"SET_A":dir === "LT"?"SET_B":dir === "RT"?"SET_C":"SET_D"); return; }
    if(MODE === "TOPIC_SELECT") { renderGenreSelect(dir === "UP"?"Physical":dir === "LT"?"Organic":dir === "RT"?"Inorganic":"Analytical"); return; }
    if(MODE === "GENRE_SELECT") { renderRangeSelect(dir === "UP"?"CONCEPT":dir === "LT"?"MATH":dir === "RT"?"DATA":"LOGIC"); return; }
    if(MODE === "RANGE_SELECT") { startQuiz(dir==="UP"?10:dir==="LT"?20:dir==="RT"?30:50); return; }

    // End Slide Loop Logic
    if(MODE === "END") { 
        if(dir === "UP") { 
            startQuiz(SESSION_LIMIT); // Restart Same
        } else if(dir === "LT") { 
            renderDatasetSelect(); // Main Menu
        } else if(dir === "RT") { 
            // Level Up logic
            CUR_DATASET = NEXT_LEVEL[CUR_DATASET] || "SET_A";
            startQuiz(SESSION_LIMIT); 
        } else if(dir === "DN") { 
            if(MISTAKES.length > 0) {
                // Intelligent Review Mode
                POOL = [...MISTAKES];
                MISTAKES = [];
                CUR_INDEX = 1;
                SESSION_LIMIT = POOL.length;
                MODE = "QUIZ";
                renderNext();
            } else {
                location.reload(); // Exit/Reset
            }
        }
        return;
    }

    // Standard Quiz Logic
    if (dir === "DN") { el.querySelector('.overlay').classList.add('active'); el.style.transform="none"; return; }
    
    const actualDir = dir.replace('LT','LEFT').replace('RT','RIGHT');
    const isCorrect = actualDir === data.c;
    
    if (isCorrect) { 
        SCORE += 10; 
        document.getElementById('xp-ui').innerText = SCORE + " XP"; 
    } else {
        // Prevent duplicate mistakes in the review pool
        if(!MISTAKES.find(m => m.id === data.id)) MISTAKES.push(data);
    }
    
    POOL.shift(); 
    CUR_INDEX++; 
    renderNext();
}
