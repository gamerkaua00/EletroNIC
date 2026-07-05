// --- CHIP PINOUT VISUALIZER ---
function drawChip() {
    const canvas = document.getElementById('chip-canvas');
    canvas.style.width = '350px';
    canvas.style.height = '300px';
    const ctx = setupCanvas(canvas);
    
    ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 10; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 5;
    ctx.fillStyle="#222"; ctx.fillRect(25,50,300,200); 
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

    ctx.fillStyle="#111"; ctx.beginPath(); ctx.arc(25, 150, 15, -Math.PI/2, Math.PI/2); ctx.fill();
    ctx.fillStyle="#ddd"; ctx.font="bold 24px Arial"; ctx.fillText(document.getElementById('chip-selector').value, 130, 155);
    
    const pinMap = getPinout(document.getElementById('chip-selector').value).map;
    for(let i=0; i<7; i++) {
        const x = 55 + (i*40); 
        ctx.fillStyle="#9ca3af"; 
        ctx.fillRect(x, 250, 10, 30);
        ctx.fillRect(x, 20, 10, 30);
        
        const pBot = pinMap.find(p=>p.pin===i+1);
        const pTop = pinMap.find(p=>p.pin===14-i);
        
        ctx.font="bold 11px Arial";
        if(pBot) { ctx.fillStyle=getColor(pBot.type); ctx.fillText(pBot.lbl, x-2, 245); }
        if(pTop) { ctx.fillStyle=getColor(pTop.type); ctx.fillText(pTop.lbl, x-2, 65); }
    }
}

function getColor(type) { return type==='VCC'?'#ef4444':type==='GND'?'#000':type==='OUT'?'#fbbf24':'#4ade80'; }

function getPinout(type) {
    const vcc={pin:14,type:'VCC',lbl:'VCC'}, gnd={pin:7,type:'GND',lbl:'GND'};
    if(type==='7402') { return { map: [ {pin:1,type:'OUT',lbl:'1Y'}, {pin:2,type:'IN',lbl:'1A'}, {pin:3,type:'IN',lbl:'1B'}, {pin:4,type:'OUT',lbl:'2Y'}, {pin:5,type:'IN',lbl:'2A'}, {pin:6,type:'IN',lbl:'2B'}, gnd, {pin:8,type:'IN',lbl:'3A'}, {pin:9,type:'IN',lbl:'3B'}, {pin:10,type:'OUT',lbl:'3Y'}, {pin:11,type:'IN',lbl:'4A'}, {pin:12,type:'IN',lbl:'4B'}, {pin:13,type:'OUT',lbl:'4Y'}, vcc ]}; }
    if(type==='7404') { return { map: [ {pin:1,type:'IN',lbl:'1A'}, {pin:2,type:'OUT',lbl:'1Y'}, {pin:3,type:'IN',lbl:'2A'}, {pin:4,type:'OUT',lbl:'2Y'}, {pin:5,type:'IN',lbl:'3A'}, {pin:6,type:'OUT',lbl:'3Y'}, gnd, {pin:8,type:'OUT',lbl:'4Y'}, {pin:9,type:'IN',lbl:'4A'}, {pin:10,type:'OUT',lbl:'5Y'}, {pin:11,type:'IN',lbl:'5A'}, {pin:12,type:'OUT',lbl:'6Y'}, {pin:13,type:'IN',lbl:'6A'}, vcc ]}; }
    return { map: [ {pin:1,type:'IN',lbl:'1A'}, {pin:2,type:'IN',lbl:'1B'}, {pin:3,type:'OUT',lbl:'1Y'}, {pin:4,type:'IN',lbl:'2A'}, {pin:5,type:'IN',lbl:'2B'}, {pin:6,type:'OUT',lbl:'2Y'}, gnd, {pin:8,type:'OUT',lbl:'3Y'}, {pin:9,type:'IN',lbl:'3A'}, {pin:10,type:'IN',lbl:'3B'}, {pin:11,type:'OUT',lbl:'4Y'}, {pin:12,type:'IN',lbl:'4A'}, {pin:13,type:'IN',lbl:'4B'}, vcc ]};
}
