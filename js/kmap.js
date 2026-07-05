// --- K-MAP SOLVER ---
let kmapData = new Array(16).fill(0), currentVars = 4;
let solutionGroups = []; 
const gray4 = [0, 1, 3, 2], gray2 = [0, 1];

function initKMapGrid() {
    const numVars = parseInt(document.getElementById('kmap-vars').value); currentVars = numVars;
    const container = document.getElementById('kmap-container'); container.className = `kmap-grid vars-${numVars}`; container.innerHTML = '';
    kmapData.fill(0); document.getElementById('kmap-equation-text').innerText = "Y = 0"; solutionGroups = [];
    lastCalculatedEquation = "0";
    let rowsGray = numVars===4?gray4:gray2, colsGray = numVars===3?gray4:(numVars===4?gray4:gray2);
    let label = numVars===4?"AB\\CD":(numVars===3?"A\\BC":"A\\B");
    container.innerHTML += `<div class="kmap-corner">${label}</div>`;
    (numVars>=3?['00','01','11','10']:['0','1']).forEach(l => container.innerHTML += `<div class="kmap-header">${l}</div>`);
    (numVars===4?['00','01','11','10']:['0','1']).forEach((rLab, rIdx) => {
        container.innerHTML += `<div class="kmap-header">${rLab}</div>`;
        colsGray.forEach((cVal) => {
            const rVal = rowsGray[rIdx]; let minterm = 0;
            if(numVars===4) minterm=(rVal<<2)|cVal; else if(numVars===3) minterm=(rVal<<2)|cVal; else minterm=(rVal<<1)|cVal;
            container.innerHTML += `<div class="kmap-cell state-0" id="cell-${minterm}" onclick="toggleCell(${minterm})">0</div>`;
        });
    });
}

function toggleCell(idx) { 
    kmapData[idx] = (kmapData[idx]+1)%3; 
    const el = document.getElementById(`cell-${idx}`); 
    el.className = 'kmap-cell'+(kmapData[idx]===1?' state-1':kmapData[idx]===2?' state-x':' state-0'); 
    el.innerText = kmapData[idx]===2?'X':kmapData[idx]; 
}

function highlightGroup(indices) {
    document.querySelectorAll('.kmap-cell').forEach(c => c.classList.remove('educ-highlight'));
    if(!indices) return;
    indices.forEach(idx => {
        const cell = document.getElementById(`cell-${idx}`);
        if(cell) cell.classList.add('educ-highlight');
    });
}

function solveKMap() {
    const minterms = [], dontCares = [], maxM = 1 << currentVars;
    for(let i=0; i<maxM; i++) { if(kmapData[i] === 1) minterms.push(i); if(kmapData[i] === 2) dontCares.push(i); }
    
    const eqBox = document.getElementById('kmap-equation-text');
    if(minterms.length === 0) { 
        eqBox.innerText = "Y = 0"; 
        lastCalculatedEquation = "0"; 
        solutionGroups=[]; return; 
    }
    if(minterms.length === maxM) { 
        eqBox.innerText = "Y = 1"; 
        lastCalculatedEquation = "1"; 
        solutionGroups=[Array.from({length:maxM},(_,i)=>i)]; return; 
    }
    
    const xorPattern = checkSemanticXor(minterms, currentVars);
    if(xorPattern) { 
        const ms = JSON.stringify(minterms);
        eqBox.innerHTML = `Y = <span class="interactive-term" onclick="highlightGroup(${ms})">${xorPattern}</span>`;
        lastCalculatedEquation = xorPattern; 
        solutionGroups=[minterms]; 
        return; 
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
        if(idx < solution.length - 1) html += " + ";
    });
    eqBox.innerHTML = html;
}

function findAllRectangles(ones, dcs, vars) {
    const target = new Set([...ones, ...dcs]), groups = [], R = (vars === 4) ? 4 : 2, C = (vars === 2) ? 2 : 4;
    const mapRC = (r, c) => { const rG = (vars===4)?gray4[r]:gray2[r], cG = (vars===2)?gray2[c]:gray4[c]; return (vars===4)?(rG<<2)|cG : (vars===3?(rG<<2)|cG:(rG<<1)|cG); };
    const sizes = [16, 8, 4, 2, 1].filter(s => s <= (1<<vars)); 
    for(let size of sizes) {
        for(let h=1; h<=size; h++) {
            if(size%h===0) {
                const w = size/h;
                if(h <= R && w <= C) {
                     for(let r=0; r<R; r++) {
                        for(let c=0; c<C; c++) {
                            const ms = []; let ok = true;
                            for(let i=0; i<h; i++) {
                                for(let j=0; j<w; j++) {
                                    const m = mapRC((r+i)%R, (c+j)%C);
                                    if(!target.has(m)) { ok = false; break; }
                                    ms.push(m);
                                } if(!ok) break;
                            } if(ok) { ms.sort((a,b)=>a-b); groups.push({minterms:ms, size:size}); }
                        }
                     }
                }
            }
        }
    } return groups;
}

function filterPrimes(groups) {
    const unique = [], seen = new Set();
    for(let g of groups) { const k = g.minterms.join(','); if(!seen.has(k)) { seen.add(k); unique.push(g); } }
    unique.sort((a,b)=>b.size - a.size);
    const primes = [];
    for(let i=0; i<unique.length; i++) {
        let sub = false;
        for(let j=0; j<unique.length; j++) {
            if(i===j) continue;
            if(unique[j].size > unique[i].size) {
                 const sJ = new Set(unique[j].minterms);
                 if(unique[i].minterms.every(m=>sJ.has(m))) { sub=true; break; }
            }
        } if(!sub) primes.push(unique[i]);
    } return primes;
}

function selectMinimalCover(primes, req) {
    primes.sort((a,b) => {
        if (b.size !== a.size) return b.size - a.size;
        const aWrap = isGroupWrapping(a.minterms);
        const bWrap = isGroupWrapping(b.minterms);
        return (bWrap ? 1 : 0) - (aWrap ? 1 : 0);
    });
    
    let sel = [], todo = new Set(req);
    while(todo.size > 0) {
        let best=null, bestSize=-1, bestCount=-1;
        for(let p of primes) {
            let count=0; for(let m of p.minterms) if(todo.has(m)) count++;
            if (count > 0) {
                if (p.size > bestSize) { best = p; bestSize = p.size; bestCount = count; } 
                else if (p.size === bestSize) { 
                     if (count > bestCount) { best = p; bestCount = count; }
                     else if (count === bestCount && isGroupWrapping(p.minterms)) { best = p; } 
                }
            }
        }
        if(best) { sel.push(best); best.minterms.forEach(x=>todo.delete(x)); } else break;
    } return sel;
}

function isGroupWrapping(minterms) {
    if(minterms.length < 2) return false;
    let min = Math.min(...minterms);
    let max = Math.max(...minterms);
    return (max - min) > (minterms.length * 1.5); 
}

function formatTerm(g, vars) {
    if(g.size === (1<<vars)) return "1";
    let t = ""; const n = ['A','B','C','D'];
    for(let b=0; b<vars; b++) {
        const s = vars - 1 - b; const f = (g.minterms[0] >> s) & 1; let same = true;
        for(let i=1; i<g.minterms.length; i++) if(((g.minterms[i]>>s)&1)!==f) { same=false; break; }
        if(same) t += (f ? n[b] : n[b]+"'");
    } return t;
}

function checkSemanticXor(activeMinterms, vars) {
    const vNames = ['A','B','C','D'].slice(0, vars); const maxVal = 1 << vars; const targetSet = new Set(activeMinterms);
    for(let mask = 1; mask < maxVal; mask++) {
        let matchXor = true, matchXnor = true;
        for(let i=0; i<maxVal; i++) {
            let xorVal = 0;
            for(let bit=0; bit<vars; bit++) if((mask >> (vars - 1 - bit)) & 1) xorVal ^= (i >> (vars - 1 - bit)) & 1;
            const isOne = targetSet.has(i);
            if( (xorVal === 1) !== isOne ) matchXor = false; if( (xorVal === 0) !== isOne ) matchXnor = false;
        }
        if(matchXor || matchXnor) {
            let parts = []; for(let bit=0; bit<vars; bit++) if((mask >> (vars - 1 - bit)) & 1) parts.push(vNames[bit]);
            let str = parts.join(" ⊕ "); if(matchXnor) str = `(${str})'`; return str;
        }
    } return null;
}

function safeXorDetection(terms) {
    const parseTerm = (t) => { const map = {}; const matches = t.matchAll(/([A-D])('?)/g); for (const match of matches) map[match[1]] = (match[2] === "'") ? 0 : 1; return map; };
    let changed = true; let currentTerms = [...terms];
    while(changed) {
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
                    let op = ""; if (sum1 === 1 && sum2 === 1) op = "\u2295"; else if ((sum1===0 && sum2===2) || (sum1===2 && sum2===0)) op = "\u2299";
                    if (op) {
                        let newTerm = `(${v1}${op}${v2})`;
                        if (common.length > 0) { let commonStr = common.map(o => o.val ? o.key : o.key+"'").join(""); newTerm = commonStr + newTerm; }
                        nextTerms.push(newTerm); usedIndices.add(i); usedIndices.add(j); merged = true; changed = true; break;
                    }
                }
            } if (!merged) nextTerms.push(currentTerms[i]);
        } if (changed) currentTerms = nextTerms;
    } return currentTerms.join(" + ");
}

// --- INTERGRAÇÃO ---
function sendToKMap() {
    const expr = document.getElementById('custom-expression').value; if(!expr) return;
    const targetVars = expr.includes('D')?4:expr.includes('C')?3:2;
    document.getElementById('kmap-vars').value = targetVars; initKMapGrid();
    for(let i=0; i<(1<<targetVars); i++) {
        let ctx = {A:0,B:0,C:0,D:0}; for(let v=0;v<targetVars;v++) ctx[['A','B','C','D'][v]] = (i>>(targetVars-1-v))&1;
        if(parseExpression(expr, ctx)) { kmapData[i]=1; document.getElementById('cell-'+i).className = 'kmap-cell state-1'; document.getElementById('cell-'+i).innerText='1'; }
    }
    solveKMap(); document.querySelectorAll('.nav-btn')[2].click();
}

function sendCalculatedToTable() {
    let eq = lastCalculatedEquation;
    if(!eq) eq = "0";
    if(eq.startsWith("Y = ")) eq = eq.substring(4);

    document.getElementById('tt-mode').value = 'custom'; toggleTableMode();
    document.getElementById('custom-expression').value = eq;
    document.querySelectorAll('.nav-btn')[1].click(); generateTruthTable();
}
