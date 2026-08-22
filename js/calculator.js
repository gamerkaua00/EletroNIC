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

// --- Suporte a largura de bits fixa e complemento de 2 ---
const BITWISE_OPS = ['AND', 'OR', 'XOR', 'NOT', 'SHL', 'SHR'];

function getBitWidth() {
    const el = document.getElementById('calc-bitwidth');
    return el ? parseInt(el.value, 10) : 8;
}

function isTwosComplementMode() {
    const el = document.getElementById('calc-mode');
    return el ? el.value === 'twos' : false;
}

// Reduz qualquer valor (positivo, negativo, fora da largura) pro padrão de bits sem sinal
// equivalente dentro da largura escolhida (0 .. 2^width - 1) - é assim que um registrador
// de verdade se comporta quando "estoura".
function toUnsignedBits(value, width) {
    const mod = Math.pow(2, width);
    let v = Math.trunc(value) % mod;
    if (v < 0) v += mod;
    return v;
}

// Interpreta um padrão de bits sem sinal como um valor COM sinal, se o modo complemento
// de 2 estiver ativo (bit mais significativo = 1 -> número negativo).
function interpretSigned(unsignedValue, width, twosComplement) {
    if (!twosComplement) return unsignedValue;
    const half = Math.pow(2, width - 1);
    return unsignedValue >= half ? unsignedValue - Math.pow(2, width) : unsignedValue;
}

// Formata um valor sem sinal numa base, preenchendo com zeros à esquerda até a largura
// de bits escolhida (ex: 5 em binário 8-bit vira "00000101", não só "101").
function formatFixedWidthBase(unsignedValue, base, width) {
    let digits;
    if (base === 2) digits = width;
    else if (base === 8) digits = Math.ceil(width / 3);
    else if (base === 16) digits = Math.ceil(width / 4);
    else digits = 0;
    let s = Math.trunc(unsignedValue).toString(base).toUpperCase();
    if (digits > 0) s = s.padStart(digits, '0');
    return s;
}

function onCalcOpChange() {
    const op = document.getElementById('calc-op').value;
    const isUnary = op === 'NOT';
    const groupB = document.getElementById('calc-b-group');
    if (groupB) groupB.classList.toggle('hidden', isUnary);
}

function calcUniversal() {
    const baseA = parseInt(document.getElementById('base-a').value);
    const baseB = parseInt(document.getElementById('base-b').value);
    const op = document.getElementById('calc-op').value;
    const isUnary = op === 'NOT';

    const rawA = parseAnyBase(document.getElementById('calc-a').value, baseA);
    const rawB = isUnary ? 0 : parseAnyBase(document.getElementById('calc-b').value, baseB);
    if (isNaN(rawA) || (!isUnary && isNaN(rawB))) return;

    document.getElementById('calc-results').style.display = 'block';

    const isBitwise = BITWISE_OPS.includes(op);
    const width = getBitWidth();
    const twos = isTwosComplementMode();

    if (isBitwise) {
        // Operações bit a bit sempre trabalham no padrão de bits (sem sinal), truncado
        // pra largura escolhida.
        const unsignedA = toUnsignedBits(rawA, width);
        const unsignedB = toUnsignedBits(rawB, width);
        let result;
        switch (op) {
            case 'AND': result = unsignedA & unsignedB; break;
            case 'OR': result = unsignedA | unsignedB; break;
            case 'XOR': result = unsignedA ^ unsignedB; break;
            case 'NOT': result = ~unsignedA; break;
            case 'SHL': result = unsignedA << unsignedB; break;
            case 'SHR': result = unsignedA >>> unsignedB; break;
        }
        const displayUnsigned = toUnsignedBits(result, width);
        const displayDecimal = interpretSigned(displayUnsigned, width, twos);
        document.getElementById('res-dec').innerText = String(displayDecimal);
        document.getElementById('res-bin').innerText = formatFixedWidthBase(displayUnsigned, 2, width);
        document.getElementById('res-oct').innerText = formatFixedWidthBase(displayUnsigned, 8, width);
        document.getElementById('res-hex').innerText = formatFixedWidthBase(displayUnsigned, 16, width);
        return;
    }

    // Aritmética (+, -, *, /): interpreta os valores digitados como padrão de bits e,
    // se o modo complemento de 2 estiver ativo, reinterpreta como valor com sinal antes
    // de operar.
    const signedA = interpretSigned(toUnsignedBits(rawA, width), width, twos);
    const signedB = interpretSigned(toUnsignedBits(rawB, width), width, twos);

    if (op === '/' && signedB === 0) {
        // FIX: divisão por zero antes retornava 0 silenciosamente, fazendo parecer
        // que essa era a resposta real. Agora mostramos um erro explícito.
        ['res-dec','res-bin','res-oct','res-hex'].forEach(id => document.getElementById(id).innerText = 'Erro: ÷0');
        return;
    }

    let result = (op === '+') ? signedA+signedB : (op === '-') ? signedA-signedB : (op === '*') ? signedA*signedB : signedA/signedB;

    if (!Number.isInteger(result)) {
        // Resultado fracionário (ex: divisão não exata) - largura fixa não se aplica a
        // frações, então mantém o comportamento livre de sempre.
        document.getElementById('res-dec').innerText = formatAnyBase(result, 10);
        document.getElementById('res-bin').innerText = formatAnyBase(result, 2);
        document.getElementById('res-oct').innerText = formatAnyBase(result, 8);
        document.getElementById('res-hex').innerText = formatAnyBase(result, 16);
        return;
    }

    const displayUnsigned = toUnsignedBits(result, width);
    const displayDecimal = twos ? interpretSigned(displayUnsigned, width, true) : displayUnsigned;
    document.getElementById('res-dec').innerText = String(displayDecimal);
    document.getElementById('res-bin').innerText = formatFixedWidthBase(displayUnsigned, 2, width);
    document.getElementById('res-oct').innerText = formatFixedWidthBase(displayUnsigned, 8, width);
    document.getElementById('res-hex').innerText = formatFixedWidthBase(displayUnsigned, 16, width);
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
