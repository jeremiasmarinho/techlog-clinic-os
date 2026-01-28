/**
 * Dashboard API Module - API interactions and metrics
 */

// Load summary metrics
export async function loadSummaryMetrics(token) {
    const response = await fetch('/api/metrics/resumo', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Erro ao carregar métricas');
    }
    
    return await response.json();
}

// Load dashboard data
export async function loadDashboardData(token) {
    const response = await fetch('/api/leads/dashboard', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao carregar métricas do dashboard');
    }

    return await response.json();
}

// Calculate metrics from data
export function calculateMetrics(data) {
    // Calculate potential revenue
    const consultas = data.byType.find(t => t.type === 'Consulta')?.count || 0;
    const exames = data.byType.find(t => t.type === 'Exame')?.count || 0;
    const revenue = (consultas * 300) + (exames * 150);
    
    // Calculate attendance metrics
    const attended = data.byAttendanceStatus?.find(a => a.attendance_status === 'compareceu')?.count || 0;
    const noShow = data.byAttendanceStatus?.find(a => a.attendance_status === 'nao_compareceu')?.count || 0;
    const canceled = data.byAttendanceStatus?.find(a => a.attendance_status === 'cancelado')?.count || 0;
    const total = attended + noShow + canceled;
    
    const attendanceRate = total > 0 ? ((attended / total) * 100).toFixed(1) : '0';
    const noShowRate = total > 0 ? ((noShow / total) * 100).toFixed(1) : '0';
    
    return {
        revenue,
        attended,
        noShow,
        canceled,
        attendanceRate,
        noShowRate
    };
}
