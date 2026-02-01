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
const CLINIC_NAME = 'Clínica Demo';
const CLINIC_SLUG = 'clinica-demo';

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir banco de dados:', err.message);
        process.exit(1);
    }

    console.log(`✅ Conectado ao banco: ${DB_PATH}`);
    seedStressData().finally(() => db.close());
});

function run(sql: string, params: Array<string | number | null> = []): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function get<T>(sql: string, params: Array<string | number | null> = []): Promise<T> {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row: T) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function all<T>(sql: string, params: Array<string | number | null> = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows: T[]) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateBetween(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatCpf(index: number): string {
    const base = String(100000000 + index).slice(0, 9);
    return `${base.slice(0, 3)}.${base.slice(3, 6)}.${base.slice(6, 9)}-00`;
}

async function ensureClinic(): Promise<number> {
    await run(
        `INSERT OR IGNORE INTO clinics (name, slug, plan_tier, status, max_users, max_patients)
         VALUES (?, ?, 'professional', 'active', 25, 2000)`,
        [CLINIC_NAME, CLINIC_SLUG]
    );

    const clinic = await get<{ id: number }>('SELECT id FROM clinics WHERE slug = ?', [
        CLINIC_SLUG,
    ]);

    return clinic.id;
}

async function seedPatients(clinicId: number): Promise<number[]> {
    const firstNames = [
        'Ana',
        'Bruno',
        'Carla',
        'Diego',
        'Eduarda',
        'Felipe',
        'Gabriela',
        'Henrique',
        'Isabela',
        'João',
        'Karen',
        'Lucas',
        'Marina',
        'Nicolas',
        'Olivia',
        'Paulo',
        'Quésia',
        'Rafael',
        'Sofia',
        'Tiago',
        'Ursula',
        'Vitor',
        'Wesley',
        'Yasmin',
        'Zeca',
    ];
    const lastNames = [
        'Silva',
        'Souza',
        'Oliveira',
        'Santos',
        'Lima',
        'Almeida',
        'Costa',
        'Ferreira',
        'Ribeiro',
        'Carvalho',
        'Gomes',
        'Martins',
        'Araújo',
        'Barbosa',
        'Moura',
        'Dias',
    ];
    const statuses = ['waiting', 'triage', 'consultation', 'finished'];

    const patientIds: number[] = [];

    for (let i = 0; i < 50; i += 1) {
        const name = `${randomItem(firstNames)} ${randomItem(lastNames)} ${randomItem(lastNames)}`;
        const email = `paciente.${i + 1}.${Date.now()}@demo.local`;
        const phone = `11${randomInt(900000000, 999999999)}`;
        const cpf = formatCpf(i + 1);
        const status = randomItem(statuses);
        const createdAt = randomDateBetween(new Date(Date.now() - 180 * 86400000), new Date());

        await run(
            `INSERT INTO patients (clinic_id, name, email, phone, cpf, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                clinicId,
                name,
                email,
                phone,
                cpf,
                status,
                createdAt.toISOString(),
                createdAt.toISOString(),
            ]
        );
    }

    const rows = await all<{ id: number }>('SELECT id FROM patients WHERE clinic_id = ?', [
        clinicId,
    ]);
    rows.forEach((row) => patientIds.push(row.id));

    console.log(`✅ Pacientes inseridos: ${patientIds.length}`);
    return patientIds;
}

async function seedAppointments(clinicId: number, patientIds: number[]): Promise<number[]> {
    const doctors = ['Dr. Augusto', 'Dra. Camila', 'Dr. Eduardo', 'Dra. Fernanda', 'Dr. Marcelo'];
    const types = ['consulta', 'retorno', 'exame', 'recorrente'];

    const appointmentIds: number[] = [];

    const now = new Date();
    const start = new Date(now.getTime() - 30 * 86400000);
    const end = new Date(now.getTime() + 7 * 86400000);

    for (let i = 0; i < 100; i += 1) {
        const appointmentDate = randomDateBetween(start, end);
        const status =
            appointmentDate < now
                ? randomItem(['completed', 'cancelled', 'no_show'])
                : randomItem(['scheduled', 'confirmed']);

        const patientId = randomItem(patientIds);
        const doctor = randomItem(doctors);
        const type = randomItem(types);
        const duration = randomItem([20, 30, 40, 50, 60]);

        await run(
            `INSERT INTO appointments
                (clinic_id, patient_id, doctor, appointment_date, duration_minutes, type, status, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                clinicId,
                patientId,
                doctor,
                appointmentDate.toISOString(),
                duration,
                type,
                status,
                'Agendamento gerado para teste de performance',
                appointmentDate.toISOString(),
                appointmentDate.toISOString(),
            ]
        );
    }

    const rows = await all<{ id: number }>('SELECT id FROM appointments WHERE clinic_id = ?', [
        clinicId,
    ]);
    rows.forEach((row) => appointmentIds.push(row.id));

    console.log(`✅ Agendamentos inseridos: ${appointmentIds.length}`);
    return appointmentIds;
}

async function seedTransactions(
    clinicId: number,
    patientIds: number[],
    appointmentIds: number[]
): Promise<void> {
    const incomeCategories = ['Consulta', 'Procedimento', 'Outros'];
    const expenseCategories = ['Aluguel', 'Material', 'Outros'];
    const paymentMethods = ['pix', 'credit', 'debit', 'cash'];

    for (let i = 0; i < 100; i += 1) {
        const isIncome = Math.random() > 0.35;
        const type = isIncome ? 'income' : 'expense';
        const category = isIncome ? randomItem(incomeCategories) : randomItem(expenseCategories);
        const amount = isIncome ? randomInt(80, 900) : randomInt(50, 700);
        const paymentMethod = randomItem(paymentMethods);
        const status = isIncome
            ? randomItem(['paid', 'paid', 'pending'])
            : randomItem(['paid', 'pending']);

        const patientId = randomItem(patientIds);
        const appointmentId = appointmentIds.length ? randomItem(appointmentIds) : null;

        const baseDate = randomDateBetween(
            new Date(Date.now() - 30 * 86400000),
            new Date(Date.now() + 7 * 86400000)
        );
        const dueDate = baseDate.toISOString();
        const paidAt = status === 'paid' ? baseDate.toISOString() : null;

        await run(
            `INSERT INTO transactions
                (clinic_id, patient_id, appointment_id, type, amount, category, payment_method, status, due_date, paid_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                clinicId,
                patientId,
                appointmentId,
                type,
                amount,
                category,
                paymentMethod,
                status,
                dueDate,
                paidAt,
                baseDate.toISOString(),
                baseDate.toISOString(),
            ]
        );
    }

    console.log('✅ Transações financeiras inseridas: 100');
}

async function seedStressData(): Promise<void> {
    console.log('🚀 Iniciando seed de stress para dashboard e lista de pacientes');

    const clinicId = await ensureClinic();
    const patientIds = await seedPatients(clinicId);
    const appointmentIds = await seedAppointments(clinicId, patientIds);
    await seedTransactions(clinicId, patientIds, appointmentIds);

    console.log('🎉 Seed concluído com sucesso!');
}
