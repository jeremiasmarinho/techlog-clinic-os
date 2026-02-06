/**
 * Site Agendar Page Logic
 * Handles public appointment form submission
 */

// Declaração global para resetForm (usada no HTML via onclick)
declare global {
    interface Window {
        resetForm: () => void;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('agendarForm') as HTMLFormElement | null;
    const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement | null;
    const btnText = document.getElementById('btnText') as HTMLElement | null;
    const btnSpinner = document.getElementById('btnSpinner') as HTMLElement | null;
    const formContainer = document.getElementById('formContainer') as HTMLElement | null;
    const successContainer = document.getElementById('successContainer') as HTMLElement | null;

    if (!form) return;

    form.addEventListener('submit', async function (e: Event) {
        e.preventDefault();
        const nameInput = document.getElementById('name') as HTMLInputElement | null;
        const phoneInput = document.getElementById('phone') as HTMLInputElement | null;
        const typeInput = document.getElementById('type') as HTMLSelectElement | null;

        const name = nameInput?.value.trim() ?? '';
        const phone = phoneInput?.value.trim() ?? '';
        const type = typeInput?.value ?? '';

        // Button loading state
        if (submitBtn) submitBtn.disabled = true;
        if (btnText) btnText.textContent = 'Enviando...';
        if (btnSpinner) btnSpinner.classList.remove('hidden');

        try {
            // Send POST request to API (PUBLIC ROUTE - NO TOKEN)
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    phone: phone,
                    type: type,
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao enviar agendamento');
            }

            // Show success message
            if (formContainer) formContainer.classList.add('hidden');
            if (successContainer) successContainer.classList.remove('hidden');

            // Reset form
            form.reset();
        } catch (error) {
            alert('❌ Erro ao enviar agendamento. Por favor, tente novamente.');
        } finally {
            // Reset button state
            if (submitBtn) submitBtn.disabled = false;
            if (btnText) btnText.textContent = 'Agendar Agora';
            if (btnSpinner) btnSpinner.classList.add('hidden');
        }
    });

    // Reset form function
    window.resetForm = function (): void {
        if (formContainer) formContainer.classList.remove('hidden');
        if (successContainer) successContainer.classList.add('hidden');
        form.reset();
    };
});
