// --- CALCULATOR & BASE CONVERTER ---
function parseAnyBase(str, base) {
    str = str.replace(',','.'); if(!str) return NaN;
    const parts = str.split('.'); let val = parseInt(parts[0], base);
    if (parts.length > 1) {
        let frac = 0; for(let i=0; i<parts[1].length; i++) { const digit = parseInt(parts[1][i], base); if(!isNaN(digit)) frac += digit * Math.pow(base, -(i+1)); }
        val += frac;
    } return val;
}

function formatAnyBase(num, base) {
    if(isNaN(num)) return "";
    let intPart = Math.floor(num), fracPart = num - intPart, res = intPart.toString(base).toUpperCase();
    if(fracPart > 0.000001) { res += ","; let limit = 8; while(fracPart > 0.000001 && limit > 0) { fracPart *= base; let digit = Math.floor(fracPart); res += digit.toString(base).toUpperCase(); fracPart -= digit; limit--; } }
    return res;
}

function filterCalc(input, baseId) {
    const base = document.getElementById(baseId).value;
    let regex = (base === '2') ? /[^01,.]/g : (base === '10') ? /[^0-9,.]/g : /[^0-9A-Fa-f,.]/g;
    input.value = input.value.replace(regex, '').replace('.',',');
}

function calcUniversal() {
    const baseA = parseInt(document.getElementById('base-a').value), baseB = parseInt(document.getElementById('base-b').value);
    const valA = parseAnyBase(document.getElementById('calc-a').value, baseA), valB = parseAnyBase(document.getElementById('calc-b').value, baseB);
    if(isNaN(valA) || isNaN(valB)) return;
    const op = document.getElementById('calc-op').value;
    let res = (op === '+') ? valA+valB : (op === '-') ? valA-valB : (op === '*') ? valA*valB : (valB!==0?valA/valB:0);
    document.getElementById('calc-results').style.display = 'block';
    document.getElementById('res-dec').innerText = formatAnyBase(res, 10);
    document.getElementById('res-bin').innerText = formatAnyBase(res, 2);
    document.getElementById('res-oct').innerText = formatAnyBase(res, 8);
    document.getElementById('res-hex').innerText = formatAnyBase(res, 16);
}

function convertBase(type) {
    const ids = {dec:'in-dec', bin:'in-bin', oct:'in-oct', hex:'in-hex'};
    let raw = document.getElementById(ids[type]).value.trim();
    if(!raw) { for(let k in ids) if(k!==type) document.getElementById(ids[k]).value=""; return; }
    let num = parseAnyBase(raw, type==='bin'?2:type==='oct'?8:type==='hex'?16:10);
    if(type!=='dec') document.getElementById(ids.dec).value = formatAnyBase(num, 10);
    if(type!=='bin') document.getElementById(ids.bin).value = formatAnyBase(num, 2);
    if(type!=='oct') document.getElementById(ids.oct).value = formatAnyBase(num, 8);
    if(type!=='hex') document.getElementById(ids.hex).value = formatAnyBase(num, 16);
}

function clearConv() { ['in-dec','in-bin','in-oct','in-hex'].forEach(id=>document.getElementById(id).value=""); }
