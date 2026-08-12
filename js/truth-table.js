// --- TRUTH TABLE & SAFE PARSING LOGIC ---
function parseExpression(expr, ctx) {
    try {
        let clean = expr.toUpperCase().replace(/\s+/g, ''); if(!clean) return null;
        if(clean === '0') return false;
        if(clean === '1') return true;

        // 1. MOTOR DE NEGAÇÃO CORRIGIDO: Transforma B' em (!B) e (A+B)' em !(A+B) de forma isolada e segura
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
                    clean = clean.substring(0, start) + '!(' + clean.substring(start, idx) + ')' + clean.substring(idx + 1);
                } else if (/[A-D0-1]/.test(clean[start])) {
                    // Coloca entre parênteses para proteger o token do injetor de AND implícito
                    clean = clean.substring(0, start) + '(!' + clean[start] + ')' + clean.substring(idx + 1);
                } else {
                    clean = clean.replace("'", "");
                }
            } else {
                clean = clean.replace("'", "");
            }
        }

        // 2. INJETOR DE MULTIPLICAÇÃO SEGURO: Só injeta '*' entre variáveis ou parênteses encostados (ex: AB -> A*B, (A)(B) -> (A)*(B))
        clean = clean.replace(/([A-D)])(?=[A-D(])/g, '$1*');

        const atom = "!?(?:[A-D]|[0-1]|\\([^)]+\\))";
        while(clean.includes('\u22BC')) clean = clean.replace(new RegExp(`(${atom})\u22BC(${atom})`), '!($1&&$2)');
        while(clean.includes('\u22BD')) clean = clean.replace(new RegExp(`(${atom})\u22BD(${atom})`), '!($1||$2)');
        
        // 3. Traduz os operadores do app para os operadores nativos estáveis do JavaScript
        clean = clean.replace(/\u2295/g, '!==').replace(/\u2299/g, '===');
        clean = clean.replace(/\+/g, '||').replace(/\*/g, '&&');
        
        for(let v of ['A','B','C','D']) clean = clean.split(v).join(ctx[v] ? 'true' : 'false');

        if(/[^truefalse!&|()=!=>\s]/.test(clean)) {
            console.error("Tentativa de injeção bloqueada:", clean);
            return null;
        }

        return Function('"use strict";return (' + clean + ')')();
    } catch(e) { return null; }
}

function generateTruthTable() {
    const table = document.getElementById('truth-table-display'); table.innerHTML = "";
    let vars = ['A','B'], expression = "";
    if (document.getElementById('tt-mode').value === 'custom') {
        expression = document.getElementById('custom-expression').value || "";
        if(expression.trim() === "") return;
        const foundVars = new Set();
        ['A','B','C','D'].forEach(v => { if(expression.toUpperCase().includes(v)) foundVars.add(v); });
        if(foundVars.size > 0) vars = Array.from(foundVars).sort();
    }
    let html = `<thead><tr>`; vars.forEach(v => html += `<th>${v}</th>`); html += `<th>S</th></tr></thead><tbody>`;
    const rows = 1 << vars.length;
    for(let i=0; i<rows; i++) {
        let ctx = {A:0,B:0,C:0,D:0}, rowHtml = "";
        for(let j=0; j<vars.length; j++) {
            const bit = (i >> (vars.length - 1 - j)) & 1; ctx[vars[j]] = bit; rowHtml += `<td>${bit}</td>`;
        }
        let res = 0;
        if(document.getElementById('tt-mode').value === 'simple') {
            document.getElementById('expression-error').style.display = 'none';
            const t = document.getElementById('tt-type').value, a=ctx.A, b=ctx.B;
            if(t==='AND') res=a&&b; 
            else if(t==='OR') res=a||b; 
            else if(t==='XOR') res=(a !== b) ? 1 : 0;
            else if(t==='NAND') res=!(a&&b); 
            else if(t==='NOR') res=!(a||b);
        } else {
            const er = parseExpression(expression, ctx);
            if(er===null) { document.getElementById('expression-error').style.display = 'block'; return; }
            document.getElementById('expression-error').style.display = 'none';
            res = er;
        }
        html += `<tr>${rowHtml}<td class="result-${res?1:0}">${res?1:0}</td></tr>`;
    }
    html += `</tbody>`; table.innerHTML = html;
}

function toggleTableMode() {
    const mode = document.getElementById('tt-mode').value;
    document.getElementById('mode-simple-controls').classList.toggle('hidden', mode !== 'simple');
    document.getElementById('mode-custom-controls').classList.toggle('hidden', mode !== 'custom');
    document.getElementById('mode-build-controls').classList.toggle('hidden', mode !== 'build');
    document.getElementById('shared-table-output').classList.toggle('hidden', mode === 'build');
    if(mode === 'simple') generateTruthTable();
    if(mode === 'build') initBuildTable();
}

// --- TECLADO: posição de cursor, preview legível e validação em tempo real ---
let ttCursorPos = null;

function updateCursorPos() {
    const i = document.getElementById('custom-expression');
    // Inputs readonly ainda reportam selectionStart no toque/clique
    ttCursorPos = (typeof i.selectionStart === 'number') ? i.selectionStart : i.value.length;
}

function ins(txt) {
    const i = document.getElementById('custom-expression');
    const pos = (ttCursorPos === null) ? i.value.length : ttCursorPos;
    i.value = i.value.slice(0, pos) + txt + i.value.slice(pos);
    ttCursorPos = pos + txt.length;
    // Reaplica a posição do cursor visualmente quando suportado
    try { i.setSelectionRange(ttCursorPos, ttCursorPos); } catch(e) {}
    onExpressionChanged();
}

function backspace() {
    const i = document.getElementById('custom-expression');
    const pos = (ttCursorPos === null) ? i.value.length : ttCursorPos;
    if (pos <= 0) return;
    i.value = i.value.slice(0, pos - 1) + i.value.slice(pos);
    ttCursorPos = pos - 1;
    try { i.setSelectionRange(ttCursorPos, ttCursorPos); } catch(e) {}
    onExpressionChanged();
}

function clearExpression() {
    const i = document.getElementById('custom-expression');
    i.value = '';
    ttCursorPos = 0;
    onExpressionChanged();
}

// Traduz os símbolos da expressão para um texto legível em português, ajudando iniciantes
function expressionToReadable(expr) {
    if (!expr || !expr.trim()) return "Toque nos botões para montar sua expressão";
    let out = expr
        .replace(/\u2295/g, ' XOR ')
        .replace(/\u2299/g, ' XNOR ')
        .replace(/\u22BC/g, ' NAND ')
        .replace(/\u22BD/g, ' NOR ')
        .replace(/\+/g, ' OU ')
        .replace(/\*/g, ' E ')
        .replace(/!/g, ' NÃO ')
        .replace(/\s+/g, ' ')
        .trim();
    return out;
}

// Checagem leve e em tempo real (parênteses balanceados) — o parser continua sendo a validação final
function isLikelyBalanced(expr) {
    let depth = 0;
    for (const ch of expr) {
        if (ch === '(') depth++;
        else if (ch === ')') { depth--; if (depth < 0) return false; }
    }
    return depth === 0;
}

// Detecta posicionamento inválido de operadores em tempo real (ex: variável seguida de NÃO,
// dois operadores binários seguidos, operador logo após "(" etc), sem precisar rodar o parser inteiro.
// Retorna null se não encontrar problema óbvio, ou uma mensagem explicando o problema.
function findStructuralError(expr) {
    const INFIX = new Set(['+', '*', '\u2295', '\u2299', '\u22BC', '\u22BD']);
    const ATOM = new Set(['A', 'B', 'C', 'D', '0', '1']);
    const clean = expr.toUpperCase().replace(/\s+/g, '');
    if (!clean) return null;

    const classify = (ch) => {
        if (ATOM.has(ch)) return 'ATOM';
        if (ch === '!') return 'NOT';
        if (INFIX.has(ch)) return 'INFIX';
        if (ch === '(') return 'LP';
        if (ch === ')') return 'RP';
        return null; // apóstrofo antigo ou caractere desconhecido: não avaliar aqui
    };

    const allowedAfter = {
        START: new Set(['ATOM', 'NOT', 'LP']),
        LP:    new Set(['ATOM', 'NOT', 'LP']),
        NOT:   new Set(['ATOM', 'NOT', 'LP']),
        INFIX: new Set(['ATOM', 'NOT', 'LP']),
        ATOM:  new Set(['INFIX', 'RP', 'ATOM', 'LP']),
        RP:    new Set(['INFIX', 'RP', 'ATOM', 'LP']),
    };

    let prev = 'START';
    for (const ch of clean) {
        const kind = classify(ch);
        if (kind === null) continue; // ignora apóstrofo (compat) e afins
        if (!allowedAfter[prev] || !allowedAfter[prev].has(kind)) {
            if (prev === 'ATOM' && kind === 'NOT') return 'NÃO precisa vir antes de uma variável, não depois.';
            if (prev === 'INFIX' && kind === 'INFIX') return 'Dois operadores seguidos sem uma variável entre eles.';
            if (prev === 'LP' && kind === 'INFIX') return 'Operador logo após "(" — falta uma variável antes.';
            if (kind === 'RP' && (prev === 'NOT' || prev === 'INFIX' || prev === 'LP')) return 'Fechando ")" sem uma variável antes.';
            return 'Posição inválida de operador na expressão.';
        }
        prev = kind;
    }
    if (prev === 'NOT' || prev === 'INFIX' || prev === 'LP') return 'A expressão não pode terminar em operador ou "(".';
    return null;
}

function onExpressionChanged() {
    const i = document.getElementById('custom-expression');
    const preview = document.getElementById('expression-preview');
    if (preview) preview.textContent = expressionToReadable(i.value);

    const errorBox = document.getElementById('expression-error');
    const structHint = document.getElementById('expression-struct-hint');

    if (i.value.trim() === '') {
        i.classList.remove('expr-valid', 'expr-invalid');
        if (errorBox) errorBox.style.display = 'none';
        if (structHint) structHint.style.display = 'none';
        return;
    }

    const structError = findStructuralError(i.value);
    const balanced = isLikelyBalanced(i.value);

    if (errorBox) errorBox.style.display = 'none'; // erro do "Criar Tabela" some ao editar de novo

    if (structHint) {
        if (structError) {
            structHint.textContent = '⚠ ' + structError;
            structHint.style.display = 'block';
        } else {
            structHint.style.display = 'none';
        }
    }

    if (balanced && !structError) {
        i.classList.add('expr-valid');
        i.classList.remove('expr-invalid');
    } else {
        i.classList.add('expr-invalid');
        i.classList.remove('expr-valid');
    }
}

function toggleHelpModal(show) {
    const overlay = document.getElementById('help-modal-overlay');
    if (!overlay) return;
    overlay.classList.toggle('hidden', !show);
}

// --- MODO "MONTAR TABELA": tabela verdade -> expressão calculada ---
// Reaproveita diretamente o motor de minimização do Mapa K (kmapData/currentVars/solveKMap
// em js/kmap.js), já que os dados de um mapa de Karnaugh são indexados exatamente como uma
// tabela verdade (por minterm). Assim a Tabela e o Mapa K sempre ficam em sincronia.

function initBuildTable() {
    // Ao entrar no modo, mostra o estado atual compartilhado (não reseta), pra manter
    // continuidade caso o usuário já tenha montado algo no Mapa K antes.
    document.getElementById('build-vars').value = String(currentVars);
    renderBuildTable();
}

function onBuildVarsChange() {
    const n = document.getElementById('build-vars').value;
    document.getElementById('kmap-vars').value = n;
    initKMapGrid(); // reseta kmapData/currentVars e reconstroi a grade do Mapa K (mesmo escondida)
    document.getElementById('build-equation-text').innerText = 'Y = 0';
    renderBuildTable();
}

function renderBuildTable() {
    const table = document.getElementById('build-table-display');
    if (!table) return;
    const varNames = ['A', 'B', 'C', 'D'].slice(0, currentVars);
    let html = '<thead><tr>';
    varNames.forEach(v => html += `<th>${v}</th>`);
    html += '<th>S</th></tr></thead><tbody>';

    const rows = 1 << currentVars;
    for (let i = 0; i < rows; i++) {
        html += '<tr>';
        for (let b = 0; b < currentVars; b++) {
            const bit = (i >> (currentVars - 1 - b)) & 1;
            html += `<td>${bit}</td>`;
        }
        const val = kmapData[i];
        const cls = val === 1 ? 'result-1' : (val === 2 ? 'result-x' : 'result-0');
        const label = val === 2 ? 'X' : String(val);
        html += `<td class="build-cell ${cls}" onclick="toggleBuildCell(${i})">${label}</td>`;
        html += '</tr>';
    }
    html += '</tbody>';
    table.innerHTML = html;
}

function toggleBuildCell(i) {
    toggleCell(i); // função já existente em js/kmap.js: cicla 0 -> 1 -> X -> 0
    renderBuildTable();
}

function fillBuildTable(value) {
    const maxM = 1 << currentVars;
    for (let i = 0; i < maxM; i++) {
        kmapData[i] = value;
        const el = document.getElementById('cell-' + i);
        if (el) {
            el.className = 'kmap-cell' + (value === 1 ? ' state-1' : ' state-0');
            el.innerText = String(value);
        }
    }
    renderBuildTable();
}

function clearBuildTable() {
    initKMapGrid();
    document.getElementById('build-equation-text').innerText = 'Y = 0';
    renderBuildTable();
}

function calculateExpressionFromBuildTable() {
    solveKMap(); // preenche kmap-equation-text e a variável global lastCalculatedEquation
    const src = document.getElementById('kmap-equation-text');
    document.getElementById('build-equation-text').innerHTML = src.innerHTML;
}

function openBuildTableInKMap() {
    // A grade do Mapa K já está sincronizada com a tabela (mesmo array kmapData/currentVars)
    document.querySelectorAll('.nav-btn')[2].click();
}

function sendBuildTableToCircuit() {
    let e = lastCalculatedEquation;
    if (!e) e = '0';
    if (e.startsWith('Y = ')) e = e.substring(4);
    document.getElementById('circuit-expression-display').innerText = e;
    document.querySelectorAll('.nav-btn')[3].click();
    setTimeout(() => drawCircuit(e), 100);
}
