// --- DRAWING ENGINE ---
function sendToCircuit(s) {
    let e = (s === 'kmap') ? lastCalculatedEquation : document.getElementById('custom-expression').value;
    if(!e) e = "0"; if(e.startsWith("Y = ")) e = e.substring(4);
    document.getElementById('circuit-expression-display').innerText = e;
    document.querySelectorAll('.nav-btn')[3].click(); setTimeout(()=>drawCircuit(e), 100);
}

// FAXINA GERAL DE STRINGS: Normaliza os tokens de negação e limpa parênteses espúrios ao redor de variáveis soltas
function normalizeCircuitExpression(expr) {
    let clean = expr.toUpperCase().replace(/\s+/g, '');
    
    // Converte e unifica a lógica de aspas simples (') em inversor formal (!)
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
                // Evita o travamento limpando cascas de parênteses inúteis (ex: (A)' vira !A)
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
    
    // Varre e remove invólucros como !(A), !(B) que o KMap gera e converte para !A, !B
    clean = clean.replace(/!\(([A-D])\)/g, '!$1');
    return clean;
}

function drawCircuit(expr) {
    const canvas = document.getElementById('circuit-canvas');
    canvas.style.width = '100%'; canvas.style.height = '100%';
    
    // Executa a higienização de strings para todas as combinações
    let clean = normalizeCircuitExpression(expr);
    
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
        
        // IDENTIFICAÇÃO DE PORTAS DE TODAS AS CATEGORIAS (Simples e Complexas)
        let gateType = 'AND';
        if (term.includes('+')) gateType = 'OR';
        if (term.includes('\u22BC')) gateType = 'NAND';
        if (term.includes('\u22BD')) gateType = 'NOR';
        if (term.includes('\u2295')) gateType = 'XOR';
        if (term.includes('\u2299')) gateType = 'XNOR';
        
        // Varre de forma explícita as constantes dos caracteres lógicos complexos
        if(gateType === 'XOR') {
            term.split('\u2295').forEach(p => { const m = p.match(/([A-D])/); if(m) lits.push({c:m[1], n:p.includes('!')}); });
        } else if(gateType === 'XNOR') {
            term.split('\u2299').forEach(p => { const m = p.match(/([A-D])/); if(m) lits.push({c:m[1], n:p.includes('!')}); });
        } else if(gateType === 'NAND') {
            term.split('\u22BC').forEach(p => { const m = p.match(/([A-D])/); if(m) lits.push({c:m[1], n:p.includes('!')}); });
        } else if(gateType === 'NOR') {
            term.split('\u22BD').forEach(p => { const m = p.match(/([A-D])/); if(m) lits.push({c:m[1], n:p.includes('!')}); });
        } else {
            // Mapeamento dinâmico para os barramentos estruturados A, B, C e D
            ['A','B','C','D'].forEach(v => {
                if (term.includes(v)) {
                    let isNegated = false;
                    let vIdx = term.indexOf(v);
                    if (vIdx > 0 && term[vIdx - 1] === '!') isNegated = true;
                    lits.push({ c: v, n: isNegated });
                }
            });
            // Ordenação dos pinos para evitar cruzamento de barramentos no Canvas
            lits.sort((x, y) => railX[x.c] - railX[y.c]);
        }
        
        if(lits.length === 0) return;
        let curX = startGateX;
        
        // BLINDAGEM COMPLETA DE VARIÁVEL ÚNICA: Se houver só um termo e for negado, desenha a NOT
        if (lits.length === 1 && gateType === 'AND') {
            let lit = lits[0];
            if (lit.n) {
                drawWire(ctx, railX[lit.c], currentY, curX, currentY, false);
                drawGateSimple(ctx, 'NOT', curX, currentY);
                termOutputs.push({x: curX + 20, y: currentY});
            } else {
                drawWire(ctx, railX[lit.c], currentY, curX, currentY, false);
                termOutputs.push({x: curX, y: currentY});
            }
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
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(x1, y1);
    let midX = (x1 + x2) / 2; ctx.lineTo(midX, y1); ctx.lineTo(midX, y2); ctx.lineTo(x2, y2); ctx.stroke();
}

// ARQUITETURA GEOMÉTRICA DAS PORTAS: Garante os formatos industriais corretos e círculos de negação
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
    } else if (type === 'NOT') {
        ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x + 15, y); ctx.lineTo(x, y + 12); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + 18, y, 3, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    }
}
