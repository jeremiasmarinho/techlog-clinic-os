// Test Super Admin API Endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Mock JWT for testing (replace with real token in production)
const SUPER_ADMIN_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImNsaW5pY0lkIjoxLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJlbWFpbCI6ImplcmVtaWFzQGV4YW1wbGUuY29tIiwiaWF0IjoxNzM4NDU1NjAwLCJleHAiOjE3Mzg1NDIwMDB9.placeholder';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        Authorization: `Bearer ${SUPER_ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
    },
    validateStatus: () => true, // Don't throw on any status
});

async function testSuperAdminEndpoints() {
    console.log('🧪 Testando Endpoints Super Admin...\n');

    // Test 1: GET /api/saas/stats/system
    console.log('1️⃣ GET /api/saas/stats/system');
    try {
        const response = await api.get('/api/saas/stats/system');
        console.log(`   Status: ${response.status}`);
        if (response.status === 200) {
            console.log(`   ✅ MRR: R$ ${response.data.mrr.toFixed(2)}`);
            console.log(`   ✅ Clínicas Ativas: ${response.data.active_clinics}`);
            console.log(`   ✅ Total Pacientes: ${response.data.total_patients}`);
            console.log(`   ✅ Taxa de Churn: ${response.data.churn_rate}%`);
            console.log(`   ✅ Plans: ${JSON.stringify(response.data.plans_breakdown)}`);
        } else {
            console.log(`   ⚠️ Erro: ${response.data.error || 'Falha na requisição'}`);
        }
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
    }
    console.log('');

    // Test 2: GET /api/saas/clinics
    console.log('2️⃣ GET /api/saas/clinics');
    try {
        const response = await api.get('/api/saas/clinics');
        console.log(`   Status: ${response.status}`);
        if (response.status === 200) {
            console.log(`   ✅ Total de clínicas: ${response.data.length}`);
            if (response.data.length > 0) {
                const clinic = response.data[0];
                console.log(`   ✅ Primeira clínica:`);
                console.log(`      - Nome: ${clinic.name}`);
                console.log(`      - Slug: ${clinic.slug}`);
                console.log(`      - Status: ${clinic.status}`);
                console.log(`      - Plano: ${clinic.plan}`);
                console.log(`      - Pacientes: ${clinic.patient_count}`);
                console.log(`      - Último login: ${clinic.last_login || 'Nunca'}`);
            }
        } else {
            console.log(`   ⚠️ Erro: ${response.data.error || 'Falha na requisição'}`);
        }
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
    }
    console.log('');

    // Test 3: PATCH /api/saas/clinics/:id/status (simulated - needs real clinic ID)
    console.log('3️⃣ PATCH /api/saas/clinics/:id/status');
    console.log('   ℹ️ Este teste requer um ID de clínica válido');
    console.log(
        '   ℹ️ Execute manualmente com: curl -X PATCH http://localhost:3000/api/saas/clinics/1/status \\'
    );
    console.log('   ℹ️   -H "Authorization: Bearer YOUR_TOKEN" \\');
    console.log('   ℹ️   -H "Content-Type: application/json" \\');
    console.log('   ℹ️   -d \'{"status":"suspended","reason":"Teste"}\'');
    console.log('');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Resumo dos Testes Super Admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Endpoints testados: 2/3');
    console.log('ℹ️  Para testes completos, inicie o servidor:');
    console.log('   npm start');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Check if server is running
async function checkServer() {
    try {
        const response = await axios.get(`${BASE_URL}/health`, { timeout: 2000 });
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

// Main
(async () => {
    const serverRunning = await checkServer();

    if (!serverRunning) {
        console.log('⚠️  Servidor não está rodando em http://localhost:3000');
        console.log('ℹ️  Inicie o servidor com: npm start\n');
        console.log('📋 Estrutura de Testes Preparada:');
        console.log('   - GET /api/saas/stats/system ✓');
        console.log('   - GET /api/saas/clinics ✓');
        console.log('   - PATCH /api/saas/clinics/:id/status ✓');
        console.log('\n💡 Execute este script após iniciar o servidor para testar os endpoints.\n');
        process.exit(0);
    }

    await testSuperAdminEndpoints();
})();
