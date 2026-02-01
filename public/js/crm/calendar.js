document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl || !window.FullCalendar) {
        return;
    }

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
        quickForm.addEventListener('submit', (event) => {
            event.preventDefault();
            closeQuickScheduleModal();
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
        if (['confirmed', 'confirmado'].includes(normalized)) return 'status-confirmado';
        if (['pending', 'pendente', 'scheduled', 'agendado'].includes(normalized))
            return 'status-pendente';
        if (['cancelled', 'cancelado', 'no_show', 'nao_compareceu'].includes(normalized))
            return 'status-cancelado';
        return 'status-pendente';
    }

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
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay,dayGridMonth',
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
            const tooltipContent = `Paciente: ${info.event.title} | Status: ${statusLabel} | Pagamento: ${paymentLabel}`;

            if (window.tippy) {
                window.tippy(info.el, {
                    content: tooltipContent,
                    theme: 'glass',
                    placement: 'top',
                    delay: [200, 0],
                });
            } else {
                info.el.setAttribute('title', tooltipContent);
            }
        },
    });

    calendar.render();
});
