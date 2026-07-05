// --- DRAWING ENGINE REVISADO ---
function sendToCircuit(s) {
    let e = (s === 'kmap') ? lastCalculatedEquation : document.getElementById('custom-expression').value;
    if(!e) e = "0"; if(e.startsWith("Y = ")) e = e.substring(4);
    document.getElementById('circuit-expression-display').innerText = e;
    document.querySelectorAll('.nav-btn')[3].click(); setTimeout(()=>drawCircuit(e), 100);
}

function normalizeCircuitExpression(expr) {
    let clean = expr.toUpperCase().replace(/\s+/g, '');
    clean = clean.replace(/\(([A-D])\)'/g, "$1'");
    clean = clean.replace(/\(([A-D])\)/g, "$1");
    
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

function parseToTree(expr) {
    let clean = expr.trim();
    while (clean.startsWith('(') && clean.endsWith(')')) {
        let lvl = 0, match = true;
        for (let i = 0; i < clean.length - 1; i++) {
            if (clean[i] === '(') lvl++;
            else if (clean[i] === ')') lvl--;
            if (lvl === 0 && i > 0) { match = false; break; }
        }
        if (match) clean = clean.substring(1, clean.length - 1).trim();
        else break;
    }

    const findTopOperator = (str, opTokens) => {
        let lvl = 0;
        for (let i = str.length - 1; i >= 0; i--) {
            if (str[i] === ')') lvl++;
            else if (str[i] === '(') lvl--;
            if (lvl === 0 && opTokens.includes(str[i])) return i;
        }
        return -1;
    };

    let opIdx = findTopOperator(clean, ['+']);
    if (opIdx === -1) opIdx = findTopOperator(clean, ['*', '\u22BC', '\u22BD', '\u2295', '\u2299']);

    if (opIdx !== -1) {
        let op = clean[opIdx];
        let type = op === '+' ? 'OR' : op === '*' ? 'AND' : op === '\u22BC' ? 'NAND' : op === '\u22BD' ? 'NOR' : op === '\u2295' ? 'XOR' : 'XNOR';
        return {
            type: type,
            left: parseToTree(clean.substring(0, opIdx)),
            right: parseToTree(clean.substring(opIdx + 1))
        };
    }

    if (clean.startsWith('!')) {
        return { type: 'NOT', center: parseToTree(clean.substring(1)) };
    }

    return { type: 'LITERAL', val: clean };
}

function drawCircuit(expr) {
    const canvas = document.getElementById('circuit-canvas');
    canvas.style.width = '100%'; canvas.style.height = '100%';
    
    let clean = normalizeCircuitExpression(expr);
    if(clean === '0' || clean === '1') { 
        const ctx = setupCanvas(canvas); ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.font="bold 20px Arial"; ctx.fillStyle="#333"; ctx.fillText("Saída Constante: " + clean, 50, 50); return; 
    }

    const logicTree = parseToTree(clean);

    const getTreeDepth = (node) => {
        if (!node || node.type === 'LITERAL') return 1;
        if (node.type === 'NOT') return 1 + getTreeDepth(node.center);
        return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
    };
    const depth = getTreeDepth(logicTree);
    const totalWidth = Math.max(450, 120 + (depth * 75));
    const totalHeight = 360;
    
    canvas.style.width = totalWidth + 'px'; canvas.style.height = totalHeight + 'px';
    const ctx = setupCanvas(canvas);
    
    const railX = { 'A': 35, 'B': 55, 'C': 75, 'D': 95 };
    ctx.lineWidth = 2; ctx.font = "bold 12px Arial";
    ['A','B','C','D'].forEach(v => {
        ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(railX[v], 20); ctx.lineTo(railX[v], totalHeight - 20); ctx.stroke();
        ctx.fillStyle = '#2563eb'; ctx.fillText(v, railX[v]-4, 15);
    });

    let gateCountY = 0;

    function renderNode(node, currentDepth, isRoot = false) {
        let x = totalWidth - (currentDepth * 70) - 40;
        
        if (node.type === 'LITERAL') {
            gateCountY += 35;
            let y = gateCountY;
            drawWire(ctx, railX[node.val], y, x, y, false);
            return { x: x, y: y };
        }
        
        if (node.type === 'NOT') {
            // CORREÇÃO ESTÉTICA: Se for a raiz absoluta da expressão solta (ex: Y = A'), desenha a NOT física (triângulo)
            if (isRoot && node.center.type === 'LITERAL') {
                let childPos = renderNode(node.center, currentDepth + 1);
                let outX = x + 20;
                drawOrthogonalWire(ctx, childPos.x, childPos.y, x, childPos.y, false);
                drawGateSimple(ctx, 'NOT', x, childPos.y);
                return { x: outX, y: childPos.y };
            } else {
                // Caso contrário, repassa para o pai tratar isso como uma bolinha na entrada[cite: 2]
                return renderNode(node.center, currentDepth, false);
            }
        }

        // Lógica de portas binárias (AND, OR, etc)
        // Checa de antemão se as entradas filhas são inversões diretas de variáveis soltas
        let leftIsNegated = (node.left.type === 'NOT' && node.left.center.type === 'LITERAL');
        let rightIsNegated = (node.right.type === 'NOT' && node.right.center.type === 'LITERAL');

        let leftPos = renderNode(node.left, currentDepth + 1, false);
        let rightPos = renderNode(node.right, currentDepth + 1, false);
        
        let midY = (leftPos.y + rightPos.y) / 2;
        
        // Passa a flag de inversão para a linha de conexão (desenha a bolinha na entrada da porta)[cite: 2]
        drawOrthogonalWire(ctx, leftPos.x, leftPos.y, x, midY - 8, leftIsNegated);
        drawOrthogonalWire(ctx, rightPos.x, rightPos.y, x, midY + 8, rightIsNegated);
        
        drawGateSimple(ctx, node.type, x, midY);
        return { x: x + 30, y: midY };
    }

    // Passa true no nó raiz para indicar o ponto final do circuito
    let finalOut = renderNode(logicTree, 1, true);

    ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.moveTo(finalOut.x, finalOut.y); ctx.lineTo(totalWidth - 25, finalOut.y); ctx.stroke();
    ctx.fillStyle = '#000'; ctx.fillText("Y", totalWidth - 20, finalOut.y + 4);
}

function drawWire(ctx, x1, y1, x2, y2, inverted) {
    ctx.fillStyle = '#2563eb'; ctx.beginPath(); ctx.arc(x1, y1, 3, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y1);
    if (Math.abs(y1 - y2) < 2) { ctx.lineTo(x2, y2); } else { ctx.lineTo(x2 - 12, y1); ctx.lineTo(x2 - 12, y2); ctx.lineTo(x2, y2); }
    ctx.stroke();
    if (inverted) {
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x2 - 4, y2, 2.5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    }
}

// Atualizada para aceitar o desenho automático da bolinha inversora nas conexões ortogonais
function drawOrthogonalWire(ctx, x1, y1, x2, y2, inverted = false) {
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(x1, y1);
    let midX = (x1 + x2) / 2; ctx.lineTo(midX, y1); ctx.lineTo(midX, y2); ctx.lineTo(x2, y2); ctx.stroke();
    
    if (inverted) {
        // Renderiza a bolinha de negação industrial exatamente no encaixe da porta[cite: 2]
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x2 - 3, y2, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
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
