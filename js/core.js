/* ==========================================================================
   js/core-app.js - MOTOR LÓGICO MATEMÁTICO ULTRACOMPLETO (EletroNIC V1.0)
   © 2026 KMZ Technologies - Todos os direitos reservados.
   ========================================================================== */

// --- ESTADO GLOBAL DO SISTEMA ---
let lastCalculatedEquation = "0";
let kmapData = new Array(16).fill(0);
let currentVars = 4;
let solutionGroups = [];

const gray4 = [0, 1, 3, 2];
const gray2 = [0, 1];

console.log("EletroNIC Engine Principal Carregada com Proteção Ativa. KMZ 2026.");

// --- SISTEMA DE NAVEGAÇÃO ENTRE ABAS ---
function switchTab(tabId, btn) {
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(el => {
        el.classList.remove('active');
    });
    
    const targetSection = document.getElementById('section-' + tabId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    if (btn) {
        btn.classList.add('active');
    }
    if (tabId === 'chips') {
        drawChip();
    }
}

function toggleTableMode() {
    const modeEl = document.getElementById('tt-mode');
    if (!modeEl) return;
    const mode = modeEl.value;
    
    const simpleCtrl = document.getElementById('mode-simple-controls');
    const customCtrl = document.getElementById('mode-custom-controls');
    
    if (simpleCtrl) simpleCtrl.classList.toggle('hidden', mode !== 'simple');
    if (customCtrl) customCtrl.classList.toggle('hidden', mode !== 'custom');
    
    generateTruthTable();
}

function ins(txt) { 
    const input = document.getElementById('custom-expression');
    if (input) {
        input.value += txt;
    }
}

function backspace() { 
    const input = document.getElementById('custom-expression'); 
    if (input) {
        input.value = input.value.slice(0, -1);
    }
}

// --- POPUP GERENCIADOR DE IMAGENS EXPORTADAS ---
function showImageModal(dataUrl) {
    const modal = document.getElementById('export-modal');
    const img = document.getElementById('modal-img');
    if (img && modal) {
        img.src = dataUrl;
        modal.classList.add('visible');
    }
    if (window.AppInventor && window.AppInventor.setWebViewString) {
        window.AppInventor.setWebViewString("IMAGE:" + dataUrl);
    }
}

function closeModal() {
    const modal = document.getElementById('export-modal');
    if (modal) {
        modal.classList.remove('visible');
    }
}

// --- CANVAS HIGH DPI HELPER (CORREÇÃO DE SERRILHADO) ---
function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
}

// --- SEÇÃO 1: MOTOR DO SIMULADOR DE PORTAS LÓGICAS ---
function updateGateLogic() {
    const gateEl = document.getElementById('gate-selector');
    const inputAEl = document.getElementById('inputA');
    const inputBEl = document.getElementById('inputB');
    const containerB = document.getElementById('inputB-container');
    
    if (!gateEl || !inputAEl || !inputBEl) return;
    
    const gate = gateEl.value;
    const a = inputAEl.checked;
    const b = inputBEl.checked;
    
    if (containerB) {
        containerB.style.opacity = gate === 'NOT' ? '0.2' : '1';
    }
    
    let res = false;
    if (gate === 'AND') res = a && b;
    else if (gate === 'OR') res = a || b;
    else if (gate === 'NOT') res = !a;
    else if (gate === 'NAND') res = !(a && b);
    else if (gate === 'NOR') res = !(a || b);
    else if (gate === 'XOR') res = a !== b;
    else if (gate === 'XNOR') res = a === b;
    
    const led = document.getElementById('outputLed');
    if (led) {
        led.style.backgroundColor = res ? 'var(--success)' : '#333';
        led.style.boxShadow = res ? '0 0 20px var(--success)' : 'inset 0 2px 5px rgba(0,0,0,0.5)';
    }
    
    const textEl = document.getElementById('logic-text');
    if (textEl) {
        textEl.innerHTML = `<span style="color:var(--accent)">${a?1:0}</span> ${gate} <span style="color:var(--accent)">${gate==='NOT'?'':(b?1:0)}</span> = <span style="color:${res?'var(--success)':'var(--danger)'}">${res?1:0}</span>`;
    }
    
    const svgEl = document.getElementById('gate-svg');
    if (svgEl) {
        let svg = `<svg viewBox="0 0 100 60" style="width:100%;height:100%"><rect x="25" y="15" width="50" height="30" rx="6" fill="none" stroke="var(--primary)" stroke-width="2.5"/><text x="50" y="34" fill="var(--text)" font-weight="bold" font-size="11" text-anchor="middle">${gate}</text></svg>`;
        svgEl.innerHTML = svg;
    }
}

// --- SEÇÃO 5: CALCULADORA E CONVERSOR DE BASES ---
function parseAnyBase(str, base) {
    str = str.replace(',', '.');
    if (!str) return NaN;
    return parseInt(str, base);
}

function formatAnyBase(num, base) {
    if (isNaN(num)) return "";
    return Math.floor(num).toString(base).toUpperCase();
}

function filterCalc(input, baseId) {
    const baseEl = document.getElementById(baseId);
    if (!baseEl) return;
    const base = baseEl.value;
    let regex = (base === '2') ? /[^01]/g : (base === '10') ? /[^0-9]/g : /[^0-9A-Fa-f]/g;
    input.value = input.value.replace(regex, '');
}

function calcUniversal() {
    const baseAEl = document.getElementById('base-a');
    const baseBEl = document.getElementById('base-b');
    const calcAEl = document.getElementById('calc-a');
    const calcBEl = document.getElementById('calc-b');
    const opEl = document.getElementById('calc-op');
    
    if (!baseAEl || !baseBEl || !calcAEl || !calcBEl || !opEl) return;
    
    const baseA = parseInt(baseAEl.value);
    const baseB = parseInt(baseBEl.value);
    const valA = parseAnyBase(calcAEl.value, baseA);
    const valB = parseAnyBase(calcBEl.value, baseB);
    
    if (isNaN(valA) || isNaN(valB)) return;
    const op = opEl.value;
    let res = 0;
    
    if (op === '+') res = valA + valB;
    else if (op === '-') res = valA - valB;
    else if (op === '*') res = valA * valB;
    else res = (valB !== 0 ? valA / valB : 0);
    
    const resultsBlock = document.getElementById('calc-results');
    if (resultsBlock) resultsBlock.style.display = 'block';
    
    const rDec = document.getElementById('res-dec');
    const rBin = document.getElementById('res-bin');
    const rOct = document.getElementById('res-oct');
    const rHex = document.getElementById('res-hex');
    
    if (rDec) rDec.innerText = formatAnyBase(res, 10);
    if (rBin) rBin.innerText = formatAnyBase(res, 2);
    if (rOct) rOct.innerText = formatAnyBase(res, 8);
    if (rHex) rHex.innerText = formatAnyBase(res, 16);
}

function convertBase(type) {
    const ids = {dec: 'in-dec', bin: 'in-bin', oct: 'in-oct', hex: 'in-hex'};
    const rawEl = document.getElementById(ids[type]);
    if (!rawEl) return;
    let raw = rawEl.value.trim();
    
    if (!raw) {
        for (let k in ids) {
            const el = document.getElementById(ids[k]);
            if (el) el.value = "";
        }
        return;
    }
    let num = parseInt(raw, type === 'bin' ? 2 : type === 'oct' ? 8 : type === 'hex' ? 16 : 10);
    
    const decEl = document.getElementById(ids.dec);
    const binEl = document.getElementById(ids.bin);
    const octEl = document.getElementById(ids.oct);
    const hexEl = document.getElementById(ids.hex);
    
    if (type !== 'dec' && decEl) decEl.value = formatAnyBase(num, 10);
    if (type !== 'bin' && binEl) binEl.value = formatAnyBase(num, 2);
    if (type !== 'oct' && octEl) octEl.value = formatAnyBase(num, 8);
    if (type !== 'hex' && hexEl) hexEl.value = formatAnyBase(num, 16);
}

function clearConv() {
    ['in-dec', 'in-bin', 'in-oct', 'in-hex'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}

// --- SEÇÃO 2: GERADOR DE TABELA VERDADE CUSTOMIZADA ---
function parseExpression(expr, ctx) {
    try {
        let clean = expr.toUpperCase().replace(/\s+/g, '');
        if (!clean) return null;
        
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
                }
                clean = clean.substring(0, start) + '!(' + clean.substring(start, idx) + ')' + clean.substring(idx + 1);
            } else {
                clean = clean.replace("'", "");
            }
        }
        
        clean = clean.replace(/([A-D\)])(?=[A-D\(!])/g, '$1&&');
        clean = clean.replace(/\+/g, '||').replace(/\*/g, '&&');
        
        for (let v of ['A', 'B', 'C', 'D']) {
            clean = clean.split(v).join(ctx[v] ? 'true' : 'false');
        }
        
        return Function('"use strict";return (' + clean + ')')();
    } catch (e) {
        return null;
    }
}

function generateTruthTable() {
    const table = document.getElementById('truth-table-display');
    const modeEl = document.getElementById('tt-mode');
    if (!table || !modeEl) return;
    
    table.innerHTML = "";
    let vars = ['A', 'B'], expression = "";
    
    if (modeEl.value === 'custom') {
        const custExprEl = document.getElementById('custom-expression');
        expression = custExprEl ? custExprEl.value : "";
        if (expression.trim() === "") return;
        const foundVars = new Set();
        ['A', 'B', 'C', 'D'].forEach(v => {
            if (expression.toUpperCase().includes(v)) foundVars.add(v);
        });
        if (foundVars.size > 0) vars = Array.from(foundVars).sort();
    }
    
    let html = `<thead><tr>`;
    vars.forEach(v => html += `<th>${v}</th>`);
    html += `<th>S</th></tr></thead><tbody>`;
    
    const rows = 1 << vars.length;
    for (let i = 0; i < rows; i++) {
        let ctx = {A: 0, B: 0, C: 0, D: 0}, rowHtml = "";
        for (let j = 0; j < vars.length; j++) {
            const bit = (i >> (vars.length - 1 - j)) & 1;
            ctx[vars[j]] = bit;
            rowHtml += `<td>${bit}</td>`;
        }
        
        let res = 0;
        if (modeEl.value === 'simple') {
            const typeEl = document.getElementById('tt-type');
            const t = typeEl ? typeEl.value : 'AND';
            const a = ctx.A, b = ctx.B;
            if (t === 'AND') res = a && b ? 1 : 0;
            else if (t === 'OR') res = a || b ? 1 : 0;
            else if (t === 'XOR') res = a !== b ? 1 : 0;
            else if (t === 'NAND') res = !(a && b) ? 1 : 0;
            else if (t === 'NOR') res = !(a || b) ? 1 : 0;
        } else {
            const er = parseExpression(expression, ctx);
            const errDiv = document.getElementById('expression-error');
            if (er === null) {
                if (errDiv) errDiv.style.display = 'block';
                return;
            }
            if (errDiv) errDiv.style.display = 'none';
            res = er ? 1 : 0;
        }
        html += `<tr>${rowHtml}<td class="result-${res}">${res}</td></tr>`;
    }
    html += `</tbody>`;
    table.innerHTML = html;
}

// --- SEÇÃO 3: MOTOR DE RESOLUÇÃO DO MAPA DE KARNAUGH ---
function initKMapGrid() {
    const varsEl = document.getElementById('kmap-vars');
    const container = document.getElementById('kmap-container');
    if (!varsEl || !container) return;
    
    const numVars = parseInt(varsEl.value);
    currentVars = numVars;
    container.className = `kmap-grid vars-${numVars}`;
    container.innerHTML = '';
    kmapData.fill(0);
    
    const eqBox = document.getElementById('kmap-equation-text');
    if (eqBox) eqBox.innerText = "Y = 0";
    solutionGroups = [];
    lastCalculatedEquation = "0";
    
    let rowsGray = numVars === 4 ? gray4 : gray2;
    let colsGray = numVars === 3 ? gray4 : (numVars === 4 ? gray4 : gray2);
    let label = numVars === 4 ? "AB\\CD" : (numVars === 3 ? "A\\BC" : "A\\B");
    
    container.innerHTML += `<div class="kmap-corner">${label}</div>`;
    (numVars >= 3 ? ['00','01','11','10'] : ['0','1']).forEach(l => container.innerHTML += `<div class="kmap-header">${l}</div>`);
    
    rowsGray.forEach((rVal, rIdx) => {
        let labels4 = ['00', '01', '11', '10'];
        let rLabelText = numVars === 4 ? labels4[rIdx] : rVal.toString();
        container.innerHTML += `<div class="kmap-header">${rLabelText}</div>`;
        colsGray.forEach((cVal) => {
            let minterm = 0;
            if (numVars === 4) minterm = (rVal << 2) | cVal;
            else if (numVars === 3) minterm = (rVal << 2) | cVal;
            else minterm = (rVal << 1) | cVal;
            container.innerHTML += `<div class="kmap-cell state-0" id="cell-${minterm}" onclick="toggleCell(${minterm})">0</div>`;
        });
    });
}

function toggleCell(idx) { 
    kmapData[idx] = (kmapData[idx] + 1) % 3; 
    const el = document.getElementById(`cell-${idx}`); 
    if (el) {
        if (kmapData[idx] === 1) {
            el.className = 'kmap-cell state-1';
            el.innerText = '1';
        } else if (kmapData[idx] === 2) {
            el.className = 'kmap-cell state-x';
            el.innerText = 'X';
        } else {
            el.className = 'kmap-cell state-0';
            el.innerText = '0';
        }
    }
}

function highlightGroup(indices) {
    document.querySelectorAll('.kmap-cell').forEach(c => {
        c.classList.remove('educ-highlight');
    });
    if (!indices) return;
    indices.forEach(idx => {
        const cell = document.getElementById(`cell-${idx}`);
        if (cell) cell.classList.add('educ-highlight');
    });
}

function solveKMap() {
    const minterms = [], dontCares = [], maxM = 1 << currentVars;
    for (let i = 0; i < maxM; i++) {
        if (kmapData[i] === 1) minterms.push(i);
        if (kmapData[i] === 2) dontCares.push(i);
    }
    
    const eqBox = document.getElementById('kmap-equation-text');
    if (!eqBox) return;
    
    if (minterms.length === 0) {
        eqBox.innerText = "Y = 0"; lastCalculatedEquation = "0"; solutionGroups = []; return;
    }
    if (minterms.length === maxM) {
        eqBox.innerText = "Y = 1"; lastCalculatedEquation = "1"; solutionGroups = [Array.from({length: maxM}, (_, i) => i)]; return;
    }
    
    const allGroups = findAllRectangles(minterms, dontCares, currentVars);
    const primes = filterPrimes(allGroups);
    const solution = selectMinimalCover(primes, minterms);
    solutionGroups = solution.map(s => s.minterms); 

    let html = "Y = ";
    solution.forEach((group, idx) => {
        const term = formatTerm(group, currentVars);
        const mintermsStr = JSON.stringify(group.minterms);
        html += `<span class="interactive-term" onclick="highlightGroup(${mintermsStr})">${term}</span>`;
        if (idx < solution.length - 1) html += " + ";
    });
    eqBox.innerHTML = html;
    lastCalculatedEquation = solution.map(g => formatTerm(g, currentVars)).join(" + ");
}

function findAllRectangles(ones, dcs, vars) {
    const target = new Set([...ones, ...dcs]), groups = [], R = (vars === 4) ? 4 : 2, C = (vars === 2) ? 2 : 4;
    const mapRC = (r, c) => {
        const rG = (vars === 4) ? gray4[r] : gray2[r];
        const cG = (vars === 2) ? gray2[c] : gray4[c];
        return (vars === 4) ? (rG << 2) | cG : (vars === 3 ? (rG << 2) | cG : (rG << 1) | cG);
    };
    const sizes = [16, 8, 4, 2, 1].filter(s => s <= (1 << vars)); 
    for (let size of sizes) {
        for (let h = 1; h <= size; h++) {
            if (size % h === 0) {
                const w = size / h;
                if (h <= R && w <= C) {
                     for (let r = 0; r < R; r++) {
                        for (let c = 0; c < C; c++) {
                            const ms = []; let ok = true;
                            for (let i = 0; i < h; i++) {
                                for (let j = 0; j < w; j++) {
                                    const m = mapRC((r + i) % R, (c + j) % C);
                                    if (!target.has(m)) { ok = false; break; }
                                    ms.push(m);
                                } if (!ok) break;
                            } if (ok) { ms.sort((a, b) => a - b); groups.push({minterms: ms, size: size}); }
                        }
                     }
                }
            }
        }
    } return groups;
}

function filterPrimes(groups) {
    const unique = [], seen = new Set();
    for (let g of groups) { const k = g.minterms.join(','); if (!seen.has(k)) { seen.add(k); unique.push(g); } }
    unique.sort((a, b) => b.size - a.size);
    const primes = [];
    for (let i = 0; i < unique.length; i++) {
        let sub = false;
        for (let j = 0; j < unique.length; j++) {
            if (i === j) continue;
            if (unique[j].size > unique[i].size) {
                 const sJ = new Set(unique[j].minterms);
                 if (unique[i].minterms.every(m => sJ.has(m))) { sub = true; break; }
            }
        } if (!sub) primes.push(unique[i]);
    } return primes;
}

function selectMinimalCover(primes, req) {
    primes.sort((a, b) => b.size - a.size);
    let sel = [], todo = new Set(req);
    while (todo.size > 0) {
        let best = null, bestCount = -1;
        for (let p of primes) {
            let count = 0; for (let m of p.minterms) if (todo.has(m)) count++;
            if (count > bestCount) { best = p; bestCount = count; }
        }
        if (best && bestCount > 0) { sel.push(best); best.minterms.forEach(x => todo.delete(x)); } else break;
    } return sel;
}

function isGroupWrapping(minterms) {
    if (minterms.length < 2) return false;
    let min = Math.min(...minterms), max = Math.max(...minterms);
    return (max - min) > (minterms.length * 1.5); 
}

function formatTerm(g, vars) {
    if (g.size === (1 << vars)) return "1";
    let t = ""; const n = ['A', 'B', 'C', 'D'];
    for (let b = 0; b < vars; b++) {
        const s = vars - 1 - b; const f = (g.minterms[0] >> s) & 1; let same = true;
        for (let i = 1; i < g.minterms.length; i++) if (((g.minterms[i] >> s) & 1) !== f) { same = false; break; }
        if (same) t += (f ? n[b] : n[b] + "'");
    } return t;
}

function sendToKMap() {
    const expr = document.getElementById('custom-expression').value; if (!expr) return;
    const targetVars = expr.includes('D') ? 4 : expr.includes('C') ? 3 : 2;
    document.getElementById('kmap-vars').value = targetVars; initKMapGrid();
    for (let i = 0; i < (1 << targetVars); i++) {
        let ctx = {A: 0, B: 0, C: 0, D: 0}; for (let v = 0; v < targetVars; v++) ctx[['A', 'B', 'C', 'D'][v]] = (i >> (targetVars - 1 - v)) & 1;
        if (parseExpression(expr, ctx)) { kmapData[i] = 1; const cell = document.getElementById('cell-' + i); if (cell) { cell.className = 'kmap-cell state-1'; cell.innerText = '1'; } }
    }
    solveKMap(); document.querySelectorAll('.nav-btn')[2].click();
}

function sendCalculatedToTable() {
    let eq = lastCalculatedEquation; if (!eq) eq = "0";
    if (eq.startsWith("Y = ")) eq = eq.substring(4);
    document.getElementById('tt-mode').value = 'custom'; toggleTableMode();
    document.getElementById('custom-expression').value = eq;
    document.querySelectorAll('.nav-btn')[1].click(); generateTruthTable();
}

// --- SEÇÃO 4: MOTOR DESENHISTA DE DIAGRAMAS VETORIAIS (CANVAS) ---
function sendToCircuit(s) {
    let e = (s === 'kmap') ? lastCalculatedEquation : document.getElementById('custom-expression').value;
    if (!e) e = "0"; if (e.startsWith("Y = ")) e = e.substring(4);
    
    const displayEl = document.getElementById('circuit-expression-display');
    if (displayEl) displayEl.innerText = e;
    
    document.querySelectorAll('.nav-btn')[3].click(); 
    setTimeout(() => drawCircuit(e), 100);
}

function drawCircuit(expr) {
    const canvas = document.getElementById('circuit-canvas');
    if (!canvas) return;
    
    let clean = expr.replace(/\s/g, '');
    if (clean === '0' || clean === '1') { 
        const ctx = setupCanvas(canvas); ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "bold 20px Arial"; ctx.fillStyle = "#333"; ctx.fillText("Saída Constante: " + clean, 50, 50); return; 
    }
    let terms = []; let lvl = 0, buff = "";
    for (let char of clean) { 
        if (char === '(') lvl++; else if (char === ')') lvl--; 
        if (char === '+' && lvl === 0) { if (buff) terms.push(buff); buff = ""; } else buff += char; 
    }
    if (buff) terms.push(buff);

    const railX = { 'A': 30, 'B': 50, 'C': 70, 'D': 90 };
    const startGateX = 140, gateStepX = 60, rowHeight = 70;
    let maxDepth = 1;
    terms.forEach(t => { let lits = (t.match(/[A-D]/g) || []).length; if (lits > 2) maxDepth = Math.max(maxDepth, lits - 1); });
    let orDepth = terms.length > 1 ? terms.length - 1 : 0;
    
    const totalWidth = Math.max(380, startGateX + (maxDepth * gateStepX) + (orDepth * gateStepX) + 100);
    const totalHeight = Math.max(350, (terms.length * rowHeight) + 100);
    canvas.style.width = totalWidth + 'px'; canvas.style.height = totalHeight + 'px';
    const ctx = setupCanvas(canvas);
    
    ctx.lineWidth = 2; ctx.font = "bold 12px Arial";
    ['A', 'B', 'C', 'D'].forEach(v => {
        ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(railX[v], 20); ctx.lineTo(railX[v], totalHeight - 20); ctx.stroke();
        ctx.fillStyle = '#2563eb'; ctx.fillText(v, railX[v] - 4, 15);
    });

    const termOutputs = []; let currentY = 50;
    terms.forEach(term => {
        let lits = [];
        const m = term.matchAll(/([A-D])('?)/g); for (const i of m) lits.push({c: i[1], n: i[2] === "'"});
        if (lits.length === 0) return;
        
        let curX = startGateX;
        if (lits.length === 1) {
            drawWire(ctx, railX[lits[0].c], currentY, curX, currentY, lits[0].n); termOutputs.push({x: curX, y: currentY});
        } else {
            drawWire(ctx, railX[lits[0].c], currentY - 10, curX, currentY - 10, lits[0].n);
            drawWire(ctx, railX[lits[1].c], currentY + 10, curX, currentY + 10, lits[1].n);
            drawGateSimple(ctx, 'AND', curX, currentY); curX += gateStepX; 
            for (let i = 2; i < lits.length; i++) {
                ctx.strokeStyle = '#475569'; ctx.beginPath(); ctx.moveTo(curX - gateStepX + 20, currentY); ctx.lineTo(curX, currentY - 10); ctx.stroke();
                drawWire(ctx, railX[lits[i].c], currentY + 20, curX, currentY + 10, lits[i].n); 
                drawGateSimple(ctx, 'AND', curX, currentY); curX += gateStepX;
            }
            termOutputs.push({x: curX - gateStepX + 20, y: currentY}); 
        }
        currentY += rowHeight;
    });

    if (termOutputs.length === 1) {
        ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.moveTo(termOutputs[0].x, termOutputs[0].y); ctx.lineTo(termOutputs[0].x + 40, termOutputs[0].y); ctx.stroke();
        ctx.fillStyle = '#000'; ctx.fillText("Y", termOutputs[0].x + 45, termOutputs[0].y + 4);
    } else {
        let curX = 0; termOutputs.forEach(t => curX = Math.max(curX, t.x)); curX += 40; 
        let prevOutPoint = {x: termOutputs[0].x, y: termOutputs[0].y};
        for (let i = 1; i < termOutputs.length; i++) {
            let nextTerm = termOutputs[i]; let gateY = (i === 1) ? (termOutputs[0].y + termOutputs[1].y) / 2 : nextTerm.y;
            drawOrthogonalWire(ctx, prevOutPoint.x, prevOutPoint.y, curX, gateY - 10);
            drawOrthogonalWire(ctx, nextTerm.x, nextTerm.y, curX, gateY + 10);
            drawGateSimple(ctx, 'OR', curX, gateY); prevOutPoint = {x: curX + 20, y: gateY}; curX += gateStepX; 
        }
        ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.moveTo(prevOutPoint.x, prevOutPoint.y); ctx.lineTo(prevOutPoint.x + 30, prevOutPoint.y); ctx.stroke();
        ctx.fillStyle = '#000'; ctx.fillText("Y", prevOutPoint.x + 35, prevOutPoint.y + 5);
    }
}

function drawWire(ctx, x1, y1, x2, y2, inverted) {
    ctx.fillStyle = '#2563eb'; ctx.beginPath(); ctx.arc(x1, y1, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y1);
    if (Math.abs(y1 - y2) < 2) ctx.lineTo(x2, y2);
    else { ctx.lineTo(x2 - 15, y1); ctx.lineTo(x2 - 15, y2); ctx.lineTo(x2, y2); }
    ctx.stroke();
    if (inverted) {
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x2 - 5, y2, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
}

function drawOrthogonalWire(ctx, x1, y1, x2, y2) {
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y1);
    let midX = (x1 + x2) / 2; ctx.lineTo(midX, y1); ctx.lineTo(midX, y2); ctx.lineTo(x2, y2); ctx.stroke();
}

function drawGateSimple(ctx, type, x, y) {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    if (type === 'AND') {
        ctx.beginPath(); ctx.moveTo(x, y - 15); ctx.lineTo(x + 15, y - 15); ctx.arc(x + 15, y, 15, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x, y + 15); ctx.lineTo(x, y - 15); ctx.fill(); ctx.stroke();
    } else if (type === 'OR') {
        ctx.beginPath(); ctx.moveTo(x, y - 15); ctx.quadraticCurveTo(x + 15, y - 15, x + 30, y); ctx.quadraticCurveTo(x + 15, y + 15, x, y + 15); ctx.quadraticCurveTo(x + 10, y, x, y - 15); ctx.fill(); ctx.stroke();
    }
}

// --- SEÇÃO 6: MAPA DE PINAGEM DOS CHIPS TTL NATIVOS ---
function drawChip() {
    const canvas = document.getElementById('chip-canvas'); if (!canvas) return;
    canvas.style.width = '350px'; canvas.style.height = '300px'; const ctx = setupCanvas(canvas);
    ctx.fillStyle = "#222"; ctx.fillRect(25, 50, 300, 200);
    
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(25, 150, 15, -Math.PI / 2, Math.PI / 2); ctx.fill();
    const selector = document.getElementById('chip-selector');
    ctx.fillStyle = "#ddd"; ctx.font = "bold 24px Arial"; ctx.fillText(selector ? selector.value : "7408", 130, 155);
}

function exportCircuitImage() { 
    const canvas = document.getElementById('circuit-canvas'); 
    if (canvas) showImageModal(canvas.toDataURL("image/png")); 
}

function exportTableImage() { 
    const table = document.getElementById("truth-table-display");
    if (!table || !table.rows.length) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 300;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 400, 300);
    ctx.fillStyle = "#3b82f6"; ctx.font = "bold 16px Courier New";
    ctx.fillText("Tabela Verdade - EletroNIC", 20, 40);
    
    showImageModal(canvas.toDataURL("image/png"));
}

// --- DISPARADOR CRÍTICO BLINDADO CONTA FALHAS DE INICIALIZAÇÃO DE BOOT ---
document.addEventListener("DOMContentLoaded", () => {
    try {
        updateGateLogic();
        generateTruthTable();
        initKMapGrid();
    } catch(err) {
        console.error("Proteção Ativa do EletroNIC interceptou falha de boot: ", err);
    }
});

