(function() {
    // 1. Injetar o CSS do Chat (Glassmorphism)
    const style = document.createElement('style');
    style.innerHTML = `
        .techlog-widget { position: fixed; bottom: 20px; right: 20px; z-index: 9999; font-family: sans-serif; }
        .techlog-btn { width: 60px; height: 60px; background: #25D366; border-radius: 50%; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer; display: flex; justify-content: center; align-items: center; transition: transform 0.3s; }
        .techlog-btn:hover { transform: scale(1.1); }
        .techlog-btn img { width: 35px; height: 35px; }
        
        .techlog-chat { display: none; width: 350px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid rgba(255,255,255,0.5); position: absolute; bottom: 80px; right: 0; animation: slideUp 0.3s ease; }
        .chat-header { background: #075E54; color: white; padding: 20px; font-weight: bold; }
        .chat-body { padding: 20px; min-height: 200px; display: flex; flex-direction: column; gap: 10px; }
        .chat-msg { background: #E1F5FE; padding: 10px 15px; border-radius: 15px 15px 15px 0; align-self: flex-start; max-width: 80%; font-size: 14px; color: #333; }
        .chat-input { padding: 10px; border: 1px solid #ddd; border-radius: 8px; width: 100%; box-sizing: border-box; margin-top: 5px; }
        .chat-btn-action { background: #128C7E; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; margin-top: 5px; transition: background 0.2s; }
        .chat-btn-action:hover { background: #075E54; }
        .hidden { display: none; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    // 2. Criar o HTML do Widget
    const widget = document.createElement('div');
    widget.className = 'techlog-widget';
    widget.innerHTML = `
        <div class="techlog-chat" id="chatWindow">
            <div class="chat-header">Clínica Viva - Atendimento</div>
            <div class="chat-body" id="chatBody">
                <div class="chat-msg">Olá! Sou a assistente virtual. Como posso ajudar você hoje?</div>
                <button class="chat-btn-action" onclick="stepIdentify('Consulta')">📅 Agendar Consulta</button>
                <button class="chat-btn-action" onclick="stepIdentify('Exames')">🔬 Orçamento de Exames</button>
            </div>
        </div>
        <div class="techlog-btn" onclick="toggleChat()">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="Chat">
        </div>
    `;
    document.body.appendChild(widget);

    // 3. Lógica do Chat
    window.toggleChat = function() {
        const chat = document.getElementById('chatWindow');
        chat.style.display = chat.style.display === 'block' ? 'none' : 'block';
    };

    window.stepIdentify = function(tipo) {
        const body = document.getElementById('chatBody');
        body.innerHTML = `
            <div class="chat-msg">Ótimo! Para ${tipo}, qual seu <strong>Nome Completo</strong>?</div>
            <input type="text" id="leadName" class="chat-input" placeholder="Digite seu nome...">
            <div class="chat-msg">E seu <strong>WhatsApp</strong> com DDD?</div>
            <input type="tel" id="leadPhone" class="chat-input" placeholder="(63) 99999-9999">
            <button class="chat-btn-action" onclick="submitLead('${tipo}')">Continuar ➤</button>
        `;
    };

    window.submitLead = async function(tipo) {
        const name = document.getElementById('leadName').value;
        const phone = document.getElementById('leadPhone').value;
        const btn = document.querySelector('button');

        if(!name || !phone) { alert('Por favor, preencha tudo!'); return; }

        btn.innerText = 'Processando...';
        btn.disabled = true;

        try {
            // ENVIA PARA SUA API NA VPS
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, type: tipo })
            });
            const data = await response.json();

            // SUCESSO
            const body = document.getElementById('chatBody');
            body.innerHTML = `
                <div class="chat-msg">✅ Tudo certo, ${name}!</div>
                <div class="chat-msg">Sua solicitação foi priorizada. Clique abaixo para finalizar com a secretária:</div>
                <a href="${data.whatsapp_link}&text=Olá, sou ${name} e gostaria de agendar ${tipo}" target="_blank" style="text-decoration:none;">
                    <button class="chat-btn-action" style="background:#25D366; color:white; font-weight:bold;">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="16" style="vertical-align:middle; margin-right:5px">
                        Abrir WhatsApp
                    </button>
                </a>
            `;
        } catch (error) {
            alert('Erro de conexão. Tente novamente.');
            btn.innerText = 'Tentar Novamente';
            btn.disabled = false;
        }
    };
})();
