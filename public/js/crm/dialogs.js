/**
 * Custom Styled Dialogs for Medical CRM
 * Replaces native alert(), confirm() and prompt()
 */

// Override native functions
window.nativeAlert = window.alert;
window.nativeConfirm = window.confirm;
window.nativePrompt = window.prompt;

// Custom Alert
window.alert = function(message) {
    return customAlert(message);
};

// Custom Confirm
window.confirm = function(message) {
    return customConfirm(message);
};

// Custom Prompt
window.prompt = function(message, defaultValue = '') {
    return customPrompt(message, defaultValue);
};

function customAlert(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in';
        
        overlay.innerHTML = `
            <div class="glass-card rounded-2xl p-6 max-w-md mx-4 animate-scale-in shadow-2xl border border-white/10">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <i class="fas fa-info-circle text-3xl text-cyan-400"></i>
                    </div>
                    <p class="text-white text-lg leading-relaxed whitespace-pre-line">${escapeHtml(message)}</p>
                </div>
                <button class="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all">
                    OK
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const btn = overlay.querySelector('button');
        btn.focus();
        
        const close = () => {
            overlay.classList.add('animate-fade-out');
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve();
            }, 200);
        };
        
        btn.onclick = close;
        overlay.onclick = (e) => {
            if (e.target === overlay) close();
        };
        
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape' || e.key === 'Enter') {
                document.removeEventListener('keydown', escHandler);
                close();
            }
        });
    });
}

function customConfirm(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in';
        
        overlay.innerHTML = `
            <div class="glass-card rounded-2xl p-6 max-w-md mx-4 animate-scale-in shadow-2xl border border-white/10">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <i class="fas fa-question-circle text-3xl text-yellow-400"></i>
                    </div>
                    <p class="text-white text-lg leading-relaxed whitespace-pre-line">${escapeHtml(message)}</p>
                </div>
                <div class="flex gap-3">
                    <button data-action="cancel" class="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition-all">
                        Cancelar
                    </button>
                    <button data-action="confirm" class="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all">
                        Confirmar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const confirmBtn = overlay.querySelector('[data-action="confirm"]');
        const cancelBtn = overlay.querySelector('[data-action="cancel"]');
        
        confirmBtn.focus();
        
        const close = (result) => {
            overlay.classList.add('animate-fade-out');
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve(result);
            }, 200);
        };
        
        confirmBtn.onclick = () => close(true);
        cancelBtn.onclick = () => close(false);
        
        overlay.onclick = (e) => {
            if (e.target === overlay) close(false);
        };
        
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', escHandler);
                close(false);
            } else if (e.key === 'Enter') {
                document.removeEventListener('keydown', escHandler);
                close(true);
            }
        });
    });
}

function customPrompt(message, defaultValue = '') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in';
        
        overlay.innerHTML = `
            <div class="glass-card rounded-2xl p-6 max-w-md mx-4 animate-scale-in shadow-2xl border border-white/10">
                <div class="mb-6">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <i class="fas fa-edit text-3xl text-purple-400"></i>
                    </div>
                    <p class="text-white text-lg leading-relaxed whitespace-pre-line mb-4">${escapeHtml(message)}</p>
                    <input 
                        type="text" 
                        class="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 transition"
                        value="${escapeHtml(defaultValue)}"
                        placeholder="Digite aqui..."
                    >
                </div>
                <div class="flex gap-3">
                    <button data-action="cancel" class="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition-all">
                        Cancelar
                    </button>
                    <button data-action="confirm" class="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all">
                        OK
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const input = overlay.querySelector('input');
        const confirmBtn = overlay.querySelector('[data-action="confirm"]');
        const cancelBtn = overlay.querySelector('[data-action="cancel"]');
        
        input.focus();
        input.select();
        
        const close = (result) => {
            overlay.classList.add('animate-fade-out');
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve(result);
            }, 200);
        };
        
        confirmBtn.onclick = () => close(input.value);
        cancelBtn.onclick = () => close(null);
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                close(input.value);
            }
        });
        
        overlay.onclick = (e) => {
            if (e.target === overlay) close(null);
        };
        
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', escHandler);
                close(null);
            }
        });
    });
}

// Custom Prompt with Options (Buttons)
function customPromptOptions(message, options) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in';
        
        const optionsHtml = options.map(opt => `
            <button 
                data-value="${escapeHtml(opt.value)}" 
                class="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-between group">
                <span class="text-left">
                    <i class="${opt.icon} mr-3 text-lg"></i>${escapeHtml(opt.label)}
                </span>
                <i class="fas fa-chevron-right opacity-0 group-hover:opacity-100 transition-opacity"></i>
            </button>
        `).join('');
        
        overlay.innerHTML = `
            <div class="glass-card rounded-2xl p-6 max-w-md mx-4 animate-scale-in shadow-2xl border border-white/10">
                <div class="mb-6">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <i class="fas fa-hand-pointer text-3xl text-cyan-400"></i>
                    </div>
                    <p class="text-white text-lg text-center leading-relaxed whitespace-pre-line mb-6">${escapeHtml(message)}</p>
                    <div class="space-y-3">
                        ${optionsHtml}
                    </div>
                </div>
                <button data-action="cancel" class="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition-all">
                    <i class="fas fa-times mr-2"></i>Cancelar
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const cancelBtn = overlay.querySelector('[data-action="cancel"]');
        const optionBtns = overlay.querySelectorAll('[data-value]');
        
        const close = (result) => {
            overlay.classList.add('animate-fade-out');
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve(result);
            }, 200);
        };
        
        optionBtns.forEach(btn => {
            btn.onclick = () => close(btn.dataset.value);
        });
        
        cancelBtn.onclick = () => close(null);
        
        overlay.onclick = (e) => {
            if (e.target === overlay) close(null);
        };
        
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', escHandler);
                close(null);
            }
        });
    });
}

// Expose customPromptOptions globally
window.customPromptOptions = customPromptOptions;

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add animations to document
if (!document.getElementById('dialog-animations')) {
    const style = document.createElement('style');
    style.id = 'dialog-animations';
    style.textContent = `
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fade-out {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes scale-in {
            from { 
                opacity: 0;
                transform: scale(0.9) translateY(20px);
            }
            to { 
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        .animate-fade-in {
            animation: fade-in 0.2s ease-out;
        }
        .animate-fade-out {
            animation: fade-out 0.2s ease-out;
        }
        .animate-scale-in {
            animation: scale-in 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
}
