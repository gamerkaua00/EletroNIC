/* ==========================================================================
   js/volt-ia.js - MOTOR DE TRIAGEM E HISTÓRICO (VOLT IA)
   ========================================================================== */

// --- CREDENCIAIS DO SEU PAINEL EMAILJS ---
const EMAILJS_PUBLIC_KEY = "Kgh--G2bCKQhGtGc0"; 
const EMAILJS_SERVICE_ID = "service_e3x7nst";
const EMAILJS_TEMPLATE_ID = "template_aes7hzm";

let isViewingHistory = false;

// --- MANIPULAÇÃO DO HISTÓRICO LOCAL (LOCALSTORAGE) ---
function getLocalTickets() {
    return JSON.parse(localStorage.getItem('eletronic_tickets') || '[]');
}

function saveLocalTickets(tickets) {
    localStorage.setItem('eletronic_tickets', JSON.stringify(tickets));
}

function toggleHistoryView() {
    const btn = document.getElementById('btn-toggle-history');
    const mainView = document.getElementById('support-main-view');
    const historyView = document.getElementById('support-history-view');
    
    if(isViewingHistory) {
        btn.innerText = "Ver Meus Chamados";
        historyView.classList.add('hidden');
        mainView.classList.remove('hidden');
        isViewingHistory = false;
    } else {
        btn.innerText = "Fechar Histórico";
        mainView.classList.add('hidden');
        historyView.classList.remove('hidden');
        renderSupportHistory();
        isViewingHistory = true;
    }
}

function renderSupportHistory() {
    const container = document.getElementById('history-items-container');
    const tickets = getLocalTickets();
    container.innerHTML = "";

    if(tickets.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.9rem; padding:20px 0;">Nenhum chamado gerado ainda.</div>`;
        return;
    }

    tickets.forEach((t, index) => {
        const item = document.createElement('div');
        item.className = "history-item";
        
        let statusSpan = t.status === 'ok' 
            ? `<span class="history-status-ok">✓ Enviado</span>` 
            : `<span class="history-status-pending" onclick="retryPendingTicket(${index})">🔴 Reenviar</span>`;

        item.innerHTML = `
            <div>
                <strong style="color:var(--text); font-family:monospace;">${t.id}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted); max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:2px;">${t.msg}</div>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
                ${statusSpan}
                <button class="btn-del-history" onclick="deleteHistoryItem(${index})">🗑️</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function deleteHistoryItem(index) {
    let tickets = getLocalTickets();
    tickets.splice(index, 1);
    saveLocalTickets(tickets);
    renderSupportHistory();
}

function updateCharCount(textarea) {
    document.getElementById('char-counter').innerText = textarea.value.length + " / 500";
}

// --- COPIAR TICKET PARA ÁREA DE TRANSFERÊNCIA ---
function copyTicketToClipboard() {
    const ticketText = document.getElementById('ticket-display').innerText;
    navigator.clipboard.writeText(ticketText).then(() => {
        const btn = document.getElementById('btn-copy-ticket');
        const originalHTML = btn.innerHTML;
        
        btn.innerHTML = "✓ Copiado!";
        btn.style.color = "var(--neon-green)";
        btn.style.borderColor = "var(--neon-green)";
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.color = "var(--primary)";
            btn.style.borderColor = "var(--primary-dark)";
        }, 2000);
    }).catch(err => {
        console.error("Erro ao acessar a área de transferência: ", err);
    });
}

// --- CONTROLE DE FLUXO INTERNO DO CHAT ---
function openSupportModal() {
    isViewingHistory = false;
    document.getElementById('btn-toggle-history').innerText = "Ver Meus Chamados";
    document.getElementById('support-history-view').classList.add('hidden');
    document.getElementById('support-main-view').classList.remove('hidden');
    
    document.getElementById('support-step-1').classList.remove('hidden');
    document.getElementById('support-step-2').classList.add('hidden');
    document.getElementById('support-step-3').classList.add('hidden');
    
    document.getElementById('support-message').value = "";
    document.getElementById('support-user-email').value = "";
    document.getElementById('char-counter').innerText = "0 / 500";
    document.getElementById('volt-inline-error').style.display = 'none';
    document.getElementById('volt-bubble').innerHTML = "Olá! Eu sou o <strong>Volt</strong>. Qual problema ou bug você encontrou no EletroNIC? Descreva com detalhes para que eu possa ajudar.";
    
    document.getElementById('support-modal').classList.add('visible');
}

function closeSupportModal() {
    document.getElementById('support-modal').classList.remove('visible');
}

function sendSupportTicket() {
    const emailInput = document.getElementById('support-user-email');
    const msgInput = document.getElementById('support-message');
    const userEmail = emailInput.value.trim();
    const txt = msgInput.value.trim();
    const errDiv = document.getElementById('volt-inline-error');
    
    errDiv.style.display = 'none';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!userEmail || !emailRegex.test(userEmail)) {
        errDiv.innerText = "⚠️ Insira um e-mail de retorno válido.";
        errDiv.style.display = 'block';
        return;
    }
    if(txt.length < 12) {
        errDiv.innerText = "⚠️ O Volt precisa de uma descrição maior (mínimo 12 letras).";
        errDiv.style.display = 'block';
        return;
    }

    const lowerTxt = txt.toLowerCase();
    if(lowerTxt.includes("circuito") || lowerTxt.includes("desenho") || lowerTxt.includes("canvas")) {
        document.getElementById('volt-bubble').innerHTML = "⚡ <strong>Dica do Volt:</strong> Notei que seu problema envolve o Diagrama Lógico. Lembre-se que você pode usar o botão 'Visualizar p/ Print' para expandir o gráfico perfeitamente!";
    } else if(lowerTxt.includes("calculadora") || lowerTxt.includes("conversor") || lowerTxt.includes("base")) {
        document.getElementById('volt-bubble').innerHTML = "⚡ <strong>Dica do Volt:</strong> Identifiquei uma dúvida na Calculadora. Lembre-se que o campo filtra caracteres inválidos automaticamente de acordo com a base!";
    }

    document.getElementById('support-step-1').classList.add('hidden');
    document.getElementById('support-step-2').classList.remove('hidden');

    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let generatedTicket = "KM-";
    for (let i = 0; i < 6; i++) generatedTicket += chars.charAt(Math.floor(Math.random() * chars.length));

    const fullMessageWithEmail = "Remetente: " + userEmail + "\n\nRelato do Problema:\n" + txt;
    const templateParams = {
        ticket_id: generatedTicket,
        user_message: fullMessageWithEmail,
        app_version: "1.0 (Cordova Release 2026)"
    };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(function() {
            let tickets = getLocalTickets();
            tickets.push({ id: generatedTicket, email: userEmail, msg: txt, status: 'ok' });
            saveLocalTickets(tickets);

            showSuccessState(generatedTicket, true);
        }, function(error) {
            console.error("Falha de rede EmailJS, salvando offline:", error);
            
            let tickets = getLocalTickets();
            tickets.push({ id: generatedTicket, email: userEmail, msg: txt, status: 'pending' });
            saveLocalTickets(tickets);

            showSuccessState(generatedTicket, false);
        });
}

function showSuccessState(ticketId, isOnline) {
    document.getElementById('ticket-display').innerText = ticketId;
    const icon = document.getElementById('volt-success-icon');
    const title = document.getElementById('volt-success-title');
    const footer = document.getElementById('volt-success-footer');

    if(isOnline) {
        icon.innerText = "✓"; icon.style.color = "var(--success)";
        title.innerText = "Chamado Registrado!";
        footer.innerHTML = "Os detalhes já caíram em <strong>kmzsuportt1@gmail.com</strong>.";
    } else {
        icon.innerText = "⚠"; icon.style.color = "var(--accent)";
        title.innerText = "Salvo Offline!";
        footer.innerHTML = "Estou sem sinal de internet agora! Guardei o ticket no seu <strong>Histórico</strong> para você reenviar quando estiver online.";
    }

    document.getElementById('support-step-2').classList.add('hidden');
    document.getElementById('support-step-3').classList.remove('hidden');
}

function retryPendingTicket(index) {
    let tickets = getLocalTickets();
    let t = tickets[index];
    
    alert("Tentando reenviar ticket " + t.id + " para o servidor...");

    const fullMessageWithEmail = "Remetente: " + t.email + "\n\nRelato do Problema:\n" + t.msg;
    const templateParams = { ticket_id: t.id, user_message: fullMessageWithEmail, app_version: "1.0 (Cordova Release 2026)" };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(function() {
            tickets[index].status = 'ok';
            saveLocalTickets(tickets);
            alert("✓ Ticket " + t.id + " enviado com sucesso!");
            renderSupportHistory();
        }, function(err) {
            alert("🔴 Falha ao sincronizar. Certifique-se de estar conectado à internet.");
        });
}
