const QUESTIONS = [
            // --- LEVEL 1: EASY (Confidence Builders) ---
            { 
                id: "e1", topic: "Geography", type: "FACT", 
                text: "The IMEC corridor is designed to connect India to Europe via the Middle East.", 
                up:"True", down:"False", right:"Unsure", left:"Skip", correct:"up", w:1 
            },
            { 
                id: "e2", topic: "Energy", type: "FACT", 
                text: "India has officially committed to Net Zero emissions by the year 2050.", 
                up:"True", down:"False", right:"2070", left:"Skip", correct:"right", w:1 
            },
            { 
                id: "e3", topic: "Defense", type: "FACT", 
                text: "The INS Vikrant is India's first indigenous aircraft carrier.", 
                up:"True", down:"False", right:"Imported", left:"Skip", correct:"up", w:1 
            },

            // --- LEVEL 2: MEDIUM (Requires News Awareness) ---
            { 
                id: "m1", topic: "Semiconductors", type: "CONTEXT", 
                text: "The Micron plant in Gujarat is primarily focused on packaging (ATMP), not full fabrication.", 
                up:"True", down:"False", right:"Fab", left:"Skip", correct:"up", w:2 
            },
            { 
                id: "m2", topic: "Finance", type: "TRAP", 
                text: "UPI is now accepted for domestic payments in every G20 nation.", 
                up:"True", down:"False", right:"Select Few", left:"Skip", correct:"right", w:2 
            },
            { 
                id: "m3", topic: "Space", type: "REASONING", 
                text: "The Gaganyaan mission's primary delay was due to launch vehicle unavailability.", 
                up:"True", down:"False", right:"Safety Tests", left:"Skip", correct:"right", w:2 
            },

            // --- LEVEL 3: HARD (Specific 2026 Convergence Logic) ---
            { 
                id: "h1", topic: "Trade", type: "TRAP", 
                text: "India has finalized a full Free Trade Agreement (FTA) with the UK as of Jan 2026.", 
                up:"Signed", down:"Stalled", right:"Draft Only", left:"Skip", correct:"right", w:3 
            },
            { 
                id: "h2", topic: "Nuclear", type: "FACT", 
                text: "The PFBR at Kalpakkam (Fast Breeder Reactor) achieved criticality in 2025.", 
                up:"True", down:"False", right:"Delayed", left:"Skip", correct:"up", w:3 
            },
            { 
                id: "h3", topic: "Geopolitics", type: "REASONING", 
                text: "India's non-alignment strategy has shifted to 'Multi-alignment' to secure lithium supply chains.", 
                up:"Agree", down:"Disagree", right:"Unrelated", left:"Skip", correct:"up", w:3 
            }
        ];
