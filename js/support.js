// --- LÓGICA DO VOLT IA ---
function openSupportModal() {
    document.getElementById('support-step-1').classList.remove('hidden');
    document.getElementById('support-step-2').classList.add('hidden');
    document.getElementById('support-step-3').classList.add('hidden');
    document.getElementById('support-message').value = "";
    document.getElementById('support-user-email').value = "";
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
    const txt = msgInput.value.trim().toLowerCase();
    const errDiv = document.getElementById('volt-inline-error');
    
    errDiv.style.display = 'none';

    // Validação 1: Validando o preenchimento e formato correto de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!userEmail || !emailRegex.test(userEmail)) {
        errDiv.innerText = "⚠️ Por favor, insira um endereço de e-mail válido para darmos retorno.";
        errDiv.style.display = 'block';
        return;
    }

    // Validação 2: Tamanho da descrição
    if(txt.length < 12) {
        errDiv.innerText = "⚠️ O Volt precisa de mais detalhes! Descreva melhor o erro.";
        errDiv.style.display = 'block';
        return;
    }

    // Análise Básica por palavras-chave
    if(txt.includes("circuito") || txt.includes("desenho") || txt.includes("canvas")) {
        document.getElementById('volt-bubble').innerHTML = "⚡ <strong>Dica do Volt:</strong> Notei que seu problema envolve o Diagrama Lógico. Lembre-se que você pode usar o botão 'Visualizar p/ Print' para expandir o gráfico perfeitamente!";
    } else if(txt.includes("calculadora") || txt.includes("conversor") || txt.includes("base")) {
        document.getElementById('volt-bubble').innerHTML = "⚡ <strong>Dica do Volt:</strong> Identifiquei uma dúvida na Calculadora. Lembre-se que o campo filtra caracteres inválidos automaticamente de acordo com a base!";
    }

    document.getElementById('support-step-1').classList.add('hidden');
    document.getElementById('support-step-2').classList.remove('hidden');

    // SOLUÇÃO ANTI-REPETIÇÃO: Gera um token alfanumérico único de 6 caracteres (Ex: KM942X)
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let generatedTicket = "KM-";
    for (let i = 0; i < 6; i++) {
        generatedTicket += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Organizamos para injetar o e-mail coletado direto no topo do corpo da mensagem
    const fullMessageWithEmail = "Remetente: " + userEmail + "\n\nRelato do Problema:\n" + msgInput.value.trim();

    const templateParams = {
        ticket_id: generatedTicket,
        user_message: fullMessageWithEmail,
        app_version: "1.0 (Cordova Release 2026)"
    };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(function() {
            document.getElementById('ticket-display').innerText = generatedTicket;
            document.getElementById('support-step-2').classList.add('hidden');
            document.getElementById('support-step-3').classList.remove('hidden');
        }, function(error) {
            console.error("Falha no envio do EmailJS:", error);
            alert("Ocorreu um erro de rede ao tentar conectar com os servidores. Verifique sua internet.");
            document.getElementById('support-step-2').classList.add('hidden');
            document.getElementById('support-step-1').classList.remove('hidden');
        });
}
