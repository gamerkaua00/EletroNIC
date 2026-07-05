// --- EXPORT FUNCTIONS ---
function exportCircuitImage() {
    const canvas = document.getElementById('circuit-canvas');
    const dataUrl = canvas.toDataURL("image/png");
    showImageModal(dataUrl);
}

function exportTableImage() {
    const table = document.getElementById("truth-table-display");
    if (!table.rows.length) return;

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
            }
            
            ctx.fillStyle = color;
            ctx.fillText(cell.innerText, x, y);
        }
    }
    ctx.strokeStyle = "#334155";
    ctx.strokeRect(padding, padding, width - (padding*2), height - (padding*2));

    const dataUrl = canvas.toDataURL("image/png");
    showImageModal(dataUrl);
}
