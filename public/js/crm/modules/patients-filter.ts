/**
 * Patients Filter Module - Filtering and search logic
 */

interface FilterablePatient {
    name: string;
    phone: string;
    doctor?: string;
    type?: string;
    status: string;
    appointment_date?: string;
}

// Apply filters to patient list
export function applyFilters(
    allPatients: FilterablePatient[],
    viewingArchive: boolean
): FilterablePatient[] {
    const searchInput =
        (document.getElementById('searchInput') as HTMLInputElement | null)?.value.toLowerCase() ||
        '';
    const typeFilter =
        (document.getElementById('typeFilter') as HTMLSelectElement | null)?.value || '';
    const statusFilter =
        (document.getElementById('statusFilter') as HTMLSelectElement | null)?.value || '';
    const dateFilter =
        (document.getElementById('dateFilter') as HTMLSelectElement | null)?.value || '';

    let filtered = [...allPatients];

    // Text search
    if (searchInput) {
        filtered = filtered.filter((patient) => {
            return (
                patient.name.toLowerCase().includes(searchInput) ||
                patient.phone.includes(searchInput) ||
                (patient.doctor && patient.doctor.toLowerCase().includes(searchInput))
            );
        });
    }

    // Type filter
    if (typeFilter) {
        filtered = filtered.filter((patient) => {
            if (typeFilter === 'consulta_detalhada') {
                return patient.type && patient.type.startsWith('Consulta - ');
            }
            return patient.type === typeFilter;
        });
    }

    // Status filter
    if (statusFilter) {
        filtered = filtered.filter((patient) => patient.status === statusFilter);
    }

    // Date filter
    if (dateFilter) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        filtered = filtered.filter((patient) => {
            if (!patient.appointment_date) return false;

            const appointmentDate = new Date(patient.appointment_date);
            appointmentDate.setHours(0, 0, 0, 0);

            switch (dateFilter) {
                case 'today':
                    return appointmentDate.getTime() === today.getTime();
                case 'week': {
                    const weekFromNow = new Date(today);
                    weekFromNow.setDate(weekFromNow.getDate() + 7);
                    return appointmentDate >= today && appointmentDate <= weekFromNow;
                }
                case 'month': {
                    const monthFromNow = new Date(today);
                    monthFromNow.setMonth(monthFromNow.getMonth() + 1);
                    return appointmentDate >= today && appointmentDate <= monthFromNow;
                }
                case 'past':
                    return appointmentDate < today;
                default:
                    return true;
            }
        });
    }

    return filtered;
}

// Clear all filters
export function clearFilters(): void {
    (document.getElementById('searchInput') as HTMLInputElement).value = '';
    (document.getElementById('typeFilter') as HTMLSelectElement).value = '';
    (document.getElementById('statusFilter') as HTMLSelectElement).value = '';
    (document.getElementById('dateFilter') as HTMLSelectElement).value = '';
}
