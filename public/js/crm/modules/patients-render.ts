/**
 * Patients Render Module - Table rendering
 */

import {
    formatPhone,
    getTypeBadgeColor,
    getStatusBadgeColor,
    formatStatusText,
} from './patients-utils.ts';

declare function formatDateTime(date: string): string;
declare function buildAvatarHTML(name: string, size?: 'sm' | 'md' | 'lg' | 'xl'): string;

interface RenderablePatient {
    id: number;
    name: string;
    phone: string;
    type?: string;
    status: string;
    doctor?: string;
    appointment_date?: string;
    created_at: string;
}

// Render patients table
export function renderPatients(list: RenderablePatient[], viewingArchive: boolean): void {
    const tableBody = document.getElementById('patientsTableBody') as HTMLElement;
    const emptyState = document.getElementById('emptyState') as HTMLElement;

    tableBody.innerHTML = '';

    if (list.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    list.forEach((patient) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition';
        row.dataset.patientId = String(patient.id);

        const typeColor = getTypeBadgeColor(patient.type);
        const statusColor = getStatusBadgeColor(patient.status);
        const statusText = formatStatusText(patient.status);

        // Format creation date
        const createdDate = new Date(patient.created_at).toLocaleDateString('pt-BR');

        // Format appointment date if exists
        let appointmentInfo = '-';
        if (patient.appointment_date) {
            appointmentInfo = formatDateTime(patient.appointment_date);
        }

        // Extract type display text
        let typeDisplay = patient.type || 'Geral';
        if (patient.type && patient.type.startsWith('Consulta - ')) {
            const parts = patient.type.split(' - ');
            typeDisplay = `📋 ${parts[1] || 'Consulta'}`;
        }

        row.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex items-center">
                    ${buildAvatarHTML(patient.name, 'md')}
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${patient.name}</div>
                        <div class="text-sm text-gray-500">${formatPhone(patient.phone)}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${typeColor}">
                    ${typeDisplay}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                    ${statusText}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
                ${patient.doctor || '-'}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
                ${appointmentInfo}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
                ${createdDate}
            </td>
            <td class="px-6 py-4 text-right text-sm font-medium">
                <div class="flex space-x-2 justify-end">
                    <button onclick="openPatientWhatsApp(${patient.id}, event)" class="text-green-600 hover:text-green-900" title="WhatsApp">
                        <i class="fab fa-whatsapp text-lg"></i>
                    </button>
                    ${
                        viewingArchive
                            ? `
                        <button onclick="unarchivePatient(${patient.id})" class="text-blue-600 hover:text-blue-900" title="Desarquivar">
                            <i class="fas fa-undo text-lg"></i>
                        </button>
                    `
                            : `
                        <button onclick="viewPatientHistory(${patient.id})" class="text-blue-600 hover:text-blue-900" title="Ver Histórico">
                            <i class="fas fa-eye text-lg"></i>
                        </button>
                        <button onclick="archivePatient(${patient.id})" class="text-red-600 hover:text-red-900" title="Arquivar">
                            <i class="fas fa-archive text-lg"></i>
                        </button>
                    `
                    }
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });
}
