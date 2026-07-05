// --- DRAWING ENGINE (TURBINADO ANTI-SOBREPOSIÇÃO) ---
function sendToCircuit(s) {
    let e = (s === 'kmap') ? lastCalculatedEquation : document.getElementById('custom-expression').value;
    if(!e) e = "0"; if(e.startsWith("Y = ")) e = e.substring(4);
    document.getElementById('circuit-expression-display').innerText = e;
    document.querySelectorAll('.nav-btn')[3].click(); setTimeout(()=>drawCircuit(e), 100);
}

function normalizeCircuitExpression(expr) {
    let clean = expr.toUpperCase().replace(/\s+/g, '');
    
    // Limpeza de parênteses soltos do KMap
    clean = clean.replace(/\(([A-D])\)'/g, "$1'");
    clean = clean.replace(/\(([A-D])\)/g, "$1");
    
    // Padronização da inversão
    while (clean.includes("'")) {
        const idx = clean.indexOf("'");
        if (idx > 0) {
            let start = idx - 1;
            if (clean[start] === ')') {
                let depth = 1; start--;
                while (start >= 0 && depth > 0) {
                    if (clean[start] === ')') depth++;
                    else if (clean[start] === '(') depth--;
                    start--;
                }
                start++;
                let inner = clean.substring(start + 1, idx - 1);
                if (inner.length === 1 && /[A-D]/.test(inner)) {
                    clean = clean.substring(0, start) + '!' + inner + clean.substring(idx + 1);
                } else {
                    clean = clean.substring(0, start) + '!(' + inner + ')' + clean.substring(idx + 1);
                }
            } else if (/[A-D0-1]/.test(clean[start])) {
                clean = clean.substring(0, start) + '!' + clean[start] + clean.substring(idx + 1);
            } else {
                clean = clean.replace("'", "");
            }
        } else {
            clean = clean.replace("'", "");
        }
    }
    
    clean = clean.replace(/([A-D!)]+)(?=[A-D!(])/g, '$1*');
    clean = clean.replace(/!\(([A-D])\)/g, '!$1');
    return clean;
}

function drawCircuit(expr) {
    const canvas = document.getElementById('circuit-canvas');
    canvas.style.width = '100%'; canvas.style.height = '100%';
    
    let clean = normalizeCircuitExpression(expr);
    
    if(clean==='0'||clean==='1') { 
        const ctx = setupCanvas(canvas); ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.font="bold 20px Arial"; ctx.fillStyle="#333"; ctx.fillText("Saída Constante: "+clean,50,50); return; 
    }
    
    let terms = []; let lvl = 0, buff = "";
    let topLevelOp = '+'; 
    let hasTopOr = false;
    
    for(let char of clean) { 
        if(char==='(') lvl++; 
        else if(char===')') lvl--; 
        if (lvl === 0 && char === '+') hasTopOr = true;
    }
    
    if (!hasTopOr && clean.includes('*')) {
        topLevelOp = '*';
    }

    lvl = 0; buff = "";
    for(let char of clean) { 
        if(char==='(') lvl++; 
        else if(char===')') lvl--; 
        
        if(char === topLevelOp && lvl === 0){ 
            if(buff) terms.push(buff); buff=""; 
        } else {
            buff += char; 
        }
    }
    if(buff) terms.push(buff);

    // Ajuste nos trilhos verticais para dar maior espaçamento inicial
    const railX = { 'A': 35, 'B': 60, 'C': 85, 'D': 110 };
    const startGateX = 160, gateStepX = 75, rowHeight = 85;
    
    let maxDepth = 1;
    terms.forEach(t => { let lits = (t.match(/[A-D]/g) || []).length; if(lits > 2) maxDepth = Math.max(maxDepth, lits - 1); });
    let orDepth = terms.length > 1 ? terms.length - 1 : 0;
    
    // Dimensionamento do Canvas expandido para evitar quebras de borda
    const totalWidth = Math.max(480, startGateX + (maxDepth * gateStepX) + (orDepth * gateStepX) + 120);
    const totalHeight = Math.max(380, (terms.length * rowHeight) + 110);
    canvas.style.width = totalWidth + 'px'; canvas.style.height = totalHeight + 'px';
    const ctx = setupCanvas(canvas);
    
    ctx.lineWidth = 2; ctx.font = "bold 13px Arial";
    ['A','B','C','D'].forEach(v => {
        ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(railX[v], 25); ctx.lineTo(railX[v], totalHeight - 25); ctx.stroke();
        ctx.fillStyle = '#2563eb'; ctx.fillText(v, railX[v]-4, 18);
    });

    const termOutputs = []; let currentY = 65;
    
    terms.forEach((term, termIdx) => {
        let lits = [];
        let localGateType = 'AND';
        if (topLevelOp === '*') {
            if (term.includes('+')) localGateType = 'OR';
        } else {
            if (term.includes('*')) localGateType = 'AND';
        }

        if(term.includes('\u2295')) { 
            localGateType = 'XOR';
            term.split('\u2295').forEach(p => { const m = p.match(/([A-D])/); if(m) lits.push({c:m[1], n:p.includes('!')}); });
        } else if(term.includes('\u2299')) {
            localGateType = 'XNOR';
            term.split('\u2299').forEach(p => { const m = p.match(/([A-D])/); if(m) lits.push({c:m[1], n:p.includes('!')}); });
        } else {
            ['A','B','C','D'].forEach(v => {
                if (term.includes(v)) {
                    let isNegated = false;
                    let vIdx = term.indexOf(v);
                    if (vIdx > 0 && term[vIdx - 1] === '!') isNegated = true;
                    lits.push({ c: v, n: isNegated });
                }
            });
            lits.sort((x, y) => railX[x.c] - railX[y.c]);
        }
        
        if(lits.length === 0) return;
        let curX = startGateX;
        
        if (lits.length === 1 && localGateType === 'AND') {
            let lit = lits[0];
            if (lit.n) {
                drawWire(ctx, railX[lit.c], currentY, curX, currentY, false, termIdx);
                drawGateSimple(ctx, 'NOT', curX, currentY);
                termOutputs.push({x: curX + 20, y: currentY});
            } else {
                drawWire(ctx, railX[lit.c], currentY, curX, currentY, false, termIdx);
                termOutputs.push({x: curX, y: currentY});
            }
        } else {
            // TURBINADO: Injeta offsets verticais simétricos (-12 e +12) para os pinos de entrada não colarem
            drawWire(ctx, railX[lits[0].c], currentY - 12, curX, currentY - 12, lits[0].n, termIdx);
            drawWire(ctx, railX[lits[1].c], currentY + 12, curX, currentY + 12, lits[1].n, termIdx + 1);
            
            drawGateSimple(ctx, localGateType, curX, currentY);
            curX += gateStepX; 
            
            for(let i=2; i<lits.length; i++) {
                ctx.strokeStyle = '#475569'; ctx.beginPath();
                ctx.moveTo(curX - gateStepX + 20, currentY); 
                ctx.lineTo(curX, currentY - 12); 
                ctx.stroke();

                drawWire(ctx, railX[lits[i].c], currentY + 22, curX, currentY + 12, lits[i].n, termIdx + i); 
                
                drawGateSimple(ctx, localGateType, curX, currentY);
                curX += gateStepX;
            }
            termOutputs.push({x: curX - gateStepX + 20, y: currentY}); 
        } currentY += rowHeight;
    });

    if (termOutputs.length === 1) {
        ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.moveTo(termOutputs[0].x, termOutputs[0].y); ctx.lineTo(termOutputs[0].x + 50, termOutputs[0].y); ctx.stroke();
        ctx.fillStyle = '#000'; ctx.fillText("Y", termOutputs[0].x + 55, termOutputs[0].y + 4);
    } else {
        let curX = 0; termOutputs.forEach(t => curX = Math.max(curX, t.x)); curX += 45; 
        let prevOutPoint = {x: termOutputs[0].x, y: termOutputs[0].y};
        let finalGateType = topLevelOp === '+' ? 'OR' : 'AND';

        for(let i=1; i<termOutputs.length; i++) {
            let nextTerm = termOutputs[i];
            let gateY = (i===1) ? (termOutputs[0].y + termOutputs[1].y)/2 : nextTerm.y;
            
            // TURBINADO: Envia o índice 'i' para criar dobras ortogonais paralelas sem nenhuma sobreposição
            drawOrthogonalWire(ctx, prevOutPoint.x, prevOutPoint.y, curX, gateY - 12, i);
            drawOrthogonalWire(ctx, nextTerm.x, nextTerm.y, curX, gateY + 12, i + 1);
            
            drawGateSimple(ctx, finalGateType, curX, gateY);
            prevOutPoint = {x: curX + 20, y: gateY}; curX += gateStepX; 
        }
        ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.moveTo(prevOutPoint.x, prevOutPoint.y); ctx.lineTo(prevOutPoint.x + 40, prevOutPoint.y); ctx.stroke();
        ctx.fillStyle = '#000'; ctx.fillText("Y", prevOutPoint.x + 45, prevOutPoint.y + 5);
    }
}

// TURBINADO: Usa um fator de offset baseado no índice da linha para evitar sobreposição total nos canais
function drawWire(ctx, x1, y1, x2, y2, inverted, lineIdx = 0) {
    ctx.fillStyle = '#2563eb'; ctx.beginPath(); ctx.arc(x1, y1, 3.5, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y1);
    
    if (Math.abs(y1 - y2) < 2) { 
        ctx.lineTo(x2, y2); 
    } else { 
        // Desvio dinâmico calibrado para canais de descida paralelos isolados
        let safeOffset = 14 + (lineIdx * 5);
        ctx.lineTo(x2 - safeOffset, y1); 
        ctx.lineTo(x2 - safeOffset, y2); 
        ctx.lineTo(x2, y2); 
    }
    ctx.stroke();
    if (inverted) {
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x2 - 5, y2, 2.5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    }
}

// TURBINADO: Divide o ponto médio usando canais escalonados para dobras ortogonais limpas
function drawOrthogonalWire(ctx, x1, y1, x2, y2, channelIdx = 1) {
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y1);
    
    // Altera sutilmente o ponto X da dobra baseado no canal do termo
    let spacingFactor = 0.4 + (channelIdx * 0.05);
    let midX = x1 + (x2 - x1) * spacingFactor;
    
    ctx.lineTo(midX, y1); ctx.lineTo(midX, y2); ctx.lineTo(x2, y2); ctx.stroke();
}

function drawGateSimple(ctx, type, x, y) {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    if (type === 'AND' || type === 'NAND') {
        ctx.beginPath(); ctx.moveTo(x, y-12); ctx.lineTo(x+12, y-12); ctx.arc(x+12, y, 12, -Math.PI/2, Math.PI/2); ctx.lineTo(x, y+12); ctx.lineTo(x, y-12); ctx.fill(); ctx.stroke();
        if(type === 'NAND') { ctx.beginPath(); ctx.arc(x+27, y, 2.5, 0, 2*Math.PI); ctx.fill(); ctx.stroke(); }
    } else if (type === 'OR' || type === 'NOR') {
        ctx.beginPath(); ctx.moveTo(x, y-12); ctx.quadraticCurveTo(x+12, y-12, x+24, y); ctx.quadraticCurveTo(x+12, y+12, x, y+12); ctx.quadraticCurveTo(x+8, y, x, y-12); ctx.fill(); ctx.stroke();
        if(type === 'NOR') { ctx.beginPath(); ctx.arc(x+27, y, 2.5, 0, 2*Math.PI); ctx.fill(); ctx.stroke(); }
    } else if (type === 'XOR' || type === 'XNOR') {
        ctx.beginPath(); ctx.moveTo(x-4, y-12); ctx.quadraticCurveTo(x+4, y, x-4, y+12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y-12); ctx.quadraticCurveTo(x+12, y-12, x+24, y); ctx.quadraticCurveTo(x+12, y+12, x, y+12); ctx.quadraticCurveTo(x+8, y, x, y-12); ctx.fill(); ctx.stroke();
        if(type === 'XNOR') { ctx.beginPath(); ctx.arc(x+27, y, 2.5, 0, 2*Math.PI); ctx.fill(); ctx.stroke(); }
    } else if (type === 'NOT') {
        ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 12, y); ctx.lineTo(x, y + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + 15, y, 2.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    }
}
