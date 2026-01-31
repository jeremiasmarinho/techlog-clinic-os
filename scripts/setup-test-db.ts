/**
 * Setup Test Database
 * Creates a clean test database with seed data for E2E testing
 */

import { Database } from 'sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const TEST_DB_PATH = path.join(__dirname, '..', 'clinic.test.db');

async function setupTestDatabase() {
    console.log('🔧 Setting up test database...');
    
    // Remove existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH);
        console.log('✅ Removed old test database');
    }
    
    const db = new Database(TEST_DB_PATH);
    
    // Read and execute schema
    return new Promise<void>((resolve, reject) => {
        db.serialize(async () => {
            try {
                // Create tables
                db.run(`
                    CREATE TABLE IF NOT EXISTS clinics (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        slug TEXT UNIQUE NOT NULL,
                        owner_id INTEGER,
                        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'trial')),
                        plan_tier TEXT DEFAULT 'basic' CHECK(plan_tier IN ('basic', 'professional', 'enterprise')),
                        trial_ends_at DATETIME,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                `);
                
                db.run(`
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        username TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL,
                        clinic_id INTEGER DEFAULT 1 REFERENCES clinics(id),
                        role TEXT DEFAULT 'staff' CHECK(role IN ('super_admin', 'clinic_admin', 'staff')),
                        is_owner INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                `);
                
                db.run(`
                    CREATE TABLE IF NOT EXISTS leads (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        phone TEXT,
                        email TEXT,
                        notes TEXT,
                        status TEXT DEFAULT 'novo',
                        appointment_date DATETIME,
                        doctor TEXT,
                        appointment_type TEXT,
                        clinic_id INTEGER DEFAULT 1,
                        archive_reason TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        status_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                `);
                
                console.log('✅ Tables created');
                
                // Insert test clinic
                db.run(`
                    INSERT INTO clinics (id, name, slug, status, plan_tier)
                    VALUES (1, 'Clínica Viva Saúde', 'viva-saude', 'active', 'professional');
                `);
                
                // Insert test users
                const hashedPassword = await bcrypt.hash('Mudar123!', 10);
                
                db.run(`
                    INSERT INTO users (id, name, username, password, clinic_id, role, is_owner)
                    VALUES 
                        (1, 'Administrador', 'admin', ?, 1, 'super_admin', 1),
                        (2, 'Dr. João Silva', 'joao.silva', ?, 1, 'clinic_admin', 0);
                `, [hashedPassword, hashedPassword]);
                
                console.log('✅ Test users created (password: Mudar123!)');
                
                // Insert test leads for today (2026-01-31)
                const today = '2026-01-31';
                const testLeads = [
                    { name: 'Maria Silva Santos', phone: '11987654321', doctor: 'Dr. João Silva', type: 'Consulta', status: 'agendado', time: '09:00' },
                    { name: 'João Pedro Oliveira', phone: '11976543210', doctor: 'Dr. João Silva', type: 'Retorno', status: 'agendado', time: '10:00' },
                    { name: 'Carlos Eduardo Mendes', phone: '11965432109', doctor: 'Dra. Ana Beatriz', type: 'Consulta', status: 'agendado', time: '11:00' },
                    { name: 'Fernanda Costa Lima', phone: '11954321098', doctor: 'Dr. João Carlos', type: 'Exame', status: 'agendado', time: '14:00' },
                    { name: 'Roberto Alves Junior', phone: '11943210987', doctor: 'Dr. Paulo Henrique', type: 'Consulta', status: 'agendado', time: '15:00' },
                    { name: 'Patricia Fernandes', phone: '11932109876', doctor: 'Dra. Mariana Souza', type: 'Retorno', status: 'agendado', time: '16:00' }
                ];
                
                const stmt = db.prepare(`
                    INSERT INTO leads (name, phone, doctor, appointment_type, status, appointment_date, notes, clinic_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                `);
                
                testLeads.forEach(lead => {
                    const appointmentDateTime = `${today} ${lead.time}:00`;
                    const notes = `Paciente teste\n{"financial":{"paymentType":"Particular","value":"250.00"}}`;
                    stmt.run(lead.name, lead.phone, lead.doctor, lead.type, lead.status, appointmentDateTime, notes);
                });
                
                stmt.finalize();
                
                console.log(`✅ ${testLeads.length} test appointments created for ${today}`);
                
                // Insert some leads in other statuses
                db.run(`
                    INSERT INTO leads (name, phone, status, clinic_id)
                    VALUES 
                        ('Lead Novo 1', '11999999991', 'novo', 1),
                        ('Lead Novo 2', '11999999992', 'novo', 1),
                        ('Lead Finalizado', '11999999993', 'finalizado', 1);
                `);
                
                console.log('✅ Additional test leads created');
                
                db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('\n✨ Test database ready at:', TEST_DB_PATH);
                        console.log('📊 Test data summary:');
                        console.log('   - 1 clinic: Clínica Viva Saúde');
                        console.log('   - 2 users: admin / joao.silva');
                        console.log('   - 6 appointments for today (2026-01-31)');
                        console.log('   - 3 additional leads\n');
                        resolve();
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    });
}

setupTestDatabase().catch(err => {
    console.error('❌ Error setting up test database:', err);
    process.exit(1);
});
