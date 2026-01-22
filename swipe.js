/* V106.3 | MAGNETIC PHYSICS ENGINE */
function bindPhysics(el, data) {
    let x = 0, y = 0, sx = 0, sy = 0, active = false, td = null;
    const lbs = { up: el.querySelector('.sl-up'), dn: el.querySelector('.sl-down'), lt: el.querySelector('.sl-left'), rt: el.querySelector('.sl-right') };
    
    // 1cm radius in pixels (approx 38px for mobile)
    const MAX_RADIUS = 38; 

    el.onmousedown = el.ontouchstart = e => { 
        active = true; 
        const p = e.touches ? e.touches[0] : e; 
        sx = p.clientX; sy = p.clientY; 
        el.style.transition = "none"; 
    };
    
    window.onmousemove = window.ontouchmove = e => { 
        if (!active) return; 
        const p = e.touches ? e.touches[0] : e; 
        let dx = p.clientX - sx; 
        let dy = p.clientY - sy; 
        
        // Calculate current distance from center
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        // Apply 1cm Radius Constraint (Magnetic Tether)
        if (distance > MAX_RADIUS) {
            const ratio = MAX_RADIUS / distance;
            x = dx * ratio;
            y = dy * ratio;
        } else {
            x = dx;
            y = dy;
        }
        
        requestAnimationFrame(() => {
            if (active) {
                // High tilt (divisor 12) for a responsive feel in small movements
                el.style.transform = `translate3d(${x}px,${y}px,0) rotate(${dx/12}deg) scale(1.05)`; 
            }
        });
        
        const ang = Math.atan2(-dy, dx) * (180 / Math.PI);
        Object.values(lbs).forEach(l => { if (l) l.style.opacity = 0; });
        
        // Trigger swipe labels earlier due to small radius
        if (distance > 20) {
            let d = (ang >= 45 && ang < 135) ? "up" : (ang >= 135 || ang < -135) ? "lt" : (ang >= -135 && ang < -45) ? "dn" : "rt";
            if (lbs[d]) lbs[d].style.opacity = 1; 
            td = d.toUpperCase();
        }
    };
    
    window.onmouseup = window.ontouchend = e => { 
        if (!active) return; 
        active = false; 
        
        const p = e.changedTouches ? e.changedTouches[0] : e;
        const finalDist = Math.sqrt(Math.pow(p.clientX - sx, 2) + Math.pow(p.clientY - sy, 2));

        // Threshold to execute action (If pulled near the 1cm limit)
        if (finalDist > 30) {
            handleAction(el, data, td);
        } else { 
            el.style.transition = "transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)"; 
            el.style.transform = "none"; 
        } 
    };
}
