// --- HISTÓRICO LOCAL ---
// Guarda expressões que o usuário escolheu salvar (Tabela, Mapa K ou Circuito) usando
// localStorage, só no aparelho do usuário. Nada é salvo automaticamente — é sempre uma
// ação explícita do usuário tocar em "Salvar no Histórico", e apagar também é sempre uma
// escolha dele (item por item ou "Limpar Tudo", com confirmação).
const HISTORY_STORAGE_KEY = 'eletronic_history';
const HISTORY_MAX_ITEMS = 50; // evita que o localStorage cresça sem limite

const HISTORY_TYPE_LABELS = { table: 'Tabela', kmap: 'Mapa K', circuit: 'Circuito' };

function getHistoryItems() {
    try {
        const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Erro ao ler o histórico local:', e);
        return [];
    }
}

function saveHistoryItems(items) {
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
        return true;
    } catch (e) {
        console.error('Erro ao salvar o histórico local:', e);
        return false;
    }
}

// type: 'table' | 'kmap' | 'circuit'
function saveToHistory(type, expression) {
    if (!expression || expression === '0' || expression === '1') {
        alert('Não há uma expressão válida pra salvar ainda.');
        return;
    }
    const items = getHistoryItems();
    items.unshift({
        id: Date.now() + '-' + Math.floor(Math.random() * 1000),
        type: type,
        expression: expression,
        timestamp: new Date().toISOString()
    });
    // mantém só os HISTORY_MAX_ITEMS mais recentes
    const trimmed = items.slice(0, HISTORY_MAX_ITEMS);
    if (saveHistoryItems(trimmed)) {
        renderHistoryList();
        const btn = event && event.target ? event.target.closest('button') : null;
        if (btn) {
            const original = btn.innerText;
            btn.innerText = '✓ Salvo!';
            setTimeout(() => { btn.innerText = original; }, 1500);
        }
    }
}

function deleteHistoryItem(id) {
    const items = getHistoryItems().filter(item => item.id !== id);
    saveHistoryItems(items);
    renderHistoryList();
}

function clearHistory() {
    if (getHistoryItems().length === 0) return;
    if (!confirm('Tem certeza que quer apagar todo o histórico? Essa ação não pode ser desfeita.')) return;
    saveHistoryItems([]);
    renderHistoryList();
}

function formatHistoryDate(isoString) {
    try {
        const d = new Date(isoString);
        const pad = n => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
        return '';
    }
}

function renderHistoryList() {
    const container = document.getElementById('history-list');
    if (!container) return;
    const items = getHistoryItems();

    if (items.length === 0) {
        container.innerHTML = '<p class="history-empty">Nada salvo ainda. Use o botão "Salvar no Histórico" na Tabela, no Mapa K ou no Circuito.</p>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="history-item">
            <div class="history-item-info">
                <span class="history-item-badge history-badge-${item.type}">${HISTORY_TYPE_LABELS[item.type] || item.type}</span>
                <div class="history-item-expr">${item.expression}</div>
                <div class="history-item-date">${formatHistoryDate(item.timestamp)}</div>
            </div>
            <div class="history-item-actions">
                <button class="btn-icon" title="Abrir" onclick="openHistoryItem('${item.id}')">↗</button>
                <button class="btn-icon" title="Excluir" onclick="deleteHistoryItem('${item.id}')">🗑</button>
            </div>
        </div>
    `).join('');
}

function openHistoryItem(id) {
    const item = getHistoryItems().find(i => i.id === id);
    if (!item) return;

    if (item.type === 'table') {
        document.getElementById('tt-mode').value = 'custom';
        toggleTableMode();
        const input = document.getElementById('custom-expression');
        input.value = item.expression;
        if (typeof onExpressionChanged === 'function') onExpressionChanged();
        document.querySelectorAll('.nav-btn')[1].click();
        generateTruthTable();
    } else if (item.type === 'kmap') {
        sendToKMap(item.expression);
    } else if (item.type === 'circuit') {
        document.getElementById('circuit-expression-display').innerText = item.expression;
        document.querySelectorAll('.nav-btn')[3].click();
        setTimeout(() => drawCircuit(item.expression), 100);
    }
}
