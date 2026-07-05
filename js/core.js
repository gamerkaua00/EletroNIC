// --- CREDENCIAIS OFICIAIS DO SEU PAINEL EMAILJS ---
const EMAILJS_PUBLIC_KEY = "Kgh--G2bCKQhGtGc0"; 
const EMAILJS_SERVICE_ID = "service_e3x7nst";
const EMAILJS_TEMPLATE_ID = "template_aes7hzm";

// --- GLOBAL STATE ---
let lastCalculatedEquation = "";
console.log("EletroNIC Iniciado. Copyright © 2026 KMZ. Todos os direitos reservados.");

// --- SPLASH SCREEN LOGIC ---
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
        }, 600);
    }, 2500);
});

// --- UI & TAB SWITCHING ---
function switchTab(tabId, btn) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('section-' + tabId).classList.add('active');
    if(btn) btn.classList.add('active');
    if(tabId==='chips') drawChip();
}

// --- MODAL SYSTEM ---
function showImageModal(dataUrl) {
    const modal = document.getElementById('export-modal');
    const img = document.getElementById('modal-img');
    img.src = dataUrl;
    modal.classList.add('visible');
    
    if(window.AppInventor && window.AppInventor.setWebViewString) {
        window.AppInventor.setWebViewString("IMAGE:" + dataUrl);
    }
}

function closeModal() {
    document.getElementById('export-modal').classList.remove('visible');
}

// --- CANVAS HIGH DPI HELPER ---
function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
}
