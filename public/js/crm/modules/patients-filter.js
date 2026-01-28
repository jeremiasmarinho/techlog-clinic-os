/**
 * Patients Filter Module - Filtering and search logic
 */

// Apply filters to patient list
export function applyFilters(allPatients, viewingArchive) {
    const searchInput = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const dateFilter = document.getElementById('dateFilter')?.value || '';

    let filtered = [...allPatients];

    // Text search
    if (searchInput) {
        filtered = filtered.filter(patient => {
            return (
                patient.name.toLowerCase().includes(searchInput) ||
                patient.phone.includes(searchInput) ||
                (patient.doctor && patient.doctor.toLowerCase().includes(searchInput))
            );
        });
    }

    // Type filter
    if (typeFilter) {
        filtered = filtered.filter(patient => {
            if (typeFilter === 'consulta_detalhada') {
                return patient.type && patient.type.startsWith('Consulta - ');
            }
            return patient.type === typeFilter;
        });
    }

    // Status filter
    if (statusFilter) {
        filtered = filtered.filter(patient => patient.status === statusFilter);
    }

    // Date filter
    if (dateFilter) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        filtered = filtered.filter(patient => {
            if (!patient.appointment_date) return false;
            
            const appointmentDate = new Date(patient.appointment_date);
            appointmentDate.setHours(0, 0, 0, 0);
            
            switch(dateFilter) {
                case 'today':
                    return appointmentDate.getTime() === today.getTime();
                case 'week':
                    const weekFromNow = new Date(today);
                    weekFromNow.setDate(weekFromNow.getDate() + 7);
                    return appointmentDate >= today && appointmentDate <= weekFromNow;
                case 'month':
                    const monthFromNow = new Date(today);
                    monthFromNow.setMonth(monthFromNow.getMonth() + 1);
                    return appointmentDate >= today && appointmentDate <= monthFromNow;
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
export function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFilter').value = '';
}
