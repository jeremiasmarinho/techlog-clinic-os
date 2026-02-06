// ============================================
// Calendar - FullCalendar Integration
// ============================================

declare const FullCalendar: {
    Calendar: new (el: HTMLElement, opts: Record<string, unknown>) => FullCalendarInstance;
};

interface FullCalendarInstance {
    render(): void;
    refetchEvents(): void;
}

interface CalendarEventInfo {
    startStr: string;
    endStr: string;
}

interface CalendarDateClickInfo {
    date: Date;
}

interface CalendarEventDropInfo {
    event: CalendarEvent;
    revert(): void;
}

interface CalendarEvent {
    id: string;
    title: string;
    start: Date | null;
    end: Date | null;
    extendedProps: CalendarExtendedProps;
}

interface CalendarExtendedProps {
    phone?: string;
    doctor?: string;
    insurance?: string;
    status?: string;
    payment_status?: string;
    payment_amount?: number | string | null;
}

interface CalendarEventMountInfo {
    event: CalendarEvent;
    el: HTMLElement;
}

interface CalendarEventClickInfo {
    jsEvent: Event;
    event: CalendarEvent;
}

interface AppointmentRow {
    id: string | number;
    patient_name?: string;
    name?: string;
    title?: string;
    start_time?: string;
    appointment_date?: string;
    end_time?: string;
    duration_minutes?: number;
    patient_phone?: string;
    phone?: string;
    doctor?: string;
    insurance?: string;
    insurance_name?: string;
    convenio?: string;
    status?: string;
    payment_status?: string;
    paymentStatus?: string;
    amount?: number;
    value?: number;
    payment_amount?: number;
}

interface AppointmentData {
    patient_name?: string;
    patient_phone?: string;
    insurance?: string;
    start_time?: string;
}

declare function openViewModal(id: string | number): void;
declare function openEditModal(id: string | number): void;

declare function showConfirmModal(options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    icon?: string;
    variant?: string;
}): Promise<boolean>;

declare function showToast(options: {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}): void;

declare const tippy: ((el: HTMLElement, opts: Record<string, unknown>) => void) | undefined;

// Wait for FullCalendar to be loaded
function initCalendar(): void {
    const calendarEl: HTMLElement | null = document.getElementById('calendar');
    if (!calendarEl) {
        return;
    }

    if (!(window as unknown as Record<string, unknown>).FullCalendar) {
        setTimeout(initCalendar, 100);
        return;
    }

    const token: string | null =
        sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken');
    const APPOINTMENTS_URL: string = '/api/appointments';

    const quickModal: HTMLElement | null = document.getElementById('quickScheduleModal');
    const quickForm: HTMLFormElement | null = document.getElementById(
        'quickScheduleForm'
    ) as HTMLFormElement | null;
    const quickDateTime: HTMLInputElement | null = document.getElementById(
        'quickDateTime'
    ) as HTMLInputElement | null;
    const quickPatientName: HTMLInputElement | null = document.getElementById(
        'quickPatientName'
    ) as HTMLInputElement | null;

    function openQuickScheduleModal(date: string): void {
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

    function closeQuickScheduleModal(): void {
        if (!quickModal) return;
        quickModal.classList.add('hidden');
        quickModal.classList.remove('flex');
    }

    (window as unknown as Record<string, unknown>).closeQuickScheduleModal =
        closeQuickScheduleModal;

    if (quickForm) {
        quickForm.addEventListener('submit', async (event: Event): Promise<void> => {
            event.preventDefault();

            const patientName: string = quickPatientName?.value.trim() || '';
            const dateTime: string = quickDateTime?.value || '';
            const phone: string =
                (
                    document.getElementById('quickPatientPhone') as HTMLInputElement | null
                )?.value.trim() || '';
            const insurance: string =
                (
                    document.getElementById('quickInsurance') as HTMLInputElement | null
                )?.value.trim() || '';

            if (!patientName || !dateTime) {
                showToast({
                    message: 'Por favor, preencha o nome do paciente e a data/hora',
                    type: 'warning',
                });
                return;
            }

            try {
                const appointmentDate: Date = new Date(dateTime);
                const endDate: Date = new Date(appointmentDate);
                endDate.setMinutes(endDate.getMinutes() + 60); // 1 hora de duração padrão

                // Check if we're in edit mode
                const editId: string | undefined = quickForm.dataset.editId;
                const isEdit: boolean = !!editId;

                const url: string = isEdit ? `/api/appointments/${editId}` : '/api/appointments';
                const method: string = isEdit ? 'PATCH' : 'POST';

                const response: Response = await fetch(url, {
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
                const modalTitle: HTMLElement | null = quickModal?.querySelector('h3') ?? null;
                if (modalTitle) modalTitle.textContent = '📅 Novo Agendamento';
                const submitBtn: HTMLButtonElement | null =
                    quickForm.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>Salvar';

                // Recarrega os eventos do calendário
                calendar.refetchEvents();

                showToast({
                    message: isEdit
                        ? 'Agendamento atualizado com sucesso!'
                        : 'Agendamento criado com sucesso!',
                    type: 'success',
                });
            } catch (error: unknown) {
                const errorMsg =
                    error instanceof Error ? error.message : 'Erro ao processar agendamento';
                showToast({ message: errorMsg, type: 'error' });
            }
        });
    }

    function formatToLocalInput(date: Date): string {
        const local: Date = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 16);
    }

    function addMinutes(isoString: string, minutes: number): string {
        const date: Date = new Date(isoString);
        date.setMinutes(date.getMinutes() + minutes);
        return date.toISOString();
    }

    function statusToClass(status: string): string {
        const normalized: string = (status || '').toLowerCase();
        if (['confirmed', 'confirmado'].includes(normalized)) return 'status-confirmed';
        if (['completed', 'finalizado', 'atendido'].includes(normalized)) return 'status-completed';
        if (['cancelled', 'cancelado'].includes(normalized)) return 'status-cancelled';
        if (['no_show', 'nao_compareceu'].includes(normalized)) return 'status-no_show';
        // Default: scheduled/pending
        return 'status-scheduled';
    }

    const calendar: FullCalendarInstance = new FullCalendar.Calendar(calendarEl, {
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
                click: function (): void {
                    openQuickScheduleModal(formatToLocalInput(new Date()));
                },
            },
        },
        events: async (
            info: CalendarEventInfo,
            successCallback: (events: Record<string, unknown>[]) => void,
            failureCallback: (error: Error) => void
        ): Promise<void> => {
            try {
                const url: string = `${APPOINTMENTS_URL}?startDate=${encodeURIComponent(info.startStr)}&endDate=${encodeURIComponent(info.endStr)}`;
                const response: Response = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (!response.ok) {
                    throw new Error('Erro ao carregar agendamentos');
                }

                const rows: AppointmentRow[] = await response.json();
                const events: Record<string, unknown>[] = (rows || []).map(
                    (row: AppointmentRow) => {
                        const start: string = row.start_time || row.appointment_date || '';
                        const end: string =
                            row.end_time || addMinutes(start, row.duration_minutes || 30);
                        const title: string =
                            row.patient_name || row.name || row.title || 'Consulta';

                        return {
                            id: row.id,
                            title,
                            start,
                            end,
                            classNames: [statusToClass(row.status || '')],
                            extendedProps: {
                                phone: row.patient_phone || row.phone || '',
                                doctor: row.doctor || '',
                                insurance:
                                    row.insurance ||
                                    row.insurance_name ||
                                    row.convenio ||
                                    'Particular',
                                status: row.status || '',
                                payment_status: row.payment_status || row.paymentStatus || '',
                                payment_amount:
                                    row.amount || row.value || row.payment_amount || null,
                            },
                        };
                    }
                );

                successCallback(events);
            } catch (error: unknown) {
                failureCallback(error instanceof Error ? error : new Error('Unknown error'));
            }
        },
        dateClick: (info: CalendarDateClickInfo): void => {
            const dateValue: string = formatToLocalInput(info.date);
            openQuickScheduleModal(dateValue);
        },
        eventDrop: async (info: CalendarEventDropInfo): Promise<void> => {
            try {
                const response: Response = await fetch(`${APPOINTMENTS_URL}/${info.event.id}`, {
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
            } catch (error: unknown) {
                info.revert();
            }
        },
        eventDidMount: (info: CalendarEventMountInfo): void => {
            const {
                phone,
                insurance,
                status,
                payment_status,
                payment_amount,
            }: CalendarExtendedProps = info.event.extendedProps || {};

            if (payment_status === 'paid') {
                info.el.classList.add('status-paid');
            }

            const iconContainer: HTMLSpanElement = document.createElement('span');
            iconContainer.className = 'fc-event-icons';

            if (status === 'confirmed') {
                const confirmedIcon: HTMLSpanElement = document.createElement('span');
                confirmedIcon.className = 'fc-event-icon fc-event-icon-confirmed';
                confirmedIcon.textContent = '✓';
                iconContainer.appendChild(confirmedIcon);
            }

            if (payment_status === 'paid') {
                const paidIcon: HTMLSpanElement = document.createElement('span');
                paidIcon.className = 'fc-event-icon fc-event-icon-paid';
                paidIcon.textContent = '$';
                iconContainer.appendChild(paidIcon);
            }

            if (iconContainer.childNodes.length) {
                info.el.appendChild(iconContainer);
            }

            const statusLabel: string = status || 'pendente';
            const paymentLabel: string =
                payment_status === 'paid'
                    ? `Pago${payment_amount ? ` (R$ ${Number(payment_amount).toFixed(2).replace('.', ',')})` : ''}`
                    : 'Pendente';

            // Get doctor and insurance from extended props
            const doctor: string = info.event.extendedProps?.doctor || '';
            const insuranceLabel: string = insurance || 'Particular';

            const tooltipContent: string = `
                <div style="text-align: left; font-size: 12px;">
                    <strong>${info.event.title}</strong><br>
                    ${doctor ? `👨‍⚕️ ${doctor}<br>` : ''}
                    🏥 ${insuranceLabel}<br>
                    📋 Status: ${statusLabel}<br>
                    💰 ${paymentLabel}<br>
                    <small style="color: #888; margin-top: 4px; display: block;">Clique para ver detalhes</small>
                </div>
            `;

            if ((window as unknown as Record<string, unknown>).tippy) {
                (
                    (window as unknown as Record<string, unknown>).tippy as (
                        el: HTMLElement,
                        opts: Record<string, unknown>
                    ) => void
                )(info.el, {
                    content: tooltipContent,
                    theme: 'glass',
                    placement: 'top',
                    delay: [300, 0],
                    allowHTML: true,
                    interactive: false,
                    appendTo: document.body,
                });
            } else {
                info.el.setAttribute('title', `${info.event.title} - ${statusLabel}`);
            }
        },
        // Open modal when clicking on event
        eventClick: (info: CalendarEventClickInfo): void => {
            info.jsEvent.preventDefault();
            const eventId: string = info.event.id;

            // Call the openViewModal function from agenda.js (read-only view)
            if (
                typeof (window as unknown as Record<string, unknown>).openViewModal === 'function'
            ) {
                (
                    (window as unknown as Record<string, unknown>).openViewModal as (
                        id: string | number
                    ) => void
                )(eventId);
            } else if (
                typeof (window as unknown as Record<string, unknown>).openEditModal === 'function'
            ) {
                (
                    (window as unknown as Record<string, unknown>).openEditModal as (
                        id: string | number
                    ) => void
                )(eventId);
            }
        },
    });

    // Render calendar
    try {
        calendar.render();
    } catch (error: unknown) {
        // Calendar render failed silently
    }

    // Wait for the calendar to actually render in the DOM
    const checkRendered: ReturnType<typeof setInterval> = setInterval(() => {
        if (
            calendarEl.querySelector('.fc-header-toolbar') ||
            calendarEl.querySelector('.fc-view-harness')
        ) {
            clearInterval(checkRendered);
        }
    }, 50);

    // Timeout after 5 seconds
    setTimeout(() => {
        clearInterval(checkRendered);
    }, 5000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalendar);
} else {
    initCalendar();
}

// Global functions for appointment actions
(window as unknown as Record<string, unknown>).editAppointment = async function (
    id: string | number
): Promise<void> {
    const token: string | null =
        sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken');

    // Fetch appointment data
    try {
        const response: Response = await fetch(`/api/appointments/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            showToast({ message: 'Erro ao carregar dados do agendamento', type: 'error' });
            return;
        }

        const appointment: AppointmentData = await response.json();

        // Fill the quick schedule modal with existing data for editing
        const modal: HTMLElement | null = document.getElementById('quickScheduleModal');
        const form: HTMLFormElement | null = document.getElementById(
            'quickScheduleForm'
        ) as HTMLFormElement | null;

        if (modal && form) {
            // Add edit mode indicator
            form.dataset.editId = String(id);

            // Fill form fields
            const dateField: HTMLInputElement | null = document.getElementById(
                'quickDateTime'
            ) as HTMLInputElement | null;
            const nameField: HTMLInputElement | null = document.getElementById(
                'quickPatientName'
            ) as HTMLInputElement | null;
            const phoneField: HTMLInputElement | null = document.getElementById(
                'quickPatientPhone'
            ) as HTMLInputElement | null;
            const insuranceField: HTMLInputElement | null = document.getElementById(
                'quickInsurance'
            ) as HTMLInputElement | null;

            if (dateField && appointment.start_time) {
                const date: Date = new Date(appointment.start_time);
                dateField.value = date.toISOString().slice(0, 16);
            }
            if (nameField) nameField.value = appointment.patient_name || '';
            if (phoneField) phoneField.value = appointment.patient_phone || '';
            if (insuranceField) insuranceField.value = appointment.insurance || '';

            // Change modal title/button to indicate edit mode
            const modalTitle: HTMLElement | null = modal.querySelector('h3');
            if (modalTitle) modalTitle.textContent = '✏️ Editar Agendamento';

            const submitBtn: HTMLButtonElement | null = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-save mr-1"></i>Atualizar';

            // Show modal
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    } catch (error: unknown) {
        showToast({ message: 'Erro ao carregar dados do agendamento', type: 'error' });
    }
};

(window as unknown as Record<string, unknown>).archiveAppointment = async function (
    id: string | number
): Promise<void> {
    const confirmArchive = await showConfirmModal({
        title: 'Arquivar Agendamento',
        message: 'Deseja arquivar este agendamento?',
        confirmText: 'Arquivar',
        cancelText: 'Cancelar',
        variant: 'warning',
        icon: 'fa-box-archive',
    });
    if (!confirmArchive) return;

    const token: string | null =
        sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken');

    try {
        const response: Response = await fetch(`/api/appointments/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: 'cancelled' }),
        });

        if (response.ok) {
            showToast({ message: 'Agendamento arquivado com sucesso!', type: 'success' });
            location.reload();
        } else {
            const data: { error?: string } = await response.json();
            throw new Error(data.error || 'Erro ao arquivar');
        }
    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : 'Erro ao arquivar agendamento';
        showToast({ message: errorMsg, type: 'error' });
    }
};

(window as unknown as Record<string, unknown>).deleteAppointment = async function (
    id: string | number
): Promise<void> {
    const confirmDelete = await showConfirmModal({
        title: 'Excluir Agendamento',
        message:
            'Tem certeza que deseja EXCLUIR este agendamento? Esta ação não pode ser desfeita.',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        variant: 'danger',
        icon: 'fa-trash',
    });
    if (!confirmDelete) return;

    const token: string | null =
        sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken');

    try {
        const response: Response = await fetch(`/api/appointments/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            showToast({ message: 'Agendamento excluído com sucesso!', type: 'success' });
            location.reload();
        } else {
            const data: { error?: string } = await response.json();
            throw new Error(data.error || 'Erro ao excluir');
        }
    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : 'Erro ao excluir agendamento';
        showToast({ message: errorMsg, type: 'error' });
    }
};
