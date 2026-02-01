import sqlite3 from 'sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

function getDatabasePath(): string {
    const nodeEnv = process.env.NODE_ENV || 'development';

    switch (nodeEnv) {
        case 'test':
            return path.resolve(__dirname, '../database.test.sqlite');
        case 'production':
            return path.resolve(__dirname, '../database.prod.sqlite');
        case 'development':
        default:
            return path.resolve(__dirname, '../database.dev.sqlite');
    }
}

const DB_PATH = getDatabasePath();
console.log(`🌱 Seeding database: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir banco de dados:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Conectado ao banco SQLite');
        seedRealisticData();
    }
});

/**
 * Popula o banco com dados realistas baseados nos screenshots do sistema
 * Testa todas as badges, status e funcionalidades
 */
function seedRealisticData(): void {
    console.log('\n🌱 INICIANDO SEED DE DADOS REALISTAS...\n');

    // Helper para criar datas relativas
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const tomorrow = new Date(today.getTime() + 86400000);
    const dayAfterTomorrow = new Date(today.getTime() + 172800000);
    const twoDaysAgo = new Date(today.getTime() - 172800000);
    const lastWeek = new Date(today.getTime() - 604800000);

    // Helper para criar notes estruturadas (compatível com frontend)
    const createNotes = (data: {
        type?: string;
        paymentType?: string;
        insuranceName?: string;
        doctor?: string;
        observations?: string;
    }) => {
        // Formato novo: {"financial":{"paymentType":"X","insuranceName":"Y","value":"Z"}}
        const financialData: any = {};

        if (data.paymentType) {
            financialData.paymentType = data.paymentType;
        }

        if (data.insuranceName) {
            financialData.insuranceName = data.insuranceName;
        }

        let notes = data.observations || '';

        // Adicionar dados financeiros em JSON
        if (Object.keys(financialData).length > 0) {
            const financialJSON = JSON.stringify({ financial: financialData });
            notes = notes ? `${notes}\n${financialJSON}` : financialJSON;
        }

        return notes.trim() || null;
    };

    // Array de leads para inserir
    const leads = [
        // ============================================
        // COLUNA: NOVOS
        // ============================================
        {
            name: 'Maria de Jesus',
            phone: '63992532686',
            status: 'novo',
            type: 'Atendimento Humano',
            source: 'Manual',
            value: 30000.0,
            created_at: twoDaysAgo.toISOString(),
            notes: createNotes({
                type: 'Atendimento Humano',
                paymentType: 'plano',
                insuranceName: 'Unimed',
                observations: 'Paciente com histórico de procedimentos anteriores. Urgente.',
            }),
        },
        {
            name: 'Jeremias Marinho',
            phone: '63992361046',
            status: 'novo',
            type: 'Atendimento Humano',
            source: 'WhatsApp',
            value: 0,
            created_at: yesterday.toISOString(),
            notes: createNotes({
                type: 'Atendimento Humano',
                observations: 'Contato inicial via WhatsApp. Aguardando retorno.',
            }),
        },
        {
            name: 'Anna Victória',
            phone: '63992361047',
            status: 'novo',
            type: 'primeira_consulta',
            source: 'Manual',
            value: 0,
            appointment_date: today.toISOString(),
            doctor: 'Dr. Cleber',
            created_at: today.toISOString(),
            notes: createNotes({
                type: 'Primeira Consulta',
                doctor: 'Dr. Cleber',
                observations: 'Paciente novo. Primeira consulta marcada para hoje.',
            }),
        },
        {
            name: 'Carlos Eduardo Souza',
            phone: '11999887766',
            status: 'novo',
            type: 'exame',
            source: 'WhatsApp',
            value: 0,
            created_at: today.toISOString(),
            notes: createNotes({
                type: 'Exame',
                observations: 'Solicitação de exames laboratoriais. Aguardando agendamento.',
            }),
        },

        // ============================================
        // COLUNA: EM ATENDIMENTO
        // ============================================
        {
            name: 'João Pedro Oliveira',
            phone: '11976543210',
            status: 'em_atendimento',
            type: 'primeira_consulta',
            source: 'WhatsApp',
            value: 0,
            appointment_date: yesterday.toISOString(),
            doctor: 'Dr. Cleber',
            created_at: lastWeek.toISOString(),
            notes: createNotes({
                type: 'Primeira Consulta',
                doctor: 'Dr. Cleber',
                observations: 'Atendimento iniciado ontem. Em andamento.',
            }),
        },
        {
            name: 'Roberto Carlos Mendes',
            phone: '11954321098',
            status: 'em_atendimento',
            type: 'Consulta',
            source: 'WhatsApp',
            value: 0,
            appointment_date: today.toISOString(),
            doctor: 'Dra. Marina Santos',
            created_at: twoDaysAgo.toISOString(),
            notes: createNotes({
                type: 'Consulta',
                doctor: 'Dra. Marina Santos',
                observations: 'Consulta de rotina em andamento.',
            }),
        },
        {
            name: 'Patricia Ferreira Lima',
            phone: '11988776655',
            status: 'em_atendimento',
            type: 'recorrente',
            source: 'Manual',
            value: 0,
            appointment_date: today.toISOString(),
            doctor: 'Dr. Cleber',
            created_at: lastWeek.toISOString(),
            notes: createNotes({
                type: 'Sessão/Recorrente',
                doctor: 'Dr. Cleber',
                paymentType: 'particular',
                observations: 'Paciente em tratamento contínuo. 5ª sessão.',
            }),
        },

        // ============================================
        // COLUNA: AGENDADOS
        // ============================================
        {
            name: 'Rebeca Aquino',
            phone: '63992000000',
            status: 'agendado',
            type: 'primeira_consulta',
            source: 'WhatsApp',
            value: 0,
            appointment_date: tomorrow.toISOString(),
            created_at: today.toISOString(),
            notes: createNotes({
                type: 'Primeira Consulta',
                observations: 'Agendamento confirmado para amanhã. Primeira consulta.',
            }),
        },
        {
            name: 'Jeremias Marinho Jr',
            phone: '63992361048',
            status: 'agendado',
            type: 'Consulta',
            source: 'WhatsApp',
            value: 450.0,
            appointment_date: dayAfterTomorrow.toISOString(),
            doctor: 'Dr. Cleber',
            created_at: today.toISOString(),
            notes: createNotes({
                type: 'Consulta',
                paymentType: 'plano',
                insuranceName: 'Unimed',
                doctor: 'Dr. Cleber',
                observations: 'Consulta de retorno agendada. Plano de saúde confirmado.',
            }),
        },
        {
            name: 'Fernanda Costa Silva',
            phone: '11977665544',
            status: 'agendado',
            type: 'retorno',
            source: 'Manual',
            value: 0,
            appointment_date: tomorrow.toISOString(),
            doctor: 'Dra. Marina Santos',
            created_at: yesterday.toISOString(),
            notes: createNotes({
                type: 'Retorno',
                paymentType: 'retorno',
                doctor: 'Dra. Marina Santos',
                observations: 'Retorno após cirurgia. Sem cobrança.',
            }),
        },
        {
            name: 'Ricardo Alves Pereira',
            phone: '11966554433',
            status: 'agendado',
            type: 'exame',
            source: 'WhatsApp',
            value: 350.0,
            appointment_date: dayAfterTomorrow.toISOString(),
            created_at: yesterday.toISOString(),
            notes: createNotes({
                type: 'Exame',
                paymentType: 'particular',
                observations: 'Exame de sangue completo. Agendado para depois de amanhã.',
            }),
        },

        // ============================================
        // COLUNA: FINALIZADOS
        // ============================================
        {
            name: 'Larissa Cristina Nunes',
            phone: '11943210986',
            status: 'finalizado',
            type: 'primeira_consulta',
            source: 'WhatsApp',
            value: 43200.0,
            attendance_status: 'compareceu',
            doctor: 'Dr. Cleber',
            created_at: yesterday.toISOString(),
            appointment_date: yesterday.toISOString(),
            notes: createNotes({
                type: 'Primeira Consulta',
                paymentType: 'particular',
                doctor: 'Dr. Cleber',
                observations: 'Procedimento cirúrgico realizado com sucesso. Paciente compareceu.',
            }),
        },
        {
            name: 'Daniel Henrique Santos',
            phone: '11910987653',
            status: 'finalizado',
            type: 'Consulta',
            source: 'WhatsApp',
            value: 250.0,
            attendance_status: 'compareceu',
            created_at: twoDaysAgo.toISOString(),
            appointment_date: twoDaysAgo.toISOString(),
            notes: createNotes({
                type: 'Consulta',
                paymentType: 'particular',
                observations: 'Consulta realizada. Paciente compareceu e pagou em dinheiro.',
            }),
        },
        {
            name: 'Juliana Martins Costa',
            phone: '11932109876',
            status: 'finalizado',
            type: 'retorno',
            source: 'Manual',
            value: 0,
            attendance_status: 'compareceu',
            doctor: 'Dra. Marina Santos',
            created_at: twoDaysAgo.toISOString(),
            appointment_date: twoDaysAgo.toISOString(),
            notes: createNotes({
                type: 'Retorno',
                paymentType: 'retorno',
                doctor: 'Dra. Marina Santos',
                observations: 'Retorno pós-operatório. Tudo OK. Sem cobrança.',
            }),
        },
        {
            name: 'Marcos Paulo Andrade',
            phone: '11921098765',
            status: 'finalizado',
            type: 'exame',
            source: 'WhatsApp',
            value: 180.0,
            attendance_status: 'nao_compareceu',
            created_at: yesterday.toISOString(),
            appointment_date: yesterday.toISOString(),
            notes: createNotes({
                type: 'Exame',
                paymentType: 'particular',
                observations: 'Paciente NÃO compareceu ao exame agendado. Tentar reagendar.',
            }),
        },
        {
            name: 'Beatriz Souza Oliveira',
            phone: '11998877665',
            status: 'finalizado',
            type: 'primeira_consulta',
            source: 'WhatsApp',
            value: 320.0,
            attendance_status: 'remarcado',
            doctor: 'Dr. Cleber',
            created_at: twoDaysAgo.toISOString(),
            appointment_date: twoDaysAgo.toISOString(),
            notes: createNotes({
                type: 'Primeira Consulta',
                paymentType: 'particular',
                doctor: 'Dr. Cleber',
                observations: 'Consulta remarcada a pedido do paciente. Novo horário pendente.',
            }),
        },
    ];

    console.log(`📝 Inserindo ${leads.length} leads de exemplo no banco...\n`);

    // Preparar statement de inserção
    const stmt = db.prepare(`
        INSERT INTO leads (
            name, phone, status, type, source, value, 
            appointment_date, doctor, notes, attendance_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;
    let errors = 0;

    leads.forEach((lead, index) => {
        stmt.run(
            lead.name,
            lead.phone,
            lead.status,
            lead.type || 'geral',
            lead.source || 'Manual',
            lead.value || 0,
            lead.appointment_date || null,
            lead.doctor || null,
            lead.notes || null,
            lead.attendance_status || null,
            lead.created_at || new Date().toISOString(),
            (err: any) => {
                if (err) {
                    console.error(
                        `❌ Erro ao inserir lead ${index + 1} (${lead.name}):`,
                        err.message
                    );
                    errors++;
                } else {
                    inserted++;
                    console.log(
                        `✅ Lead ${inserted}/${leads.length}: ${lead.name} (${lead.status}) - ${lead.type || 'geral'}`
                    );
                }

                // Finalizar quando todos forem processados
                if (inserted + errors === leads.length) {
                    stmt.finalize(() => {
                        console.log('\n' + '='.repeat(80));
                        console.log('🌱 SEED CONCLUÍDO!');
                        console.log('='.repeat(80));
                        console.log(`✅ Leads inseridos: ${inserted}`);
                        console.log(`❌ Erros: ${errors}`);
                        console.log('\n📊 DISTRIBUIÇÃO POR STATUS:');
                        console.log(
                            `   • Novos: ${leads.filter((l) => l.status === 'novo').length}`
                        );
                        console.log(
                            `   • Em Atendimento: ${leads.filter((l) => l.status === 'em_atendimento').length}`
                        );
                        console.log(
                            `   • Agendados: ${leads.filter((l) => l.status === 'agendado').length}`
                        );
                        console.log(
                            `   • Finalizados: ${leads.filter((l) => l.status === 'finalizado').length}`
                        );
                        console.log(
                            '\n💰 VALOR TOTAL ESTIMADO: R$ ' +
                                leads
                                    .reduce((sum, l) => sum + (l.value || 0), 0)
                                    .toLocaleString('pt-BR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })
                        );
                        console.log('\n🚀 Sistema pronto para uso!');
                        console.log('📌 Acesse: http://localhost:3001/admin.html');
                        console.log('🔑 Credenciais: admin / 123\n');

                        db.close();
                        process.exit(0);
                    });
                }
            }
        );
    });
}
