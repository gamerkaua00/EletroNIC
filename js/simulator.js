// --- SIMULATOR LOGIC ---
function updateGateLogic() {
    const gate = document.getElementById('gate-selector').value;
    const a = document.getElementById('inputA').checked, b = document.getElementById('inputB').checked;
    document.getElementById('inputB-container').style.opacity = gate === 'NOT' ? '0.2' : '1';
    let res = false;
    if(gate==='AND') res=a&&b; else if(gate==='OR') res=a||b; else if(gate==='NOT') res=!a;
    else if(gate==='NAND') res=!(a&&b); else if(gate==='NOR') res=!(a||b); else if(gate==='XOR') res=a!==b; else if(gate==='XNOR') res=a===b;
    const led = document.getElementById('outputLed');
    led.style.backgroundColor = res ? 'var(--success)' : '#333';
    led.style.boxShadow = res ? '0 0 20px var(--success)' : 'inset 0 2px 5px rgba(0,0,0,0.5)';
    document.getElementById('logic-text').innerHTML = `<span style="color:var(--accent)">${a?1:0}</span> ${gate} <span style="color:var(--accent)">${gate==='NOT'?'':(b?1:0)}</span> = <span style="color:${res?'var(--success)':'var(--danger)'}">${res?1:0}</span>`;
    
    let svg = `<svg viewBox="0 0 100 60" style="width:100%;height:100%"><defs><filter id="glow"><feGaussianBlur stdDeviation="1.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    svg += `<path d="M10,20 L30,20" stroke="var(--text-muted)" stroke-width="2"/>`;
    if(gate!=='NOT') svg += `<path d="M10,40 L30,40" stroke="var(--text-muted)" stroke-width="2"/>`;
    svg += `<text x="50" y="35" fill="var(--primary)" font-weight="bold" font-family="Arial" text-anchor="middle" dominant-baseline="middle" font-size="14">${gate}</text>`;
    svg += `<rect x="30" y="10" width="40" height="40" rx="5" fill="none" stroke="var(--primary)" stroke-width="2" filter="url(#glow)"/>`;
    svg += `<path d="M70,30 L90,30" stroke="${res?'var(--success)':'var(--text-muted)'}" stroke-width="2"/>`;
    svg += `</svg>`;
    document.getElementById('gate-svg').innerHTML = svg;
}
