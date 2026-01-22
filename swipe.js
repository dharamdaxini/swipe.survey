/* --- ALCHEMIST V82.0 DATA ENGINE --- */

// 1. PASTE YOUR FULL DIRTY DATASET BETWEEN THE BACKTICKS (` `)
// The engine will auto-clean the merged columns.
const RAW_TEXT = `

`;

/* --- THE REFINERY: PARSES & FIXES MASHED DATA --- */
const processRawData = (text) => {
    if(!text) return [];
    
    // Regex matches the pattern even with missing spaces
    // Anchors: ID (SET_..), Direction (UP/RIGHT), Check (❌)
    const regex = /(SET_[A-D]_\d{4})(SET_[A-D])([A-Za-z /]+?)(CONCEPT|MATH|APPLICATION|TROUBLESHOOTING)(.+?)(UP|RIGHT|LEFT|DOWN)(❌.+?)(\.?\d?\.\d+$)/;

    return text.trim().split('\n').map(line => {
        const match = line.match(regex);
        if (!match) return null; // Skip bad lines

        let [_, id, ds, tp, ty, q_blob, dir, expl_blob, weight] = match;

        // 1. FIX MASHED OPTIONS (Heuristic: Split where Lowercase touches Uppercase)
        // "First LawSecond LawZeroth Law" -> "First Law|Second Law|Zeroth Law"
        let optionsRaw = q_blob.split("?").pop(); // Get text after question mark
        let questionClean = q_blob.split("?")[0] + "?";
        
        // Add split markers
        optionsRaw = optionsRaw.replace(/([a-z0-9])([A-Z])/g, '$1|$2');
        let opts = optionsRaw.split('|');
        
        // Fallback if split failed (less than 3 options)
        if (opts.length < 3) opts = ["Option A", "Option B", "Option C"];

        // 2. SEPARATE HINT FROM EXPLANATION
        // "✅ ... maximum.Arrow of Time." -> Split at last period
        let expl = expl_blob;
        let hint = "Think carefully.";
        
        // Find the boundary between Explanation and Hint (usually a period followed by Capital)
        const hintMatch = expl.match(/(✅.+?\.)([A-Z].+)$/);
        if (hintMatch) {
            expl = hintMatch[1];
            hint = hintMatch[2];
        }

        return {
            id: id,
            ds: ds,
            tp: tp,
            ty: ty,
            q: questionClean,
            u: opts[0] || "Yes",
            r: opts[1] || "No",
            l: opts[2] || "Maybe",
            c: dir,
            ex: expl,
            h: hint,
            w: parseFloat(weight)
        };
    }).filter(x => x !== null);
};

// --- INITIALIZE DATA ---
const RAW_DATA = processRawData(RAW_TEXT);

/* --- APP LOGIC BELOW --- */
const ENDPOINT = "https://script.google.com/macros/s/AKfycbwv_n-Q0J0hwRPIzy2D0mx54-fKNDmvKG0kPgZZwoN5xZGloJbAFP-upgMbGfJA-Lk/exec";
const NEXT_LEVEL = { "SET_A": "SET_B", "SET_B": "SET_C", "SET_C": "SET_D", "SET_D": "SET_A" };

let POOL = [], MISTAKES = [], SCORE = 0, isTransitioning = false, startTime = 0;
let MODE = "DATASET_SELECT", CUR_DATASET = "", CUR_TOPIC = "", CUR_GENRE = "";

// ... [The rest of your previous V81.7 JS functions go here: init, startQuiz, etc.] ...
// (I am omitting the repeated logic code to save space, paste the functions from V81.7 here)
