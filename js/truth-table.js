// --- TRUTH TABLE & SAFE PARSING LOGIC ---
function parseExpression(expr, ctx) {
    try {
        let clean = expr.toUpperCase().replace(/\s+/g, ''); if(!clean) return null;
        if(clean === '0') return false;
        if(clean === '1') return true;

        // Processa as inversões baseadas em aspas
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

        // CORREÇÃO DE MULTIPLICAÇÃO IMPLÍCITA: Injeta '*' entre variáveis adjacentes ou negações encostadas (ex: A'B -> A'*B)
        clean = clean.replace(/([A-D!)]+)(?=[A-D!(])/g, '$1*');

        const atom = "!?(?:[A-D]|[0-1]|\\([^)]+\\))";
        while(clean.includes('\u22BC')) clean = clean.replace(new RegExp(`(${atom})\u22BC(${atom})`), '!($1&&$2)');
        while(clean.includes('\u22BD')) clean = clean.replace(new RegExp(`(${atom})\u22BD(${atom})`), '!($1||$2)');
        
        clean = clean.replace(/([A-D\)])(?=[A-D\(!])/g, '$1&&');
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
            document.getElementById('expression-error').style.display = 'none'; // Limpa erros residuais
            const t = document.getElementById('tt-type').value, a=ctx.A, b=ctx.B;
            if(t==='AND') res=a&&b; 
            else if(t==='OR') res=a||b; 
            else if(t==='XOR') res=(a !== b) ? 1 : 0; // CORREÇÃO: Operação XOR revisada e corrigida
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
    if(mode === 'simple') generateTruthTable();
}
function ins(txt) { document.getElementById('custom-expression').value += txt; }
function backspace() { const i = document.getElementById('custom-expression'); i.value = i.value.slice(0, -1); }
