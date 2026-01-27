/**
 * Site Agendar Page Logic
 * Handles public appointment form submission
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('agendarForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const formContainer = document.getElementById('formContainer');
    const successContainer = document.getElementById('successContainer');

    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const type = document.getElementById('type').value;

        // Button loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Enviando...';
        btnSpinner.classList.remove('hidden');

        try {
            // Send POST request to API (PUBLIC ROUTE - NO TOKEN)
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    phone: phone,
                    type: type
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao enviar agendamento');
            }

            const data = await response.json();
            console.log('Agendamento criado:', data);

            // Show success message
            formContainer.classList.add('hidden');
            successContainer.classList.remove('hidden');

            // Reset form
            form.reset();

        } catch (error) {
            console.error('Erro:', error);
            alert('❌ Erro ao enviar agendamento. Por favor, tente novamente.');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            btnText.textContent = 'Agendar Agora';
            btnSpinner.classList.add('hidden');
        }
    });

    // Reset form function
    window.resetForm = function() {
        formContainer.classList.remove('hidden');
        successContainer.classList.add('hidden');
        form.reset();
    }
});
