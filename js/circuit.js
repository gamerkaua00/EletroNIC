// --- DRAWING ENGINE ---
function sendToCircuit(s) {
    let e = (s === 'kmap') ? lastCalculatedEquation : document.getElementById('custom-expression').value;
    if(!e) e = "0"; if(e.startsWith("Y = ")) e = e.substring(4);
    document.getElementById('circuit-expression-display').innerText = e;
    document.querySelectorAll('.nav-btn')[3].click(); setTimeout(()=>drawCircuit(e), 100);
}

function drawCircuit(expr) {
    const canvas = document.getElementById('circuit-canvas');
    canvas.style.width = '100%'; canvas.style.height = '100%';
    let clean = expr.replace(/\s/g, '');
    if(clean==='0'||clean==='1') { 
        const ctx = setupCanvas(canvas); ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.font="bold 20px Arial"; ctx.fillStyle="#333"; ctx.fillText("Saída Constante: "+clean,50,50); return; 
    }
    let terms = []; let lvl = 0, buff = "";
    for(let char of clean) { 
        if(char==='(') lvl++; else if(char===')') lvl--; 
        if(char==='+' && lvl===0){ if(buff) terms.push(buff); buff=""; } else buff+=char; 
    }
    if(buff) terms.push(buff);

    const railX = { 'A': 30, 'B': 50, 'C': 70, 'D': 90 };
    const startGateX = 140, gateStepX = 60, rowHeight = 70;
    let maxDepth = 1;
    terms.forEach(t => { let lits = (t.match(/[A-D]/g) || []).length; if(lits > 2) maxDepth = Math.max(maxDepth, lits - 1); });
    let orDepth = terms.length > 1 ? terms.length - 1 : 0;
    
    const totalWidth = Math.max(380, startGateX + (maxDepth * gateStepX) + (orDepth * gateStepX) + 100);
    const totalHeight = Math.max(350, (terms.length * rowHeight) + 100);
    canvas.style.width = totalWidth + 'px'; canvas.style.height = totalHeight + 'px';
    const ctx = setupCanvas(canvas);
    
    ctx.lineWidth = 2; ctx.font = "bold 12px Arial";
    ['A','B','C','D'].forEach(v => {
        ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(railX[v], 20); ctx.lineTo(railX[v], totalHeight - 20); ctx.stroke();
        ctx.fillStyle = '#2563eb'; ctx.fillText(v, railX[v]-4, 15);
    });

    const termOutputs = []; let currentY = 50;
    terms.forEach(term => {
        let lits = [];
        // RESOLUÇÃO DE PORTA INCORRETA: Avalia se o bloco interno contém "+" para definir OR, senão assume AND por produto implícito
        let gateType = term.includes('+') ? 'OR' : 'AND';
        
        if(term.includes('\u2295')) { 
            gateType = 'XOR';
            term.split('\u2295').forEach(p => { const m = p.match(/([A-D])('?)/); if(m) lits.push({c:m[1], n:m[2]==="'"}); });
        } else if(term.includes('\u2299')) {
            gateType = 'XNOR';
            term.split('\u2299').forEach(p => { const m = p.match(/([A-D])('?)/); if(m) lits.push({c:m[1], n:m[2]==="'"}); });
        } else {
             const m = term.matchAll(/([A-D])('?)/g); for(const i of m) lits.push({c:i[1], n:i[2]==="'"});
        }
        if(lits.length === 0) return;
        let curX = startGateX;
        if (lits.length === 1 && !term.includes('\u2295') && !term.includes('\u2299')) {
            drawWire(ctx, railX[lits[0].c], currentY, curX, currentY, lits[0].n); termOutputs.push({x: curX, y: currentY});
        } else {
            drawWire(ctx, railX[lits[0].c], currentY-10, curX, currentY-10, lits[0].n);
            drawWire(ctx, railX[lits[1].c], currentY+10, curX, currentY+10, lits[1].n);
            drawGateSimple(ctx, gateType, curX, currentY); curX += gateStepX; 
            for(let i=2; i<lits.length; i++) {
                ctx.strokeStyle = '#475569'; ctx.beginPath(); ctx.moveTo(curX - gateStepX + 20, currentY); ctx.lineTo(curX, currentY - 10); ctx.stroke();
                drawWire(ctx, railX[lits[i].c], currentY+20, curX, currentY+10, lits[i].n); 
                drawGateSimple(ctx, gateType, curX, currentY); curX += gateStepX;
            }
            termOutputs.push({x: curX - gateStepX + 20, y: currentY}); 
        } currentY += rowHeight;
    });

    if (termOutputs.length === 1) {
        ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.moveTo(termOutputs[0].x, termOutputs[0].y); ctx.lineTo(termOutputs[0].x + 40, termOutputs[0].y); ctx.stroke();
        ctx.fillStyle = '#000'; ctx.fillText("Y", termOutputs[0].x + 45, termOutputs[0].y + 4);
    } else {
        let curX = 0; termOutputs.forEach(t => curX = Math.max(curX, t.x)); curX += 40; 
        let prevOutPoint = {x: termOutputs[0].x, y: termOutputs[0].y};
        for(let i=1; i<termOutputs.length; i++) {
            let nextTerm = termOutputs[i];
            let gateY = (i===1) ? (termOutputs[0].y + termOutputs[1].y)/2 : nextTerm.y;
            drawOrthogonalWire(ctx, prevOutPoint.x, prevOutPoint.y, curX, gateY - 10);
            drawOrthogonalWire(ctx, nextTerm.x, nextTerm.y, curX, gateY + 10);
            drawGateSimple(ctx, 'OR', curX, gateY);
            prevOutPoint = {x: curX + 20, y: gateY}; curX += gateStepX; 
        }
        ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.moveTo(prevOutPoint.x, prevOutPoint.y); ctx.lineTo(prevOutPoint.x + 30, prevOutPoint.y); ctx.stroke();
        ctx.fillStyle = '#000'; ctx.fillText("Y", prevOutPoint.x + 35, prevOutPoint.y + 5);
    }
}

function drawWire(ctx, x1, y1, x2, y2, inverted) {
    ctx.fillStyle = '#2563eb'; ctx.beginPath(); ctx.arc(x1, y1, 3, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y1);
    if (Math.abs(y1 - y2) < 2) { ctx.lineTo(x2, y2); } else { ctx.lineTo(x2 - 15, y1); ctx.lineTo(x2 - 15, y2); ctx.lineTo(x2, y2); }
    ctx.stroke();
    if (inverted) {
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x2 - 5, y2, 3, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    }
}

function drawOrthogonalWire(ctx, x1, y1, x2, y2) {
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y1);
    let midX = (x1 + x2) / 2; ctx.lineTo(midX, y1); ctx.lineTo(midX, y2); ctx.lineTo(x2, y2); ctx.stroke();
}

function drawGateSimple(ctx, type, x, y) {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    if (type === 'AND' || type === 'NAND') {
        ctx.beginPath(); ctx.moveTo(x, y-15); ctx.lineTo(x+15, y-15); ctx.arc(x+15, y, 15, -Math.PI/2, Math.PI/2); ctx.lineTo(x, y+15); ctx.lineTo(x, y-15); ctx.fill(); ctx.stroke();
        if(type === 'NAND') { ctx.beginPath(); ctx.arc(x+33, y, 3, 0, 2*Math.PI); ctx.fill(); ctx.stroke(); }
    } else if (type === 'OR' || type === 'NOR') {
        ctx.beginPath(); ctx.moveTo(x, y-15); ctx.quadraticCurveTo(x+15, y-15, x+30, y); ctx.quadraticCurveTo(x+15, y+15, x, y+15); ctx.quadraticCurveTo(x+10, y, x, y-15); ctx.fill(); ctx.stroke();
        if(type === 'NOR') { ctx.beginPath(); ctx.arc(x+33, y, 3, 0, 2*Math.PI); ctx.fill(); ctx.stroke(); }
    } else if (type === 'XOR' || type === 'XNOR') {
        ctx.beginPath(); ctx.moveTo(x-5, y-15); ctx.quadraticCurveTo(x+5, y, x-5, y+15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y-15); ctx.quadraticCurveTo(x+15, y-15, x+30, y); ctx.quadraticCurveTo(x+15, y+15, x, y+15); ctx.quadraticCurveTo(x+10, y, x, y-15); ctx.fill(); ctx.stroke();
        if(type === 'XNOR') { ctx.beginPath(); ctx.arc(x+33, y, 3, 0, 2*Math.PI); ctx.fill(); ctx.stroke(); }
    }
}
