-- ============================================
-- SCRIPT DE POPULAÇÃO DE DADOS FAKE
-- Medical CRM - Dados Realistas para Teste
-- ============================================

-- Limpar dados existentes (exceto admin)
DELETE FROM leads WHERE id > 0;

-- ============================================
-- CENÁRIO 1: LEADS PARA HOJE (CALCULADO DINAMICAMENTE)
-- ============================================

-- Lead 1: Consulta de Rotina - Hoje 08:00
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, notes, source, clinic_id, created_at, updated_at, value)
VALUES (
    'Maria Silva Santos',
    '11987654321',
    'Consulta',
    'agendado',
    datetime('now', 'start of day', '+8 hours'),
    'Dr. João Carlos',
    '{"financial":{"paymentType":"particular","paymentValue":"350.00"}}',
    'WhatsApp',
    1,
    datetime('now'),
    datetime('now'),
    350
);

-- Lead 2: Exame Laboratorial - Hoje 09:30
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, notes, source, clinic_id, created_at, updated_at, value)
VALUES (
    'João Pedro Oliveira',
    '11976543210',
    'Exame',
    'agendado',
    datetime('now', 'start of day', '+9 hours', '+30 minutes'),
    'Dra. Ana Beatriz',
    '{"financial":{"paymentType":"plano","insuranceName":"Unimed","paymentValue":"180.00"}}',
    'WhatsApp',
    1,
    datetime('now'),
    datetime('now'),
    180
);

-- Lead 3: Retorno - Hoje 10:00 (GRATUITO)
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, notes, source, clinic_id, created_at, updated_at, value)
VALUES (
    'Carlos Eduardo Mendes',
    '11965432109',
    'retorno',
    'agendado',
    datetime('now', 'start of day', '+10 hours'),
    'Dr. João Carlos',
    '{"financial":{"paymentType":"retorno"}}
Retorno pós-cirúrgico. Sem cobrança.',
    'Manual',
    1,
    datetime('now'),
    datetime('now'),
    0
);

-- Lead 4: Primeira Consulta - Hoje 14:00
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, notes, source, clinic_id, created_at, updated_at, value)
VALUES (
    'Fernanda Costa Lima',
    '11954321098',
    'primeira_consulta',
    'agendado',
    datetime('now', 'start of day', '+14 hours'),
    'Dra. Mariana Souza',
    '{"financial":{"paymentType":"particular","paymentValue":"420.00"}}
Paciente novo. Primeira consulta dermatológica.',
    'Site',
    1,
    datetime('now'),
    datetime('now'),
    420
);

-- Lead 5: Consulta Particular - Hoje 15:30
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, notes, source, clinic_id, created_at, updated_at, value)
VALUES (
    'Roberto Alves Junior',
    '11943210987',
    'Consulta',
    'agendado',
    datetime('now', 'start of day', '+15 hours', '+30 minutes'),
    'Dr. Paulo Henrique',
    '{"financial":{"paymentType":"particular","paymentValue":"300.00"}}',
    'WhatsApp',
    1,
    datetime('now'),
    datetime('now'),
    300
);

-- Lead 6: Em Atendimento Agora
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, notes, source, clinic_id, created_at, updated_at, value, status_updated_at)
VALUES (
    'Patricia Fernandes',
    '11932109876',
    'Consulta',
    'em_atendimento',
    datetime('now', 'start of day', '+11 hours'),
    'Dra. Ana Beatriz',
    '{"financial":{"paymentType":"plano","insuranceName":"Bradesco Saúde","paymentValue":"280.00"}}
Paciente em atendimento no momento.',
    'WhatsApp',
    1,
    datetime('now'),
    datetime('now'),
    280,
    datetime('now')
);

-- ============================================
-- CENÁRIO 2: LEADS PARA AMANHÃ
-- ============================================

-- Lead 7: Consulta Amanhã 08:00
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, notes, source, clinic_id, created_at, updated_at, value)
VALUES (
    'Juliana Martins Costa',
    '11921098765',
    'Consulta',
    'agendado',
    datetime('now', '+1 day', 'start of day', '+8 hours'),
    'Dr. João Carlos',
    '{"financial":{"paymentType":"plano","insuranceName":"Unimed","paymentValue":"300.00"}}
Consulta de rotina agendada.',
    'WhatsApp',
    1,
    datetime('now'),
    datetime('now'),
    300
);

-- Lead 8: Exame Amanhã 09:00
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, notes, source, clinic_id, created_at, updated_at, value)
VALUES (
    'Daniel Henrique Santos',
    '11910987654',
    'Exame',
    'agendado',
    datetime('now', '+1 day', 'start of day', '+9 hours'),
    'Dra. Mariana Souza',
    '{"financial":{"paymentType":"particular","paymentValue":"150.00"}}
Exame de sangue completo.',
    'WhatsApp',
    1,
    datetime('now'),
    datetime('now'),
    150
);

-- Lead 9: Primeira Consulta Amanhã 10:30
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, notes, source, clinic_id, created_at, updated_at, value)
VALUES (
    'Beatriz Souza Oliveira',
    '11998877665',
    'primeira_consulta',
    'agendado',
    datetime('now', '+1 day', 'start of day', '+10 hours', '+30 minutes'),
    'Dr. Paulo Henrique',
    '{"financial":{"paymentType":"plano","insuranceName":"Bradesco Saúde","paymentValue":"380.00"}}
Paciente novo. Primeira consulta ortopédica.',
    'Site',
    1,
    datetime('now'),
    datetime('now'),
    380
);

-- Lead 10: Consulta Amanhã 14:00
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, notes, source, clinic_id, created_at, updated_at, value)
VALUES (
    'Marcos Paulo Andrade',
    '11987766554',
    'Consulta',
    'agendado',
    datetime('now', '+1 day', 'start of day', '+14 hours'),
    'Dra. Ana Beatriz',
    '{"financial":{"paymentType":"particular","paymentValue":"320.00"}}',
    'WhatsApp',
    1,
    datetime('now'),
    datetime('now'),
    320
);

-- ============================================
-- CENÁRIO 3: LEADS FINALIZADOS (ONTEM)
-- ============================================

-- Lead 11: Finalizado - Compareceu
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, attendance_status, notes, source, clinic_id, created_at, updated_at, value, status_updated_at)
VALUES (
    'Larissa Cristina Nunes',
    '11976655443',
    'Consulta',
    'finalizado',
    datetime('now', '-1 day', 'start of day', '+9 hours'),
    'Dr. João Carlos',
    'compareceu',
    '{"financial":{"paymentType":"particular","paymentValue":"350.00"}}
Consulta realizada com sucesso. Paciente compareceu.',
    'WhatsApp',
    1,
    datetime('now', '-1 day'),
    datetime('now'),
    350,
    datetime('now')
);

-- Lead 12: Finalizado - Compareceu (Plano)
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, attendance_status, notes, source, clinic_id, created_at, updated_at, value, status_updated_at)
VALUES (
    'Ricardo Silva Pereira',
    '11965544332',
    'Exame',
    'finalizado',
    datetime('now', '-1 day', 'start of day', '+10 hours', '+30 minutes'),
    'Dra. Mariana Souza',
    'compareceu',
    '{"financial":{"paymentType":"plano","insuranceName":"Unimed","paymentValue":"200.00"}}
Exame realizado. Paciente compareceu.',
    'WhatsApp',
    1,
    datetime('now', '-1 day'),
    datetime('now'),
    200,
    datetime('now')
);

-- Lead 13: Finalizado - Não Compareceu (NO-SHOW)
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, attendance_status, notes, source, clinic_id, created_at, updated_at, value, status_updated_at)
VALUES (
    'Amanda Rodrigues Lima',
    '11954433221',
    'Consulta',
    'finalizado',
    datetime('now', '-1 day', 'start of day', '+14 hours'),
    'Dr. Paulo Henrique',
    'nao_compareceu',
    '{"financial":{"paymentType":"particular","paymentValue":"300.00"}}
Paciente NÃO compareceu. Tentaremos reagendar.',
    'Site',
    1,
    datetime('now', '-1 day'),
    datetime('now'),
    0,
    datetime('now')
);

-- Lead 14: Finalizado - Remarcado
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, attendance_status, notes, source, clinic_id, created_at, updated_at, value, status_updated_at)
VALUES (
    'Thiago Henrique Costa',
    '11943322110',
    'primeira_consulta',
    'agendado',
    datetime('now', '+3 days', 'start of day', '+15 hours'),
    'Dra. Ana Beatriz',
    'remarcado',
    '{"financial":{"paymentType":"plano","insuranceName":"Bradesco Saúde","paymentValue":"320.00"}}
Consulta remarcada a pedido do paciente.',
    'WhatsApp',
    1,
    datetime('now', '-1 day'),
    datetime('now'),
    320,
    datetime('now')
);

-- ============================================
-- CENÁRIO 4: NOVOS LEADS (SEM AGENDAMENTO)
-- ============================================

-- Lead 15: Novo - Aguardando Contato
INSERT INTO leads (name, phone, type, status, notes, source, clinic_id, created_at, updated_at, value)
VALUES (
    'Gabriela Santos Oliveira',
    '11932211009',
    'primeira_consulta',
    'novo',
    'Contato via WhatsApp. Interessada em primeira consulta dermatológica. Aguardando retorno para agendamento.',
    'WhatsApp',
    1,
    datetime('now'),
    datetime('now'),
    0
);

-- Lead 16: Novo - Orçamento Solicitado
INSERT INTO leads (name, phone, type, status, notes, source, clinic_id, created_at, updated_at, value)
VALUES (
    'Leonardo Alves Martins',
    '11921100998',
    'Exame',
    'novo',
    'Lead do site. Solicitou orçamento para exames laboratoriais. Enviar tabela de preços.',
    'Site',
    1,
    datetime('now'),
    datetime('now'),
    0
);

-- Lead 17: Novo - Contato Inicial
INSERT INTO leads (name, phone, type, status, notes, source, clinic_id, created_at, updated_at, value)
VALUES (
    'Isabela Fernandes Costa',
    '11910099887',
    'Consulta',
    'novo',
    'Lead via Instagram. Perguntou sobre horários disponíveis para consulta.',
    'Instagram',
    1,
    datetime('now'),
    datetime('now'),
    0
);

-- ============================================
-- CENÁRIO 5: LEADS ONTEM (PARA CÁLCULO DE CRESCIMENTO)
-- ============================================

-- Lead 18: Ontem - Para Comparação de Receita
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, attendance_status, notes, source, clinic_id, created_at, updated_at, value)
VALUES (
    'Rafael Santos Silva',
    '11998877766',
    'Consulta',
    'finalizado',
    datetime('now', '-1 day', 'start of day', '+8 hours'),
    'Dr. João Carlos',
    'compareceu',
    '{"financial":{"paymentType":"particular","paymentValue":"300.00"}}',
    'WhatsApp',
    1,
    datetime('now', '-1 day'),
    datetime('now'),
    300
);

-- Lead 19: Ontem - Mais um para comparação
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, attendance_status, notes, source, clinic_id, created_at, updated_at, value)
VALUES (
    'Camila Rodrigues Lima',
    '11987766655',
    'Exame',
    'finalizado',
    datetime('now', '-1 day', 'start of day', '+11 hours'),
    'Dra. Mariana Souza',
    'compareceu',
    '{"financial":{"paymentType":"plano","insuranceName":"Unimed","paymentValue":"150.00"}}',
    'WhatsApp',
    1,
    datetime('now', '-1 day'),
    datetime('now'),
    150
);

-- ============================================
-- CENÁRIO 6: LEADS RECORRENTES (SEMANA PASSADA)
-- ============================================

-- Lead 20: Semana Passada - Finalizado
INSERT INTO leads (name, phone, type, status, appointment_date, doctor, attendance_status, notes, source, clinic_id, created_at, updated_at, value)
VALUES (
    'Bruna Oliveira Santos',
    '11976655544',
    'recorrente',
    'finalizado',
    datetime('now', '-6 days', 'start of day', '+10 hours'),
    'Dr. Paulo Henrique',
    'compareceu',
    '{"financial":{"paymentType":"particular","paymentValue":"280.00"}}
Paciente recorrente. 3ª sessão de tratamento.',
    'Manual',
    1,
    datetime('now', '-6 days'),
    datetime('now', '-6 days'),
    280
);

-- ============================================
-- RESUMO DOS DADOS CRIADOS
-- ============================================

SELECT '============================================' as '';
SELECT 'RESUMO DOS DADOS CRIADOS' as '';
SELECT '============================================' as '';
SELECT '' as '';
SELECT 'HOJE:' as '';
SELECT COUNT(*) || ' agendamentos' as total FROM leads WHERE date(appointment_date) = date('now');
SELECT 'Receita Estimada: R$ ' || CAST(SUM(value) AS TEXT) as receita FROM leads WHERE date(appointment_date) = date('now');
SELECT '' as '';
SELECT 'AMANHÃ:' as '';
SELECT COUNT(*) || ' agendamentos confirmados' as total FROM leads WHERE date(appointment_date) = date('now', '+1 day') AND status = 'agendado';
SELECT 'Receita Estimada: R$ ' || CAST(SUM(value) AS TEXT) as receita FROM leads WHERE date(appointment_date) = date('now', '+1 day');
SELECT '' as '';
SELECT 'ONTEM:' as '';
SELECT COUNT(*) || ' consultas realizadas' as total FROM leads WHERE date(appointment_date) = date('now', '-1 day');
SELECT 'Receita Real: R$ ' || CAST(SUM(value) AS TEXT) as receita FROM leads WHERE date(appointment_date) = date('now', '-1 day') AND attendance_status = 'compareceu';
SELECT '' as '';
SELECT 'NOVOS LEADS:' as '';
SELECT COUNT(*) || ' leads aguardando contato' as total FROM leads WHERE status = 'novo';
SELECT '' as '';
SELECT 'FINALIZADOS (Todas as Datas):' as '';
SELECT COUNT(*) || ' consultas finalizadas' as total FROM leads WHERE status = 'finalizado' AND attendance_status = 'compareceu';
SELECT 'Ticket Médio: R$ ' || CAST(ROUND(AVG(value), 2) AS TEXT) as ticket FROM leads WHERE status = 'finalizado' AND attendance_status = 'compareceu' AND value > 0;
SELECT '' as '';
SELECT '============================================' as '';
SELECT 'Total de Leads Criados: ' || COUNT(*) as total FROM leads;
SELECT '============================================' as '';
