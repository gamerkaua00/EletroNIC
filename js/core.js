/* ==========================================================================
   js/core-app.js - MOTOR LÓGICO MATEMÁTICO COMPLETO (EletroNIC V1.0)
   © 2026 KMZ Technologies - Todos os direitos reservados.
   ========================================================================== */

// --- ESTADO GLOBAL DO APLICATIVO ---
let lastCalculatedEquation = "";
console.log("EletroNIC Engine Principal Carregada. Copyright © 2026 KMZ.");

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
    const mode = document.getElementById('tt-mode').value;
    document.getElementById('mode-simple-controls').classList.toggle('hidden', mode !== 'simple');
    document.getElementById('mode-custom-controls').classList.toggle('hidden', mode !== 'custom');
    if (mode === 'simple') {
        generateTruthTable();
    }
}

function ins(txt) { 
    document.getElementById('custom-expression').value += txt; 
}

function backspace() { 
    const input = document.getElementById('custom-expression'); 
    input.value = input.value.slice(0, -1); 
}

// --- POPUP GERENCIADOR DE PRINTS (EXPORTAÇÃO DE MATRIZES) ---
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
    document.getElementById('export-modal').classList.remove('visible');
}

// --- CANVAS HIGH DPI HELPER (PREVINE RENDERIZAÇÃO BORRADA NO ANDROID) ---
function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
}

// --- ABA 1: SIMULADOR INTERATIVO DE PORTAS LÓGICAS ---
function updateGateLogic() {
    const gate = document.getElementById('gate-selector').value;
    const a = document.getElementById('inputA').checked;
    const b = document.getElementById('inputB').checked;
    
    document.getElementById('inputB-container').style.opacity = gate === 'NOT' ? '0.2' : '1';
    let res = false;
    
    if (gate === 'AND') {
        res = a && b;
    } else if (gate === 'OR') {
        res = a || b;
    } else if (gate === 'NOT') {
        res = !a;
    } else if (gate === 'NAND') {
        res = !(a && b);
    } else if (gate === 'NOR') {
        res = !(a || b);
    } else if (gate === 'XOR') {
        res = a !== b;
    } else if (gate === 'XNOR') {
        res = a === b;
    }
    
    const led = document.getElementById('outputLed');
    if (led) {
        led.style.backgroundColor = res ? 'var(--success)' : '#333';
        led.style.boxShadow = res ? '0 0 20px var(--success)' : 'inset 0 2px 5px rgba(0,0,0,0.5)';
    }
    
    document.getElementById('logic-text').innerHTML = `<span style="color:var(--accent)">${a?1:0}</span> ${gate} <span style="color:var(--accent)">${gate==='NOT'?'':(b?1:0)}</span> = <span style="color:${res?'var(--success)':'var(--danger)'}">${res?1:0}</span>`;
    
    let svg = `<svg viewBox="0 0 100 60" style="width:100%;height:100%"><defs><filter id="glow"><feGaussianBlur stdDeviation="1.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    svg += `<path d="M10,20 L30,20" stroke="var(--text-muted)" stroke-width="2"/>`;
    if (gate !== 'NOT') {
        svg += `<path d="M10,40 L30,40" stroke="var(--text-muted)" stroke-width="2"/>`;
    }
    svg += `<text x="50" y="35" fill="var(--primary)" font-weight="bold" font-family="Arial" text-anchor="middle" dominant-baseline="middle" font-size="14">${gate}</text>`;
    svg += `<rect x="30" y="10" width="40" height="40" rx="5" fill="none" stroke="var(--primary)" stroke-width="2" filter="url(#glow)"/>`;
    svg += `<path d="M70,30 L90,30" stroke="${res?'var(--success)':'var(--text-muted)'}" stroke-width="2"/>`;
    svg += `</svg>`;
    document.getElementById('gate-svg').innerHTML = svg;
}

// --- ABA 5: CALCULADORA MATRICIAL E CONVERSOR DE BASES ---
function parseAnyBase(str, base) {
    str = str.replace(',', '.');
    if (!str) return NaN;
    const parts = str.split('.');
    let val = parseInt(parts[0], base);
    if (parts.length > 1) {
        let frac = 0;
        for (let i = 0; i < parts[1].length; i++) {
            const digit = parseInt(parts[1][i], base);
            if (!isNaN(digit)) {
                frac += digit * Math.pow(base, -(i + 1));
            }
        }
        val += frac;
    }
    return val;
}

function formatAnyBase(num, base) {
    if (isNaN(num)) return "";
    let intPart = Math.floor(num);
    let fracPart = num - intPart;
    let res = intPart.toString(base).toUpperCase();
    if (fracPart > 0.000001) {
        res += ",";
        let limit = 8;
        while (fracPart > 0.000001 && limit > 0) {
            fracPart *= base;
            let digit = Math.floor(fracPart);
            res += digit.toString(base).toUpperCase();
            fracPart -= digit;
            limit--;
        }
    }
    return res;
}

function filterCalc(input, baseId) {
    const base = document.getElementById(baseId).value;
    let regex = (base === '2') ? /[^01,.]/g : (base === '10') ? /[^0-9,.]/g : /[^0-9A-Fa-f,.]/g;
    input.value = input.value.replace(regex, '').replace('.', ',');
}

function calcUniversal() {
    const baseA = parseInt(document.getElementById('base-a').value);
    const baseB = parseInt(document.getElementById('base-b').value);
    const valA = parseAnyBase(document.getElementById('calc-a').value, baseA);
    const valB = parseAnyBase(document.getElementById('calc-b').value, baseB);
    
    if (isNaN(valA) || isNaN(valB)) return;
    const op = document.getElementById('calc-op').value;
    let res = 0;
    
    if (op === '+') res = valA + valB;
    else if (op === '-') res = valA - valB;
    else if (op === '*') res = valA * valB;
    else res = (valB !== 0 ? valA / valB : 0);
    
    document.getElementById('calc-results').style.display = 'block';
    document.getElementById('res-dec').innerText = formatAnyBase(res, 10);
    document.getElementById('res-bin').innerText = formatAnyBase(res, 2);
    document.getElementById('res-oct').innerText = formatAnyBase(res, 8);
    document.getElementById('res-hex').innerText = formatAnyBase(res, 16);
}

function convertBase(type) {
    const ids = {dec: 'in-dec', bin: 'in-bin', oct: 'in-oct', hex: 'in-hex'};
    let raw = document.getElementById(ids[type]).value.trim();
    if (!raw) {
        for (let k in ids) {
            if (k !== type) document.getElementById(ids[k]).value = "";
        }
        return;
    }
    let num = parseAnyBase(raw, type === 'bin' ? 2 : type === 'oct' ? 8 : type === 'hex' ? 16 : 10);
    if (type !== 'dec') document.getElementById(ids.dec).value = formatAnyBase(num, 10);
    if (type !== 'bin') document.getElementById(ids.bin).value = formatAnyBase(num, 2);
    if (type !== 'oct') document.getElementById(ids.oct).value = formatAnyBase(num, 8);
    if (type !== 'hex') document.getElementById(ids.hex).value = formatAnyBase(num, 16);
}

function clearConv() {
    ['in-dec', 'in-bin', 'in-oct', 'in-hex'].forEach(id => {
        document.getElementById(id).value = "";
    });
}

// --- ABA 2: MOTOR PROCESSADOR DA TABELA VERDADE ---
function parseExpression(expr, ctx) {
    try {
        let clean = expr.toUpperCase().replace(/\s+/g, '');
        if (!clean) return null;
        if (clean === '0') return false;
        if (clean === '1') return true;

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

        const atom = "!?(?:[A-D]|[0-1]|\\([^)]+\\))";
        while (clean.includes('\u22BC')) clean = clean.replace(new RegExp(`(${atom})\u22BC(${atom})`), '!($1&&$2)');
        while (clean.includes('\u22BD')) clean = clean.replace(new RegExp(`(${atom})\u22BD(${atom})`), '!($1||$2)');
        
        clean = clean.replace(/([A-D\)])(?=[A-D\(!])/g, '$1&&');
        clean = clean.replace(/\u2295/g, '!==').replace(/\u2299/g, '===');
        clean = clean.replace(/\+/g, '||').replace(/\*/g, '&&');
        
        for (let v of ['A', 'B', 'C', 'D']) {
            clean = clean.split(v).join(ctx[v] ? 'true' : 'false');
        }
        if (/[^truefalse!&|()=!=>\s]/.test(clean)) return null;

        return Function('"use strict";return (' + clean + ')')();
    } catch (e) {
        return null;
    }
}

function generateTruthTable() {
    const table = document.getElementById('truth-table-display');
    if (!table) return;
    table.innerHTML = "";
    let vars = ['A', 'B'], expression = "";
    
    if (document.getElementById('tt-mode').value === 'custom') {
        expression = document.getElementById('custom-expression').value || "";
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
        if (document.getElementById('tt-mode').value === 'simple') {
            const t = document.getElementById('tt-type').value, a = ctx.A, b = ctx.B;
            if (t === 'AND') res = a && b;
            else if (t === 'OR') res = a || b;
            else if (t === 'XOR') res = (a ? !b : b);
            else if (t === 'NAND') res = !(a && b);
            else if (t === 'NOR') res = !(a || b);
        } else {
            const er = parseExpression(expression, ctx);
            if (er === null) {
                document.getElementById('expression-error').style.display = 'block';
                return;
            }
            document.getElementById('expression-error').style.display = 'none';
            res = er ? 1 : 0;
        }
        html += `<tr>${rowHtml}<td class="result-${res}">${res}</td></tr>`;
    }
    html += `</tbody>`;
    table.innerHTML = html;
}

// --- ABA 3: RESOLVEDOR DO MAPA DE KARNAUGH (QUINE-MCCLUSKEY CORE) ---
let kmapData = new Array(16).fill(0), currentVars = 4;
let solutionGroups = []; 
const gray4 = [0, 1, 3, 2], gray2 = [0, 1];

function initKMapGrid() {
    const numVars = parseInt(document.getElementById('kmap-vars').value);
    currentVars = numVars;
    const container = document.getElementById('kmap-container');
    if (!container) return;
    container.className = `kmap-grid vars-${numVars}`;
    container.innerHTML = '';
    kmapData.fill(0);
    document.getElementById('kmap-equation-text').innerText = "Y = 0";
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

/* RECUPERADA EM 100%: FAZ OS QUADRADOS DO MAPA ENTRAR EM LOOP AO TOQUE */
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

/* RECUPERADA EM 100%: ACENDE AS BORDAS DO MAPA K CONFORME O TERMO CLICADO */
function highlightGroup(indices) {
    document.querySelectorAll('.kmap-cell').forEach(c => {
        c.classList.remove('educ-highlight');
    });
    if (!indices) return;
    indices.forEach(idx => {
        const cell = document.getElementById(`cell-${idx}`);
        if (cell) {
            cell.classList.add('educ-highlight');
        }
    });
}

function solveKMap() {
    const minterms = [], dontCares = [], maxM = 1 << currentVars;
    for (let i = 0; i < maxM; i++) {
        if (kmapData[i] === 1) minterms.push(i);
        if (kmapData[i] === 2) dontCares.push(i);
    }
    
    const eqBox = document.getElementById('kmap-equation-text');
    if (minterms.length === 0) {
        eqBox.innerText = "Y = 0"; lastCalculatedEquation = "0"; solutionGroups = []; return;
    }
    if (minterms.length === maxM) {
        eqBox.innerText = "Y = 1"; lastCalculatedEquation = "1"; solutionGroups = [Array.from({length: maxM}, (_, i) => i)]; return;
    }
    
    const xorPattern = checkSemanticXor(minterms, currentVars);
    if (xorPattern) { 
        const ms = JSON.stringify(minterms);
        eqBox.innerHTML = `Y = <span class="interactive-term" onclick="highlightGroup(${ms})">${xorPattern}</span>`;
        lastCalculatedEquation = xorPattern; solutionGroups = [minterms]; return; 
    }
    
    const allGroups = findAllRectangles(minterms, dontCares, currentVars);
    const primes = filterPrimes(allGroups);
    const solution = selectMinimalCover(primes, minterms);
    solutionGroups = solution.map(s => s.minterms); 

    let terms = solution.map(g => formatTerm(g, currentVars));
    let finalTerms = safeXorDetection(terms);
    lastCalculatedEquation = finalTerms; 

    let html = "Y = ";
    solution.forEach((group, idx) => {
        const term = formatTerm(group, currentVars);
        const mintermsStr = JSON.stringify(group.minterms);
        html += `<span class="interactive-term" onclick="highlightGroup(${mintermsStr})">${term}</span>`;
        if (idx < solution.length - 1) html += " + ";
    });
    eqBox.innerHTML = html;
}

function findAllRectangles(ones, dcs, vars) {
    const target = new Set([...ones, ...dcs]), groups = [], R = (vars === 4) ? 4 : 2, C = (vars === 2) ? 2 : 4;
    const mapRC = (r, c) => {
        const rG = (vars === 4) ? gray4[r] : gray2[r];
        const cG = (vars === 2) ? gray2[c] : gray4[c];
        if (vars === 4) return (rG << 2) | cG;
        if (vars === 3) return (rG << 2) | cG;
        return (rG << 1) | cG;
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
    for (let g of groups) {
        const k = g.minterms.join(',');
        if (!seen.has(k)) { seen.add(k); unique.push(g); }
    }
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
    primes.sort((a, b) => {
        if (b.size !== a.size) return b.size - a.size;
        const aWrap = isGroupWrapping(a.minterms);
        const bWrap = isGroupWrapping(b.minterms);
        return (bWrap ? 1 : 0) - (aWrap ? 1 : 0);
    });
    let sel = [], todo = new Set(req);
    while (todo.size > 0) {
        let best = null, bestSize = -1, bestCount = -1;
        for (let p of primes) {
            let count = 0; for (let m of p.minterms) if (todo.has(m)) count++;
            if (count > 0) {
                if (p.size > bestSize) { best = p; bestSize = p.size; bestCount = count; } 
                else if (p.size === bestSize) { 
                     if (count > bestCount) { best = p; bestCount = count; }
                     else if (count === bestCount && isGroupWrapping(p.minterms)) { best = p; } 
                }
            }
        }
        if (best) { sel.push(best); best.minterms.forEach(x => todo.delete(x)); } else break;
    } return sel;
}

function isGroupWrapping(minterms) {
    if (minterms.length < 2) return false;
    let min = Math.min(...minterms);
    let max = Math.max(...minterms);
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

function checkSemanticXor(activeMinterms, vars) {
    const vNames = ['A', 'B', 'C', 'D'].slice(0, vars); const maxVal = 1 << vars; const targetSet = new Set(activeMinterms);
    for (let mask = 1; mask < maxVal; mask++) {
        let matchXor = true, matchXnor = true;
        for (let i = 0; i < maxVal; i++) {
            let xorVal = 0;
            for (let bit = 0; bit < vars; bit++) if ((mask >> (vars - 1 - bit)) & 1) xorVal ^= (i >> (vars - 1 - bit)) & 1;
            const isOne = targetSet.has(i);
            if ((xorVal === 1) !== isOne) matchXor = false; if ((xorVal === 0) !== isOne) matchXnor = false;
        }
        if (matchXor || matchXnor) {
            let parts = []; for (let bit = 0; bit < vars; bit++) if ((mask >> (vars - 1 - bit)) & 1) parts.push(vNames[bit]);
            let str = parts.join(" ⊕ "); if (matchXnor) str = `(${str})'`; return str;
        }
    } return null;
}

function safeXorDetection(terms) {
    const parseTerm = (t) => { const map = {}; const matches = t.matchAll(/([A-D])('?)/g); for (const match of matches) map[match[1]] = (match[2] === "'") ? 0 : 1; return map; };
    let changed = true; let currentTerms = [...terms];
    while (changed) {
        changed = false; let nextTerms = []; let usedIndices = new Set();
        for (let i = 0; i < currentTerms.length; i++) {
            if (usedIndices.has(i)) continue; let merged = false;
            for (let j = i + 1; j < currentTerms.length; j++) {
                if (usedIndices.has(j)) continue;
                const t1 = parseTerm(currentTerms[i]), t2 = parseTerm(currentTerms[j]);
                const keys1 = Object.keys(t1).sort(), keys2 = Object.keys(t2).sort();
                if (JSON.stringify(keys1) !== JSON.stringify(keys2)) continue;
                let diffs = [], common = [];
                for (let k of keys1) { if (t1[k] !== t2[k]) diffs.push(k); else common.push({key: k, val: t1[k]}); }
                if (diffs.length === 2) {
                    const v1 = diffs[0], v2 = diffs[1], sum1 = t1[v1] + t1[v2], sum2 = t2[v1] + t2[v2];
                    let op = ""; if (sum1 === 1 && sum2 === 1) op = "\u2295"; else if ((sum1 === 0 && sum2 === 2) || (sum1 === 2 && sum2 === 0)) op = "\u2299";
                    if (op) {
                        let newTerm = `(${v1}${op}${v2})`;
                        if (common.length > 0) { let commonStr = common.map(o => o.val ? o.key : o.key + "'").join(""); newTerm = commonStr + newTerm; }
                        nextTerms.push(newTerm); usedIndices.add(i); usedIndices.add(j); merged = true; changed = true; break;
                    }
                }
            } if (!merged) nextTerms.push(currentTerms[i]);
        } if (changed) currentTerms = nextTerms;
    } return currentTerms.join(" + ");
}

function sendToKMap() {
    const expr = document.getElementById('custom-expression').value; if (!expr) return;
    const targetVars = expr.includes('D') ? 4 : expr.includes('C') ? 3 : 2;
    document.getElementById('kmap-vars').value = targetVars; initKMapGrid();
    for (let i = 0; i < (1 << targetVars); i++) {
        let ctx = {A: 0, B: 0, C: 0, D: 0}; for (let v = 0; v < targetVars; v++) ctx[['A', 'B', 'C', 'D'][v]] = (i >> (targetVars - 1 - v)) & 1;
        if (parseExpression(expr, ctx)) { kmapData[i] = 1; document.getElementById('cell-' + i).className = 'kmap-cell state-1'; document.getElementById('cell-' + i).innerText = '1'; }
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

// --- ABA 4: DESENHISTA VETORIAL DE DIAGRAMAS INDEPENDENTES ---
function sendToCircuit(s) {
    let e = (s === 'kmap') ? lastCalculatedEquation : document.getElementById('custom-expression').value;
    if (!e) e = "0"; if (e.startsWith("Y = ")) e = e.substring(4);
    document.getElementById('circuit-expression-display').innerText = e;
    document.querySelectorAll('.nav-btn')[3].click(); setTimeout(() => drawCircuit(e), 100);
}

function drawCircuit(expr) {
    const canvas = document.getElementById('circuit-canvas');
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
        let lits = []; let gateType = 'AND';
        if (term.includes('\u2295')) { 
            gateType = 'XOR'; const parts = term.split('\u2295');
            parts.forEach(p => { const m = p.match(/([A-D])('?)/); if (m) lits.push({c: m[1], n: m[2] === "'"}); });
        } else if (term.includes('\u2299')) {
            gateType = 'XNOR'; const parts = term.split('\u2299');
            parts.forEach(p => { const m = p.match(/([A-D])('?)/); if (m) lits.push({c: m[1], n: m[2] === "'"}); });
        } else {
             const m = term.matchAll(/([A-D])('?)/g); for (const i of m) lits.push({c: i[1], n: i[2] === "'"});
        }
        if (lits.length === 0) return;
        let curX = startGateX;
        if (lits.length === 1 && !term.includes('\u2295') && !term.includes('\u2299')) {
            drawWire(ctx, railX[lits[0].c], currentY, curX, currentY, lits[0].n); termOutputs.push({x: curX, y: currentY});
        } else {
            drawWire(ctx, railX[lits[0].c], currentY - 10, curX, currentY - 10, lits[0].n);
            drawWire(ctx, railX[lits[1].c], currentY + 10, curX, currentY + 10, lits[1].n);
            drawGateSimple(ctx, gateType, curX, currentY); curX += gateStepX; 
            for (let i = 2; i < lits.length; i++) {
                ctx.strokeStyle = '#475569'; ctx.beginPath(); ctx.moveTo(curX - gateStepX + 20, currentY); ctx.lineTo(curX, currentY - 10); ctx.stroke();
                drawWire(ctx, railX[lits[i].c], currentY + 20, curX, currentY + 10, lits[i].n); 
                drawGateSimple(ctx, gateType, curX, currentY); curX += gateStepX;
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
    if (type === 'AND' || type === 'NAND') {
        ctx.beginPath(); ctx.moveTo(x, y - 15); ctx.lineTo(x + 15, y - 15); ctx.arc(x + 15, y, 15, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x, y + 15); ctx.lineTo(x, y - 15); ctx.fill(); ctx.stroke();
        if (type === 'NAND') { ctx.beginPath(); ctx.arc(x + 33, y, 3, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); }
    } else if (type === 'OR' || type === 'NOR') {
        ctx.beginPath(); ctx.moveTo(x, y - 15); ctx.quadraticCurveTo(x + 15, y - 15, x + 30, y); ctx.quadraticCurveTo(x + 15, y + 15, x, y + 15); ctx.quadraticCurveTo(x + 10, y, x, y - 15); ctx.fill(); ctx.stroke();
        if (type === 'NOR') { ctx.beginPath(); ctx.arc(x + 33, y, 3, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); }
    } else if (type === 'XOR' || type === 'XNOR') {
        ctx.beginPath(); ctx.moveTo(x - 5, y - 15); ctx.quadraticCurveTo(x + 5, y, x - 5, y + 15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y - 15); ctx.quadraticCurveTo(x + 15, y - 15, x + 30, y); ctx.quadraticCurveTo(x + 15, y + 15, x, y + 15); ctx.quadraticCurveTo(x + 10, y, x, y - 15); ctx.fill(); ctx.stroke();
        if (type === 'XNOR') { ctx.beginPath(); ctx.arc(x + 33, y, 3, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); }
    }
}

// --- ABA 6: COMPILADOR DE PINAGEM TTL NATIVO ---
function drawChip() {
    const canvas = document.getElementById('chip-canvas'); if (!canvas) return;
    canvas.style.width = '350px'; canvas.style.height = '300px'; const ctx = setupCanvas(canvas);
    ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 10; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 5;
    ctx.fillStyle = "#222"; ctx.fillRect(25, 50, 300, 200); ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(25, 150, 15, -Math.PI / 2, Math.PI / 2); ctx.fill();
    ctx.fillStyle = "#ddd"; ctx.font = "bold 24px Arial"; ctx.fillText(document.getElementById('chip-selector').value, 130, 155);
    const pinMap = getPinout(document.getElementById('chip-selector').value).map;
    for (let i = 0; i < 7; i++) {
        const x = 55 + (i * 40); ctx.fillStyle = "#9ca3af"; ctx.fillRect(x, 250, 10, 30); ctx.fillRect(x, 20, 10, 30);
        const pBot = pinMap.find(p => p.pin === i + 1); const pTop = pinMap.find(p => p.pin === 14 - i);
        ctx.font = "bold 11px Arial";
        if (pBot) { ctx.fillStyle = getColor(pBot.type); ctx.fillText(pBot.lbl, x - 2, 245); }
        if (pTop) { ctx.fillStyle = getColor(pTop.type); ctx.fillText(pTop.lbl, x - 2, 65); }
    }
}
function getColor(type) { return type === 'VCC' ? '#ef4444' : type === 'GND' ? '#000' : type === 'OUT' ? '#fbbf24' : '#4ade80'; }
function getPinout(type) {
    const vcc = {pin: 14, type: 'VCC', lbl: 'VCC'}, gnd = {pin: 7, type: 'GND', lbl: 'GND'};
    if (type === '7402') return { map: [ {pin: 1, type: 'OUT', lbl: '1Y'}, {pin: 2, type: 'IN', lbl: '1A'}, {pin: 3, type: 'IN', lbl: '1B'}, {pin: 4, type: 'OUT', lbl: '2Y'}, {pin: 5, type: 'IN', lbl: '2A'}, {pin: 6, type: 'IN', lbl: '2B'}, gnd, {pin: 8, type: 'IN', lbl: '3A'}, {pin: 9, type: 'IN', lbl: '3B'}, {pin: 10, type: 'OUT', lbl: '3Y'}, {pin: 11, type: 'IN', lbl: '4A'}, {pin: 12, type: 'IN', lbl: '4B'}, {pin: 13, type: 'OUT', lbl: '4Y'}, vcc ]};
    if (type === '7404') return { map: [ {pin: 1, type: 'IN', lbl: '1A'}, {pin: 2, type: 'OUT', lbl: '1Y'}, {pin: 3, type: 'IN', lbl: '2A'}, {pin: 4, type: 'OUT', lbl: '2Y'}, {pin: 5, type: 'IN', lbl: '3A'}, {pin: 6, type: 'OUT', lbl: '3Y'}, gnd, {pin: 8, type: 'OUT', lbl: '4Y'}, {pin: 9, type: 'IN', lbl: '4A'}, {pin: 10, type: 'OUT', lbl: '5Y'}, {pin: 11, type: 'IN', lbl: '5A'}, {pin: 12, type: 'OUT', lbl: '6Y'}, {pin: 13, type: 'IN', lbl: '6A'}, vcc ]};
    return { map: [ {pin: 1, type: 'IN', lbl: '1A'}, {pin: 2, type: 'IN', lbl: '1B'}, {pin: 3, type: 'OUT', lbl: '1Y'}, {pin: 4, type: 'IN', lbl: '2A'}, {pin: 5, type: 'IN', lbl: '2B'}, {pin: 6, type: 'OUT', lbl: '2Y'}, gnd, {pin: 8, type: 'OUT', lbl: '3Y'}, {pin: 9, type: 'IN', lbl: '3A'}, {pin: 10, type: 'IN', lbl: '3B'}, {pin: 11, type: 'OUT', lbl: '4Y'}, {pin: 12, type: 'IN', lbl: '4A'}, {pin: 13, type: 'IN', lbl: '4B'}, vcc ]};
}

// --- DISPARO DE MOLDURA INICIAL ---
updateGateLogic(); generateTruthTable(); initKMapGrid();

