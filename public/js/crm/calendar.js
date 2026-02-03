// Wait for FullCalendar to be loaded
function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.error('❌ Calendar element not found');
        return;
    }

    if (!window.FullCalendar) {
        console.warn('⏳ FullCalendar not loaded yet, waiting...');
        setTimeout(initCalendar, 100);
        return;
    }

    console.log('✅ Initializing FullCalendar...');

    const token =
        sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken');
    const APPOINTMENTS_URL = '/api/appointments';

    const quickModal = document.getElementById('quickScheduleModal');
    const quickForm = document.getElementById('quickScheduleForm');
    const quickDateTime = document.getElementById('quickDateTime');
    const quickPatientName = document.getElementById('quickPatientName');

    function openQuickScheduleModal(date) {
        if (!quickModal) return;
        quickModal.classList.remove('hidden');
        quickModal.classList.add('flex');
        if (quickDateTime && date) {
            quickDateTime.value = date;
        }
        if (quickPatientName) {
            setTimeout(() => quickPatientName.focus(), 50);
        }
    }

    function closeQuickScheduleModal() {
        if (!quickModal) return;
        quickModal.classList.add('hidden');
        quickModal.classList.remove('flex');
    }

    window.closeQuickScheduleModal = closeQuickScheduleModal;

    if (quickForm) {
        quickForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const patientName = quickPatientName?.value.trim();
            const dateTime = quickDateTime?.value;
            const phone = document.getElementById('quickPatientPhone')?.value.trim();
            const insurance = document.getElementById('quickInsurance')?.value.trim();

            if (!patientName || !dateTime) {
                alert('Por favor, preencha o nome do paciente e a data/hora');
                return;
            }

            try {
                const appointmentDate = new Date(dateTime);
                const endDate = new Date(appointmentDate);
                endDate.setMinutes(endDate.getMinutes() + 60); // 1 hora de duração padrão

                // Check if we're in edit mode
                const editId = quickForm.dataset.editId;
                const isEdit = !!editId;

                const url = isEdit ? `/api/appointments/${editId}` : '/api/appointments';
                const method = isEdit ? 'PATCH' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        patient_name: patientName,
                        patient_phone: phone || '',
                        insurance: insurance || 'Particular',
                        appointment_date: appointmentDate.toISOString(),
                        start_time: appointmentDate.toISOString(),
                        end_time: endDate.toISOString(),
                        duration_minutes: 60,
                        status: 'scheduled',
                        notes: '',
                    }),
                });

                if (!response.ok) {
                    throw new Error(
                        isEdit ? 'Erro ao atualizar agendamento' : 'Erro ao criar agendamento'
                    );
                }

                // Limpa o formulário e remove edit mode
                quickForm.reset();
                delete quickForm.dataset.editId;
                closeQuickScheduleModal();

                // Reset modal title/button
                const modalTitle = quickModal?.querySelector('h3');
                if (modalTitle) modalTitle.textContent = '📅 Novo Agendamento';
                const submitBtn = quickForm.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>Salvar';

                // Recarrega os eventos do calendário
                calendar.refetchEvents();

                alert(
                    isEdit
                        ? '✅ Agendamento atualizado com sucesso!'
                        : '✅ Agendamento criado com sucesso!'
                );
            } catch (error) {
                console.error('Erro:', error);
                alert('❌ ' + error.message);
            }
        });
    }

    function formatToLocalInput(date) {
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 16);
    }

    function addMinutes(isoString, minutes) {
        const date = new Date(isoString);
        date.setMinutes(date.getMinutes() + minutes);
        return date.toISOString();
    }

    function statusToClass(status) {
        const normalized = (status || '').toLowerCase();
        if (['confirmed', 'confirmado'].includes(normalized)) return 'status-confirmed';
        if (['completed', 'finalizado', 'atendido'].includes(normalized)) return 'status-completed';
        if (['cancelled', 'cancelado'].includes(normalized)) return 'status-cancelled';
        if (['no_show', 'nao_compareceu'].includes(normalized)) return 'status-no_show';
        // Default: scheduled/pending
        return 'status-scheduled';
    }

    console.log('Creating FullCalendar instance...');
    console.log('FullCalendar available:', typeof window.FullCalendar);
    console.log('Calendar element:', calendarEl);

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        slotMinTime: '07:00:00',
        slotMaxTime: '20:00:00',
        locale: 'pt-br',
        allDaySlot: false,
        slotDuration: '00:15:00',
        nowIndicator: true,
        height: 'auto',
        expandRows: true,
        editable: true,
        // Better overlap handling
        slotEventOverlap: false,
        eventMaxStack: 3,
        dayMaxEvents: true,
        headerToolbar: {
            left: 'prev,next today newAppointmentButton',
            center: 'title',
            right: 'timeGridWeek,timeGridDay,dayGridMonth',
        },
        customButtons: {
            newAppointmentButton: {
                text: '+ Novo Agendamento',
                click: function () {
                    openQuickScheduleModal(formatToLocalInput(new Date()));
                },
            },
        },
        events: async (info, successCallback, failureCallback) => {
            try {
                const url = `${APPOINTMENTS_URL}?startDate=${encodeURIComponent(info.startStr)}&endDate=${encodeURIComponent(info.endStr)}`;
                const response = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (!response.ok) {
                    throw new Error('Erro ao carregar agendamentos');
                }

                const rows = await response.json();
                const events = (rows || []).map((row) => {
                    const start = row.start_time || row.appointment_date;
                    const end = row.end_time || addMinutes(start, row.duration_minutes || 30);
                    const title = row.patient_name || row.name || row.title || 'Consulta';

                    return {
                        id: row.id,
                        title,
                        start,
                        end,
                        classNames: [statusToClass(row.status)],
                        extendedProps: {
                            phone: row.patient_phone || row.phone || '',
                            insurance: row.insurance || row.insurance_name || row.convenio || '',
                            status: row.status || '',
                            payment_status: row.payment_status || row.paymentStatus || '',
                            payment_amount: row.amount || row.value || row.payment_amount || null,
                        },
                    };
                });

                successCallback(events);
            } catch (error) {
                console.error(error);
                failureCallback(error);
            }
        },
        dateClick: (info) => {
            const dateValue = formatToLocalInput(info.date);
            openQuickScheduleModal(dateValue);
        },
        eventDrop: async (info) => {
            try {
                const response = await fetch(`${APPOINTMENTS_URL}/${info.event.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        start: info.event.start?.toISOString(),
                        end: info.event.end?.toISOString(),
                    }),
                });

                if (!response.ok) {
                    throw new Error('Erro ao atualizar agendamento');
                }
            } catch (error) {
                console.error(error);
                info.revert();
            }
        },
        eventDidMount: (info) => {
            const { phone, insurance, status, payment_status, payment_amount } =
                info.event.extendedProps || {};

            if (payment_status === 'paid') {
                info.el.classList.add('status-paid');
            }

            const iconContainer = document.createElement('span');
            iconContainer.className = 'fc-event-icons';

            if (status === 'confirmed') {
                const confirmedIcon = document.createElement('span');
                confirmedIcon.className = 'fc-event-icon fc-event-icon-confirmed';
                confirmedIcon.textContent = '✓';
                iconContainer.appendChild(confirmedIcon);
            }

            if (payment_status === 'paid') {
                const paidIcon = document.createElement('span');
                paidIcon.className = 'fc-event-icon fc-event-icon-paid';
                paidIcon.textContent = '$';
                iconContainer.appendChild(paidIcon);
            }

            if (iconContainer.childNodes.length) {
                info.el.appendChild(iconContainer);
            }

            const statusLabel = status || 'pendente';
            const paymentLabel =
                payment_status === 'paid'
                    ? `Pago${payment_amount ? ` (R$ ${Number(payment_amount).toFixed(2).replace('.', ',')})` : ''}`
                    : 'Pendente';
            const tooltipContent = `
                <div style="text-align: left;">
                    <strong>${info.event.title}</strong><br>
                    Status: ${statusLabel}<br>
                    Pagamento: ${paymentLabel}<br>
                    <div style="margin-top: 8px; display: flex; gap: 4px;">
                        <button onclick="editAppointment('${info.event.id}')" style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; border: none; cursor: pointer;">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button onclick="archiveAppointment('${info.event.id}')" style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; border: none; cursor: pointer;">
                            <i class="fas fa-archive"></i> Arquivar
                        </button>
                        <button onclick="deleteAppointment('${info.event.id}')" style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; border: none; cursor: pointer;">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            `;

            if (window.tippy) {
                window.tippy(info.el, {
                    content: tooltipContent,
                    theme: 'light-border',
                    placement: 'top',
                    delay: [200, 0],
                    allowHTML: true,
                    interactive: true,
                    appendTo: document.body,
                });
            } else {
                info.el.setAttribute('title', `${info.event.title} - ${statusLabel}`);
            }
        },
    });

    // Render calendar
    console.log('Calling calendar.render()...');
    try {
        calendar.render();
        console.log('calendar.render() completed without error');
    } catch (error) {
        console.error('Error calling calendar.render():', error);
    }

    // Wait for the calendar to actually render in the DOM
    // FullCalendar v6 uses .fc-view-harness or .fc-header-toolbar
    const checkRendered = setInterval(() => {
        if (
            calendarEl.querySelector('.fc-header-toolbar') ||
            calendarEl.querySelector('.fc-view-harness')
        ) {
            clearInterval(checkRendered);
            console.log('✅ FullCalendar rendered successfully');
        }
    }, 50);

    // Timeout after 5 seconds
    setTimeout(() => {
        clearInterval(checkRendered);
        if (
            !calendarEl.querySelector('.fc-header-toolbar') &&
            !calendarEl.querySelector('.fc-view-harness')
        ) {
            console.error('❌ FullCalendar failed to render after 5 seconds');
            console.log('Calendar element HTML:', calendarEl.innerHTML.substring(0, 500));
        }
    }, 5000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalendar);
} else {
    initCalendar();
}

// Global functions for appointment actions
window.editAppointment = async function (id) {
    const token =
        sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken');

    // Fetch appointment data
    try {
        const response = await fetch(`/api/appointments/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            alert('❌ Erro ao carregar dados do agendamento');
            return;
        }

        const appointment = await response.json();

        // Fill the quick schedule modal with existing data for editing
        const modal = document.getElementById('quickScheduleModal');
        const form = document.getElementById('quickScheduleForm');

        if (modal && form) {
            // Add edit mode indicator
            form.dataset.editId = id;

            // Fill form fields
            const dateField = document.getElementById('quickDateTime');
            const nameField = document.getElementById('quickPatientName');
            const phoneField = document.getElementById('quickPatientPhone');
            const insuranceField = document.getElementById('quickInsurance');

            if (dateField && appointment.start_time) {
                const date = new Date(appointment.start_time);
                dateField.value = date.toISOString().slice(0, 16);
            }
            if (nameField) nameField.value = appointment.patient_name || '';
            if (phoneField) phoneField.value = appointment.patient_phone || '';
            if (insuranceField) insuranceField.value = appointment.insurance || '';

            // Change modal title/button to indicate edit mode
            const modalTitle = modal.querySelector('h3');
            if (modalTitle) modalTitle.textContent = '✏️ Editar Agendamento';

            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-save mr-1"></i>Atualizar';

            // Show modal
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    } catch (error) {
        console.error('Erro ao carregar agendamento:', error);
        alert('❌ Erro ao carregar dados do agendamento');
    }
};

window.archiveAppointment = async function (id) {
    if (!confirm('Deseja arquivar este agendamento?')) return;

    const token =
        sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken');

    try {
        const response = await fetch(`/api/appointments/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: 'cancelled' }),
        });

        if (response.ok) {
            alert('✅ Agendamento arquivado com sucesso!');
            location.reload();
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Erro ao arquivar');
        }
    } catch (error) {
        alert('❌ Erro ao arquivar agendamento: ' + error.message);
    }
};

window.deleteAppointment = async function (id) {
    if (
        !confirm(
            'Tem certeza que deseja EXCLUIR este agendamento? Esta ação não pode ser desfeita.'
        )
    )
        return;

    const token =
        sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken');

    try {
        const response = await fetch(`/api/appointments/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            alert('✅ Agendamento excluído com sucesso!');
            location.reload();
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Erro ao excluir');
        }
    } catch (error) {
        alert('❌ Erro ao excluir agendamento: ' + error.message);
    }
};
