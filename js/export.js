// --- EXPORT FUNCTIONS (imagem e PDF) ---

function exportCircuitImage() {
    const canvas = document.getElementById('circuit-canvas');
    const dataUrl = canvas.toDataURL("image/png");
    showImageModal(dataUrl);
}

// Desenha uma <table> (id informado) num canvas novo, com o mesmo estilo visual usado
// no resto do app. Reaproveitada tanto pela tabela normal (Porta Única/Expressão Livre)
// quanto pela tabela do modo "Montar Tabela" (que também tem células com X).
function buildTableCanvas(tableId) {
    const table = document.getElementById(tableId);
    if (!table || !table.rows.length) return null;

    const rowHeight = 40;
    const colWidth = 60;
    const padding = 20;
    const width = (table.rows[0].cells.length * colWidth) + (padding * 2);
    const height = (table.rows.length * rowHeight) + (padding * 2);

    const canvas = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, width, height);

    ctx.font = "bold 16px Courier New";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 1;

    for (let i = 0; i < table.rows.length; i++) {
        const row = table.rows[i];
        const y = padding + (i * rowHeight) + (rowHeight / 2);

        ctx.beginPath();
        ctx.moveTo(padding, padding + (i * rowHeight));
        ctx.lineTo(width - padding, padding + (i * rowHeight));
        ctx.strokeStyle = (i === 0 || i === 1) ? "#3b82f6" : "#1e293b";
        ctx.stroke();

        for (let j = 0; j < row.cells.length; j++) {
            const cell = row.cells[j];
            const x = padding + (j * colWidth) + (colWidth / 2);

            let color = "#94a3b8";
            if (i === 0) color = "#f59e0b";
            else {
                if (cell.classList.contains("result-1")) color = "#00ff9d";
                else if (cell.classList.contains("result-0")) color = "#ff3366";
                else if (cell.classList.contains("result-x")) color = "#f59e0b";
            }

            ctx.fillStyle = color;
            ctx.fillText(cell.innerText, x, y);
        }
    }
    ctx.strokeStyle = "#334155";
    ctx.strokeRect(padding, padding, width - (padding * 2), height - (padding * 2));

    return canvas;
}

function exportTableImage() {
    const canvas = buildTableCanvas('truth-table-display');
    if (!canvas) return;
    showImageModal(canvas.toDataURL("image/png"));
}

function exportBuildTableImage() {
    const canvas = buildTableCanvas('build-table-display');
    if (!canvas) return;
    showImageModal(canvas.toDataURL("image/png"));
}

// Desenha a grade do Mapa K (com as mesmas cores/posições da tela) num canvas novo,
// junto com a equação simplificada, pra poder exportar como imagem/PDF.
function buildKMapCanvas() {
    const n = currentVars;
    const cellSize = 55, padding = 30, labelW = 50, titleH = 40, eqH = 50;
    const cols = (n === 2) ? 2 : 4;
    const rows = (n === 4) ? 4 : (n === 3 ? 2 : 2);
    const gridW = cols * cellSize;
    const gridH = rows * cellSize;
    const width = labelW + gridW + padding * 2;
    const height = titleH + cellSize + gridH + eqH + padding * 2; // +cellSize pro cabecalho de colunas

    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 18px Courier New';
    ctx.fillText('Mapa de Karnaugh (' + n + ' variáveis)', width / 2, padding);

    // Reaproveita exatamente a mesma logica de gray-code/posicionamento usada em initKMapGrid,
    // pra garantir que o desenho exportado bate com o que o usuario ve na tela.
    const rowsGray = (n === 4) ? gray4 : gray2;
    const colsGray = (n === 3) ? gray4 : ((n === 4) ? gray4 : gray2);
    const rowLabels = (n === 4) ? ['00', '01', '11', '10'] : ['0', '1'];
    const colLabels = (n >= 3) ? ['00', '01', '11', '10'] : ['0', '1'];

    const gridX = padding + labelW;
    const gridY = padding + titleH;

    ctx.font = 'bold 13px Courier New';
    ctx.fillStyle = '#f59e0b';
    colLabels.forEach((label, c) => {
        ctx.fillText(label, gridX + c * cellSize + cellSize / 2, gridY + cellSize / 2);
    });

    rowLabels.forEach((label, r) => {
        ctx.fillText(label, padding + labelW / 2, gridY + cellSize + r * cellSize + cellSize / 2);
    });

    for (let r = 0; r < rowLabels.length; r++) {
        for (let c = 0; c < colLabels.length; c++) {
            const rVal = rowsGray[r];
            const cVal = colsGray[c];
            let minterm = 0;
            if (n === 4) minterm = (rVal << 2) | cVal;
            else if (n === 3) minterm = (rVal << 2) | cVal;
            else minterm = (rVal << 1) | cVal;

            const cellX = gridX + c * cellSize;
            const cellY = gridY + cellSize + r * cellSize;
            const val = kmapData[minterm];

            ctx.fillStyle = val === 1 ? '#3b82f6' : (val === 2 ? '#f59e0b' : '#0f172a');
            ctx.fillRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4);
            ctx.strokeStyle = '#334155';
            ctx.strokeRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4);

            ctx.fillStyle = val === 0 ? '#64748b' : '#ffffff';
            ctx.font = 'bold 16px Courier New';
            ctx.fillText(val === 2 ? 'X' : String(val), cellX + cellSize / 2, cellY + cellSize / 2);
        }
    }

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px Courier New';
    ctx.fillText('Y = ' + (lastCalculatedEquation || '0'), width / 2, gridY + cellSize + gridH + padding);

    return canvas;
}

function exportKMapImage() {
    const canvas = buildKMapCanvas();
    if (!canvas) return;
    showImageModal(canvas.toDataURL('image/png'));
}

// --- EXPORTAÇÃO EM PDF ---
// Usa a biblioteca jsPDF (carregada via CDN no index.html). Calcula a escala pra caber
// a imagem inteira na página SEM esticar/distorcer (mesma proporção largura/altura do
// canvas original), evitando o problema classico de "imagem quebrada" em PDF.
function exportCanvasToPDF(canvas, title) {
    if (!canvas) return;
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('Não foi possível carregar o gerador de PDF. Verifique sua conexão com a internet e tente novamente.');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const titleSpace = 40;

    const maxW = pageWidth - margin * 2;
    const maxH = pageHeight - margin * 2 - titleSpace;

    // fator de escala UNICO aplicado a largura e altura, pra manter a proporcao original
    const scale = Math.min(maxW / canvas.width, maxH / canvas.height, 1);
    const drawW = canvas.width * scale;
    const drawH = canvas.height * scale;
    const x = (pageWidth - drawW) / 2;
    const y = margin + titleSpace;

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(title, margin, margin + 10);

    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', x, y, drawW, drawH);

    const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'eletronic';
    doc.save(safeName + '.pdf');
}

function exportTablePDF() {
    exportCanvasToPDF(buildTableCanvas('truth-table-display'), 'Tabela Verdade - EletroNIC');
}

function exportBuildTablePDF() {
    exportCanvasToPDF(buildTableCanvas('build-table-display'), 'Tabela Verdade - EletroNIC');
}

function exportKMapPDF() {
    exportCanvasToPDF(buildKMapCanvas(), 'Mapa de Karnaugh - EletroNIC');
}

function exportCircuitPDF() {
    exportCanvasToPDF(document.getElementById('circuit-canvas'), 'Diagrama Logico - EletroNIC');
}
