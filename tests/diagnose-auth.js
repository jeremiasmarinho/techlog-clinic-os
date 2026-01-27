/**
 * Script de Diagnóstico: Sistema de Autenticação JWT
 * Execute: node tests/diagnose-auth.js
 */

const API_URL = 'http://localhost:3001';
const CREDENTIALS = {
    email: 'admin@medicalcrm.com',
    password: 'Mudar123!'
};

async function testAuthFlow() {
    console.log('\n🔍 DIAGNÓSTICO: Sistema de Autenticação JWT\n');
    console.log('━'.repeat(50));
    
    try {
        // PASSO 1: Testar Login
        console.log('\n📝 PASSO 1: Testando Login...');
        console.log(`   Email: ${CREDENTIALS.email}`);
        console.log(`   Senha: ${'*'.repeat(CREDENTIALS.password.length)}`);
        
        const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(CREDENTIALS)
        });
        
        if (!loginResponse.ok) {
            const error = await loginResponse.json();
            console.log(`   ❌ FALHA: ${loginResponse.status} - ${error.error || 'Erro desconhecido'}`);
            console.log('\n💡 SOLUÇÃO:');
            console.log('   1. Verifique o arquivo .env');
            console.log('   2. Confirme: ADMIN_USER=admin@medicalcrm.com');
            console.log('   3. Confirme: ADMIN_PASS=Mudar123!');
            console.log('   4. Execute: pm2 restart techlog-api --update-env');
            return;
        }
        
        const loginData = await loginResponse.json();
        console.log(`   ✅ SUCESSO: Login realizado`);
        console.log(`   👤 Usuário: ${loginData.user.name}`);
        console.log(`   🔑 Token JWT: ${loginData.token.substring(0, 30)}...`);
        
        // PASSO 2: Testar Acesso Protegido
        console.log('\n📝 PASSO 2: Testando Rota Protegida...');
        console.log(`   Endpoint: GET /api/leads`);
        console.log(`   Authorization: Bearer ${loginData.token.substring(0, 20)}...`);
        
        const leadsResponse = await fetch(`${API_URL}/api/leads`, {
            headers: {
                'Authorization': `Bearer ${loginData.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!leadsResponse.ok) {
            const error = await leadsResponse.text();
            console.log(`   ❌ FALHA: ${leadsResponse.status} - Token inválido`);
            console.log(`   Resposta: ${error}`);
            console.log('\n💡 SOLUÇÃO:');
            console.log('   1. Verifique o authMiddleware em src/middleware/auth.middleware.ts');
            console.log('   2. Confirme que JWT_SECRET está no .env');
            console.log('   3. Teste: curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/leads');
            return;
        }
        
        const leadsData = await leadsResponse.json();
        console.log(`   ✅ SUCESSO: Rota protegida acessada`);
        console.log(`   📊 Leads carregados: ${leadsData.length || 0} registros`);
        
        if (leadsData.length > 0) {
            console.log(`   📋 Exemplo: ${leadsData[0].name} - ${leadsData[0].phone}`);
        }
        
        // RESULTADO FINAL
        console.log('\n' + '━'.repeat(50));
        console.log('\n✅ DIAGNÓSTICO COMPLETO: Tudo funcionando!');
        console.log('\n📌 PRÓXIMOS PASSOS:');
        console.log('   1. Teste o login no navegador: http://localhost:3001/login.html');
        console.log('   2. Use as credenciais: admin@medicalcrm.com / Mudar123!');
        console.log('   3. Verifique se o Kanban carrega os leads corretamente');
        console.log('\n' + '━'.repeat(50) + '\n');
        
    } catch (error) {
        console.log('\n❌ ERRO DE CONEXÃO');
        console.log(`   Mensagem: ${error.message}`);
        console.log('\n💡 SOLUÇÃO:');
        console.log('   1. Verifique se o servidor está rodando: pm2 status');
        console.log('   2. Verifique os logs: pm2 logs techlog-api');
        console.log('   3. Reinicie se necessário: pm2 restart techlog-api');
        console.log('\n' + '━'.repeat(50) + '\n');
    }
}

// Executar diagnóstico
testAuthFlow();
