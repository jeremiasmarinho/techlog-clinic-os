const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Configuração de Segurança Básica
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Para servir o site depois

// 1. Conexão com Banco de Dados (Arquivo Local)
const dbPath = path.resolve(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao abrir banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco SQLite em:', dbPath);
        initDb();
    }
});

// 2. Criação da Tabela (Se não existir)
function initDb() {
    db.run(`CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT,
        type TEXT,
        status TEXT DEFAULT 'novo',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
}

// 3. Rota de Teste
app.get('/', (req, res) => {
    res.json({ message: 'TechLog Clinic OS - Sistema Online 🚀' });
});

// 4. Rota para SALVAR Lead
app.post('/api/leads', (req, res) => {
    const { name, phone, type } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ error: 'Nome e Telefone são obrigatórios' });
    }

    const stmt = db.prepare("INSERT INTO leads (name, phone, type) VALUES (?, ?, ?)");
    stmt.run(name, phone, type || 'geral', function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ 
            id: this.lastID, 
            message: 'Salvo com sucesso!',
            whatsapp_link: `https://wa.me/55${phone.replace(/\D/g,'')}`
        });
    });
    stmt.finalize();
});

// 5. Rota para LISTAR Leads (Admin)
app.get('/api/leads', (req, res) => {
    db.all("SELECT * FROM leads ORDER BY created_at DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Iniciar Servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} 🚀`);
});
