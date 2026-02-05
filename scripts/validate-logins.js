#!/usr/bin/env node
/**
 * 🔐 Script de Validação de Credenciais
 *
 * Verifica se todas as credenciais documentadas funcionam na API.
 * Execute após alterações no seed ou nas credenciais.
 *
 * Uso: npm run validate:logins
 *      node scripts/validate-logins.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

const CREDENTIALS = [
    // Clínica Padrão
    { username: 'admin', password: 'Mudar123!', desc: 'Admin Padrão' },

    // Clínica Viva
    { username: 'carlos@clinicaviva.com', password: 'Mudar123!', desc: 'Clínica Viva - Admin' },
    { username: 'maria@clinicaviva.com', password: 'Mudar123!', desc: 'Clínica Viva - Recepção' },
    { username: 'joao@clinicaviva.com', password: 'Mudar123!', desc: 'Clínica Viva - Assistente' },

    // Saúde Total
    { username: 'patricia@saudetotal.com', password: 'Mudar123!', desc: 'Saúde Total - Admin' },
    { username: 'pedro@saudetotal.com', password: 'Mudar123!', desc: 'Saúde Total - Recepção' },
];

async function validateLogins() {
    console.log('\n🔐 VALIDAÇÃO DE CREDENCIAIS\n');
    console.log('='.repeat(60));
    console.log(`API: ${API_URL}`);
    console.log('='.repeat(60));

    let passed = 0;
    let failed = 0;
    const failures = [];

    for (const cred of CREDENTIALS) {
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: cred.username, password: cred.password }),
            });

            const data = await res.json();

            if (data.success) {
                console.log(`✅ ${cred.desc}`);
                console.log(`   └─ ${cred.username} (${data.user?.role})`);
                passed++;
            } else {
                console.log(`❌ ${cred.desc}`);
                console.log(`   └─ ${cred.username}: ${data.error}`);
                failed++;
                failures.push(cred);
            }
        } catch (e) {
            console.log(`⚠️  ${cred.desc}`);
            console.log(`   └─ ${cred.username}: Erro de conexão`);
            failed++;
            failures.push({ ...cred, error: 'connection' });
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 RESULTADO: ${passed}/${CREDENTIALS.length} credenciais válidas`);

    if (failed > 0) {
        console.log('\n⚠️  CREDENCIAIS COM FALHA:');
        failures.forEach((f) => {
            console.log(`   - ${f.username} / ${f.password}`);
        });
        console.log('\n💡 AÇÕES SUGERIDAS:');
        console.log('   1. Execute o seed: npx ts-node scripts/seed_multi_tenant.ts');
        console.log('   2. Verifique se a API está rodando');
        console.log('   3. Atualize shared/constants/seed-credentials.ts');
        console.log('   4. Atualize docs/LOGINS.md');
        process.exit(1);
    }

    console.log('\n✅ Todas as credenciais estão funcionando!');
    console.log('   Documentação: docs/LOGINS.md');
    process.exit(0);
}

validateLogins();
