// --- SIMULATOR LOGIC ---

// Calcula a saida de uma porta logica pra quaisquer entradas - usada tanto pelo modo
// Explorar (mini tabela verdade ao vivo) quanto pelo Modo Quiz.
function gateOutput(gate, a, b) {
    switch (gate) {
        case 'AND': return a && b;
        case 'OR': return a || b;
        case 'NOT': return !a;
        case 'NAND': return !(a && b);
        case 'NOR': return !(a || b);
        case 'XOR': return a !== b;
        case 'XNOR': return a === b;
        default: return false;
    }
}

const GATE_EXPLANATIONS = {
    AND: 'AND é 1 somente quando TODAS as entradas são 1.',
    OR: 'OR é 1 quando PELO MENOS UMA entrada é 1.',
    NOT: 'NOT inverte o valor: 0 vira 1, e 1 vira 0.',
    NAND: 'NAND é o inverso do AND: só é 0 quando todas as entradas são 1.',
    NOR: 'NOR é o inverso do OR: só é 1 quando todas as entradas são 0.',
    XOR: 'XOR é 1 quando as entradas são DIFERENTES entre si.',
    XNOR: 'XNOR é 1 quando as entradas são IGUAIS entre si.'
};

function updateGateLogic() {
    const gate = document.getElementById('gate-selector').value;
    const a = document.getElementById('inputA').checked, b = document.getElementById('inputB').checked;
    document.getElementById('inputB-container').style.opacity = gate === 'NOT' ? '0.2' : '1';

    const res = gateOutput(gate, a, b);

    const led = document.getElementById('outputLed');
    led.style.backgroundColor = res ? 'var(--success)' : '#333';
    led.style.boxShadow = res ? '0 0 20px var(--success)' : 'inset 0 2px 5px rgba(0,0,0,0.5)';
    document.getElementById('logic-text').innerHTML = `<span style="color:var(--accent)">${a?1:0}</span> ${gate} <span style="color:var(--accent)">${gate==='NOT'?'':(b?1:0)}</span> = <span style="color:${res?'var(--success)':'var(--danger)'}">${res?1:0}</span>`;

    // Configuração de Cores Dinâmicas dos fios lógicos baseados no estado real (Verde Neon quando ativo)
    const colorA = a ? '#00ff9d' : 'var(--text-muted)';
    const colorB = b ? '#00ff9d' : 'var(--text-muted)';
    const colorOut = res ? '#00ff9d' : 'var(--text-muted)';

    let svg = `<svg viewBox="0 0 100 60" style="width:100%;height:100%"><defs><filter id="glow"><feGaussianBlur stdDeviation="1.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;

    svg += `<path d="M10,20 L30,20" stroke="${colorA}" stroke-width="2"/>`;
    if (gate !== 'NOT') {
        svg += `<path d="M10,40 L30,40" stroke="${colorB}" stroke-width="2"/>`;
    }

    svg += `<text x="50" y="35" fill="var(--primary)" font-weight="bold" font-family="Arial" text-anchor="middle" dominant-baseline="middle" font-size="14">${gate}</text>`;
    svg += `<rect x="30" y="10" width="40" height="40" rx="5" fill="none" stroke="var(--primary)" stroke-width="2" filter="url(#glow)"/>`;

    svg += `<path d="M70,30 L90,30" stroke="${colorOut}" stroke-width="2"/>`;
    svg += `</svg>`;

    document.getElementById('gate-svg').innerHTML = svg;

    // --- Novidades: explicação da porta + mini tabela verdade ao vivo ---
    const explanation = document.getElementById('gate-explanation');
    if (explanation) explanation.textContent = GATE_EXPLANATIONS[gate] || '';
    renderMiniTruthTable(gate, a, b);
}

// Mostra as combinações possíveis da porta atual, destacando qual delas corresponde
// ao estado atual dos switches - ajuda a conectar "o que eu tô mexendo" com "a linha
// da tabela verdade que isso representa".
function renderMiniTruthTable(gate, currentA, currentB) {
    const table = document.getElementById('mini-truth-table');
    if (!table) return;
    const isUnary = gate === 'NOT';

    let html = '<thead><tr><th>A</th>';
    if (!isUnary) html += '<th>B</th>';
    html += '<th>S</th></tr></thead><tbody>';

    const combos = isUnary ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
    combos.forEach(combo => {
        const a = combo[0], b = isUnary ? 0 : combo[1];
        const out = gateOutput(gate, !!a, !!b) ? 1 : 0;
        const isActive = (a === (currentA ? 1 : 0)) && (isUnary || b === (currentB ? 1 : 0));
        html += `<tr class="${isActive ? 'mini-row-active' : ''}"><td>${a}</td>`;
        if (!isUnary) html += `<td>${b}</td>`;
        html += `<td class="${out ? 'result-1' : 'result-0'}">${out}</td></tr>`;
    });
    html += '</tbody>';
    table.innerHTML = html;
}

// --- MODO QUIZ ---
let quizScore = 0, quizTotal = 0, quizCurrentAnswer = null, quizAnswered = false;
const QUIZ_GATES = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'];

function setSimulatorMode(mode) {
    const isQuiz = mode === 'quiz';
    document.getElementById('simulator-explore-mode').classList.toggle('hidden', isQuiz);
    document.getElementById('simulator-quiz-mode').classList.toggle('hidden', !isQuiz);
    document.getElementById('mode-explore-btn').classList.toggle('active', !isQuiz);
    document.getElementById('mode-quiz-btn').classList.toggle('active', isQuiz);
    if (isQuiz) nextQuizQuestion();
}

function nextQuizQuestion() {
    const gate = QUIZ_GATES[Math.floor(Math.random() * QUIZ_GATES.length)];
    const isUnary = gate === 'NOT';
    const a = Math.random() < 0.5 ? 0 : 1;
    const b = isUnary ? 0 : (Math.random() < 0.5 ? 0 : 1);
    quizCurrentAnswer = gateOutput(gate, !!a, !!b) ? 1 : 0;
    quizAnswered = false;

    const desc = isUnary
        ? `Se <strong>A = ${a}</strong>, qual é a saída de <strong>${gate}</strong>?`
        : `Se <strong>A = ${a}</strong> e <strong>B = ${b}</strong>, qual é a saída de <strong>${gate}</strong>?`;
    document.getElementById('quiz-question-text').innerHTML = desc;

    const feedback = document.getElementById('quiz-feedback');
    feedback.classList.add('hidden');
    document.getElementById('quiz-next-btn').classList.add('hidden');

    // Reabilita os botões de resposta pra proxima pergunta
    document.querySelectorAll('.quiz-answer-btn').forEach(b => b.disabled = false);
}

function answerQuiz(choice) {
    if (quizAnswered) return;
    quizAnswered = true;
    quizTotal++;

    const correct = choice === quizCurrentAnswer;
    if (correct) quizScore++;

    document.getElementById('quiz-score').innerText = quizScore;
    document.getElementById('quiz-total').innerText = quizTotal;

    const feedback = document.getElementById('quiz-feedback');
    feedback.textContent = correct ? '✓ Certo!' : `✗ Errado. A resposta certa era ${quizCurrentAnswer}.`;
    feedback.className = 'quiz-feedback ' + (correct ? 'quiz-feedback-correct' : 'quiz-feedback-wrong');
    feedback.classList.remove('hidden');

    document.getElementById('quiz-next-btn').classList.remove('hidden');
    document.querySelectorAll('.quiz-answer-btn').forEach(b => b.disabled = true);
}

function resetQuizScore() {
    quizScore = 0;
    quizTotal = 0;
    document.getElementById('quiz-score').innerText = '0';
    document.getElementById('quiz-total').innerText = '0';
    nextQuizQuestion();
}
