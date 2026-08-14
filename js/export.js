// --- EXPORT FUNCTIONS (imagem e PDF) ---
// As funções de "print" avulsas (exportCircuitImage, exportTableImage, etc.) foram
// removidas daqui: o print agora só acontece automaticamente, como último recurso
// dentro de deliverPDF(), quando o aparelho não consegue gerar/entregar o PDF de
// nenhuma forma. Isso evita ter 2 botões fazendo praticamente a mesma coisa.

// Plugins nativos do Cordova (cordova.file, cordova.plugins.fileOpener2) só ficam
// disponíveis depois do evento "deviceready". Na prática ele dispara muito cedo (bem
// antes do usuário conseguir navegar até a tela de exportar), mas por segurança
// registramos quando isso acontece, pra nunca tentar usar os plugins antes da hora.
let __cordovaDeviceReady = false;
if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('deviceready', function () {
        __cordovaDeviceReady = true;
        console.log('Cordova deviceready disparado - plugins nativos disponiveis.');
    }, false);
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

// Desenha a expressão (ex: "Y = A+B'C") como um cabeçalho no topo de um canvas já
// existente, devolvendo um canvas NOVO e maior (cabeçalho + conteúdo original). A ideia é
// bater com o que o Mapa K já fazia (a equação sempre aparece dentro da própria imagem),
// aplicando o mesmo padrão pra Tabela e Circuito — isso garante que a expressão apareça
// tanto no PDF de verdade quanto na imagem de fallback (que usa esse mesmo canvas).
function addExpressionHeader(sourceCanvas, expression, theme) {
    if (!sourceCanvas) return null;
    if (!expression || expression === '0' || expression === '1') return sourceCanvas;

    const colors = theme === 'light'
        ? { bg: '#ffffff', text: '#1e293b' }
        : { bg: '#020617', text: '#f59e0b' };

    const dpr = window.devicePixelRatio || 1;
    const srcWCss = sourceCanvas.width / dpr;
    const srcHCss = sourceCanvas.height / dpr;
    const headerHCss = 50;

    const label = expression.startsWith('Y =') || expression.startsWith('Y=') ? expression : ('Y = ' + expression);

    const combined = document.createElement('canvas');
    combined.width = sourceCanvas.width;
    combined.height = Math.round((srcHCss + headerHCss) * dpr);
    const ctx = combined.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, srcWCss, srcHCss + headerHCss);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px Courier New';
    ctx.fillStyle = colors.text;
    ctx.fillText(label, srcWCss / 2, headerHCss / 2, srcWCss - 20);

    ctx.drawImage(sourceCanvas, 0, headerHCss, srcWCss, srcHCss);

    return combined;
}

// --- EXPORTAÇÃO EM PDF ---
// Usa a biblioteca jsPDF (carregada via CDN no index.html). Calcula a escala pra caber
// a imagem inteira na página SEM esticar/distorcer (mesma proporção largura/altura do
// canvas original), evitando o problema classico de "imagem quebrada" em PDF.
function exportCanvasToPDF(canvas, title) {
    if (!canvas) return;
    // Feedback imediato: dá pra saber na hora que o toque foi registrado, mesmo antes de
    // qualquer geração/entrega de fato acontecer (ajuda a diferenciar "não reagiu ao toque"
    // de "reagiu, mas a entrega falhou depois").
    const btn = (typeof event !== 'undefined' && event && event.target) ? event.target.closest('button') : null;
    let btnOriginalText = null;
    if (btn) { btnOriginalText = btn.innerText; btn.innerText = 'Gerando PDF...'; }
    const restoreBtn = () => { if (btn) setTimeout(() => { btn.innerText = btnOriginalText; }, 800); };

    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('Não foi possível carregar o gerador de PDF. Verifique sua conexão com a internet e tente novamente.');
        restoreBtn();
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
    deliverPDF(doc, safeName + '.pdf', canvas)
        .catch(err => {
            // Rede de segurança extra: mesmo com o try/catch interno do deliverPDF, garante
            // que nenhuma rejeição de Promise escape silenciosamente.
            console.error('Erro inesperado ao entregar o PDF:', err);
            alert('Ocorreu um erro inesperado ao gerar o PDF. Tente novamente.');
        })
        .finally(restoreBtn);
}

// IMPORTANTE: uma versão anterior tentava usar window.open(dataUri, '_system') como
// mecanismo de entrega. Isso causou um problema SÉRIO em alguns aparelhos: em vez de
// repassar a URL pro Android abrir noutro app (como pretendido), o próprio WebView do
// app navegava para dentro da data URI gigante do PDF — e como o WebView não sabe
// renderizar PDF, a tela ficava azul, em branco, e o app parecia travado. Por isso essa
// função NUNCA MAIS deve chamar window.open()/navegação com o conteúdo do PDF.

// Salva o blob como um arquivo de verdade no aparelho (via cordova-plugin-file) e abre
// pelo leitor de PDF nativo do Android (via cordova-plugin-file-opener2), disparando o
// mesmo menu "Abrir com..." do sistema. Esse caminho não depende de nenhuma API de
// navegador (Web Share, download) — é uma ponte nativa do Cordova, mais confiável dentro
// de um WebView. Rejeita a Promise (sem travar nada) se os plugins não estiverem
// disponíveis, deixando a função chamadora cair pros próximos fallbacks.
function saveAndOpenFileNative(blob, filename, mimeType) {
    return new Promise((resolve, reject) => {
        const attempt = () => {
            if (typeof cordova === 'undefined' || !cordova.file || !window.resolveLocalFileSystemURL) {
                reject(new Error('cordova-plugin-file não disponível neste build/aparelho'));
                return;
            }
            const targetDir = cordova.file.externalCacheDirectory || cordova.file.cacheDirectory;
            if (!targetDir) {
                reject(new Error('Nenhum diretório de armazenamento disponível'));
                return;
            }

            window.resolveLocalFileSystemURL(targetDir, function (dirEntry) {
                dirEntry.getFile(filename, { create: true, exclusive: false }, function (fileEntry) {
                    fileEntry.createWriter(function (writer) {
                        writer.onwriteend = function () {
                            if (typeof cordova.plugins === 'undefined' || !cordova.plugins.fileOpener2) {
                                reject(new Error('cordova-plugin-file-opener2 não disponível'));
                                return;
                            }
                            cordova.plugins.fileOpener2.open(fileEntry.nativeURL, mimeType, {
                                success: resolve,
                                error: reject
                            });
                        };
                        writer.onerror = reject;
                        writer.write(blob);
                    }, reject);
                }, reject);
            }, reject);
        };

        // Se o deviceready ainda não disparou por algum motivo (ex: chamada muito cedo),
        // dá uma pequena chance antes de desistir, em vez de rejeitar na hora.
        if (__cordovaDeviceReady || typeof cordova !== 'undefined') {
            attempt();
        } else {
            setTimeout(attempt, 1500);
        }
    });
}

async function deliverPDF(doc, filename, canvas) {
    try {
        const blob = doc.output('blob');

        // 1) Tenta salvar o arquivo de verdade e abrir via Intent nativo do Android —
        // caminho mais confiável dentro de um app Cordova (não depende de APIs de
        // navegador que o WebView pode não suportar).
        try {
            await saveAndOpenFileNative(blob, filename, 'application/pdf');
            return;
        } catch (err) {
            console.error('Salvar/abrir nativo falhou, tentando alternativa:', err);
        }

        // 2) Web Share API como segunda tentativa. Quando funciona, é exatamente o
        // "Abrir com o Google Drive?" que o usuário espera — e quando não funciona/não
        // está disponível, falha de forma segura (exceção capturável), nunca navegando
        // a página nem travando nada.
        if (typeof File !== 'undefined' && navigator.canShare) {
            try {
                const file = new File([blob], filename, { type: 'application/pdf' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: filename });
                    return;
                }
            } catch (err) {
                if (err && err.name === 'AbortError') return; // usuário cancelou de propósito
                console.error('Web Share falhou:', err);
            }
        }
    } catch (err) {
        console.error('Falha ao gerar o PDF para compartilhamento:', err);
    }

    // Não foi possível salvar/compartilhar o PDF automaticamente neste aparelho. Em vez de
    // tentar mais truques de navegação (que já causaram uma tela travada antes), mostramos
    // a mesma visualização em imagem que já funciona de forma confiável no app.
    alert('Não foi possível salvar/compartilhar o PDF automaticamente neste aparelho. Mostrando como imagem — você pode tirar um print pra salvar.');
    if (canvas && typeof showImageModal === 'function') {
        showImageModal(canvas.toDataURL('image/png'));
    }
}

// Descobre qual expressão está sendo mostrada no modo atual da Tabela Verdade (Porta
// Única ou Expressão Livre), pra poder incluir na exportação.
function currentSimpleOrCustomExpressionLabel() {
    const mode = document.getElementById('tt-mode').value;
    if (mode === 'custom') {
        return document.getElementById('custom-expression').value;
    }
    const sel = document.getElementById('tt-type');
    return sel.options[sel.selectedIndex].text; // ex: "A E B (AND)"
}

function exportTablePDF() {
    const raw = buildTableCanvas('truth-table-display');
    const canvas = addExpressionHeader(raw, currentSimpleOrCustomExpressionLabel(), 'dark');
    exportCanvasToPDF(canvas, 'Tabela Verdade - EletroNIC');
}

function exportBuildTablePDF() {
    calculateExpressionFromBuildTable(); // garante que a expressao esteja atualizada
    const raw = buildTableCanvas('build-table-display');
    const canvas = addExpressionHeader(raw, lastCalculatedEquation, 'dark');
    exportCanvasToPDF(canvas, 'Tabela Verdade - EletroNIC');
}

function exportKMapPDF() {
    exportCanvasToPDF(buildKMapCanvas(), 'Mapa de Karnaugh - EletroNIC');
}

function exportCircuitPDF() {
    const raw = document.getElementById('circuit-canvas');
    const expr = document.getElementById('circuit-expression-display').innerText;
    const canvas = addExpressionHeader(raw, expr, 'light');
    exportCanvasToPDF(canvas, 'Diagrama Lógico - EletroNIC');
}
