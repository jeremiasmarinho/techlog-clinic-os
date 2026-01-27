import dotenv from 'dotenv';
dotenv.config();

console.log('--- INÍCIO DO DIAGNÓSTICO ---');
console.log('1. Verificando Variáveis de Ambiente:');
if (!process.env.ADMIN_USER) console.error('❌ ERRO: ADMIN_USER não encontrado no .env');
else console.log(`✅ ADMIN_USER carregado: ${process.env.ADMIN_USER}`);

if (!process.env.ADMIN_PASS) console.error('❌ ERRO: ADMIN_PASS não encontrado no .env');
else console.log(`✅ ADMIN_PASS carregado: (oculto, tamanho: ${process.env.ADMIN_PASS?.length})`);

if (!process.env.JWT_SECRET) console.error('❌ ERRO: JWT_SECRET não encontrado no .env');
else console.log('✅ JWT_SECRET carregado.');

console.log('\n2. Simulando Comparação de Senha:');
// Simula o que o Controller faz
const inputEmail = 'admin@medicalcrm.com'; // Teste com o email padrão
const inputPass = 'Mudar123!'; // Teste com a senha padrão

const isEmailMatch = inputEmail === process.env.ADMIN_USER;
const isPassMatch = inputPass === process.env.ADMIN_PASS;

console.log(`Email confere? ${isEmailMatch ? 'SIM ✅' : 'NÃO ❌'}`);
console.log(`Senha confere? ${isPassMatch ? 'SIM ✅' : 'NÃO ❌ (Verifique espaços em branco no .env)'}`);
console.log('--- FIM DO DIAGNÓSTICO ---');
