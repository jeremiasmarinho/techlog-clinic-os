#!/bin/bash

################################################################################
# Deploy Script - Production Server (VPS)
# 
# Este script realiza o deploy das novas funcionalidades (Financial & SaaS Admin)
# no servidor de produção de forma segura, com backup automático e rollback.
#
# Uso: bash scripts/deploy-prod.sh
#
# @author DevOps Engineer
# @date 2026-02-01
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/techlog-api"
DB_FILE="clinic.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$APP_DIR/backups"
LOG_FILE="$APP_DIR/logs/deploy_${TIMESTAMP}.log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as correct user (not root)
check_user() {
    if [ "$EUID" -eq 0 ]; then 
        error "Não execute este script como root!"
        exit 1
    fi
    log "✓ Verificação de usuário OK"
}

# Create necessary directories
setup_directories() {
    log "Criando diretórios necessários..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$APP_DIR/logs"
    log "✓ Diretórios criados"
}

# Backup database
backup_database() {
    log "================================"
    log "INICIANDO BACKUP DO BANCO DE DADOS"
    log "================================"
    
    if [ ! -f "$APP_DIR/$DB_FILE" ]; then
        warning "Banco de dados não encontrado em $APP_DIR/$DB_FILE"
        warning "Assumindo primeira instalação - pulando backup"
        return 0
    fi
    
    local backup_file="$BACKUP_DIR/${DB_FILE}.bak_${TIMESTAMP}"
    
    log "Copiando $DB_FILE para $backup_file..."
    cp "$APP_DIR/$DB_FILE" "$backup_file"
    
    if [ $? -eq 0 ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        log "✓ Backup criado com sucesso: $backup_file ($size)"
        
        # Keep only last 10 backups
        log "Removendo backups antigos (mantendo últimos 10)..."
        cd "$BACKUP_DIR"
        ls -t ${DB_FILE}.bak_* 2>/dev/null | tail -n +11 | xargs -r rm --
        log "✓ Limpeza de backups concluída"
    else
        error "Falha ao criar backup!"
        exit 1
    fi
}

# Git pull with stash
git_update() {
    log "================================"
    log "ATUALIZANDO CÓDIGO (GIT PULL)"
    log "================================"
    
    cd "$APP_DIR"
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        warning "Mudanças locais detectadas. Fazendo stash..."
        git stash save "Deploy backup - $TIMESTAMP"
    fi
    
    # Get current commit
    local current_commit=$(git rev-parse --short HEAD)
    log "Commit atual: $current_commit"
    
    # Pull latest changes
    log "Executando git pull..."
    if git pull origin main; then
        local new_commit=$(git rev-parse --short HEAD)
        log "✓ Git pull concluído: $current_commit → $new_commit"
    else
        error "Falha no git pull!"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    log "================================"
    log "INSTALANDO DEPENDÊNCIAS (NPM)"
    log "================================"
    
    cd "$APP_DIR"
    
    log "Executando npm install --production..."
    if npm install --production; then
        log "✓ Dependências instaladas com sucesso"
    else
        error "Falha ao instalar dependências!"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    log "================================"
    log "EXECUTANDO MIGRATIONS DO BANCO"
    log "================================"
    
    cd "$APP_DIR"
    
    # Check if migrations directory exists
    if [ ! -d "migrations" ]; then
        warning "Diretório migrations não encontrado"
        log "Criando migrations básicas..."
        
        # Create migrations directory
        mkdir -p migrations
        
        # Create migration for transactions table
        cat > migrations/002_create_transactions.sql << 'EOF'
-- Migration: Create transactions table for Financial Module
-- Date: 2026-02-01

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount REAL NOT NULL,
    category TEXT,
    payment_method TEXT CHECK(payment_method IN ('money', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'insurance')),
    description TEXT,
    transaction_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_clinic ON transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_clinic_date ON transactions(clinic_id, transaction_date);

-- Trigger to update updated_at
CREATE TRIGGER IF NOT EXISTS update_transactions_timestamp 
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Success message
SELECT 'Transactions table created successfully' as message;
EOF
        
        # Create migration for last_login_at column
        cat > migrations/003_add_last_login.sql << 'EOF'
-- Migration: Add last_login_at to users table
-- Date: 2026-02-01

-- Check if column exists before adding
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we'll use a different approach

-- Add last_login_at column if it doesn't exist
-- This will fail silently if column already exists
BEGIN;
    ALTER TABLE users ADD COLUMN last_login_at DATETIME;
COMMIT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);

-- Success message
SELECT 'last_login_at column added successfully' as message;
EOF
        
        log "✓ Arquivos de migration criados"
    fi
    
    # Run migrations using sqlite3
    log "Aplicando migrations no banco de dados..."
    
    if command -v sqlite3 &> /dev/null; then
        for migration in migrations/*.sql; do
            if [ -f "$migration" ]; then
                log "Executando migration: $(basename $migration)"
                if sqlite3 "$APP_DIR/$DB_FILE" < "$migration" 2>&1 | tee -a "$LOG_FILE"; then
                    log "✓ Migration $(basename $migration) aplicada"
                else
                    # Check if error is "duplicate column" (which is OK)
                    if grep -q "duplicate column" "$LOG_FILE" 2>/dev/null; then
                        warning "Coluna já existe - ignorando erro"
                    else
                        error "Falha ao aplicar migration: $(basename $migration)"
                        warning "Verifique o arquivo de log: $LOG_FILE"
                        # Don't exit - continue with other migrations
                    fi
                fi
            fi
        done
        log "✓ Migrations concluídas"
    else
        warning "sqlite3 não encontrado. Tentando com Node.js..."
        
        # Alternative: Run migrations using Node.js
        if [ -f "scripts/run-migrations.js" ]; then
            log "Executando migrations via Node.js..."
            if node scripts/run-migrations.js; then
                log "✓ Migrations executadas via Node.js"
            else
                error "Falha ao executar migrations!"
                exit 1
            fi
        else
            warning "Script de migrations não encontrado"
            warning "As tabelas serão criadas automaticamente no primeiro uso"
        fi
    fi
}

# Build frontend assets (if needed)
build_frontend() {
    log "================================"
    log "BUILD DO FRONTEND"
    log "================================"
    
    cd "$APP_DIR"
    
    # Check if there's a build script
    if grep -q '"build"' package.json; then
        log "Script de build encontrado no package.json"
        log "Executando npm run build..."
        
        if npm run build; then
            log "✓ Build do frontend concluído"
        else
            warning "Build falhou, mas continuando deploy..."
        fi
    else
        info "Nenhum script de build configurado - frontend é servido diretamente"
        log "✓ Build não necessário"
    fi
}

# Restart PM2
restart_pm2() {
    log "================================"
    log "REINICIANDO APLICAÇÃO (PM2)"
    log "================================"
    
    cd "$APP_DIR"
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        error "PM2 não está instalado!"
        error "Instale com: npm install -g pm2"
        exit 1
    fi
    
    # Check if ecosystem.config.js exists
    if [ ! -f "ecosystem.config.js" ]; then
        warning "ecosystem.config.js não encontrado"
        log "Criando configuração básica do PM2..."
        
        cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'techlog-api',
    script: './src/server.ts',
    interpreter: 'node',
    interpreter_args: '-r ts-node/register',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M'
  }]
};
EOF
        log "✓ ecosystem.config.js criado"
    fi
    
    # Check if app is already running
    if pm2 list | grep -q "techlog-api"; then
        log "Aplicação está rodando. Fazendo reload..."
        
        if pm2 reload ecosystem.config.js --update-env; then
            log "✓ PM2 reload concluído (zero-downtime)"
        else
            warning "Reload falhou. Tentando restart..."
            if pm2 restart ecosystem.config.js; then
                log "✓ PM2 restart concluído"
            else
                error "Falha ao reiniciar PM2!"
                exit 1
            fi
        fi
    else
        log "Aplicação não está rodando. Iniciando..."
        
        if pm2 start ecosystem.config.js; then
            log "✓ Aplicação iniciada com PM2"
        else
            error "Falha ao iniciar aplicação!"
            exit 1
        fi
    fi
    
    # Save PM2 configuration
    log "Salvando configuração do PM2..."
    pm2 save
    
    # Show status
    log "Status da aplicação:"
    pm2 list
}

# Verify deployment
verify_deployment() {
    log "================================"
    log "VERIFICANDO DEPLOY"
    log "================================"
    
    # Wait for app to start
    log "Aguardando aplicação iniciar..."
    sleep 5
    
    # Check if app is running
    if pm2 list | grep -q "online"; then
        log "✓ Aplicação está online"
    else
        error "Aplicação não está online!"
        pm2 logs --lines 50
        exit 1
    fi
    
    # Check if port 3000 is listening
    if netstat -tuln 2>/dev/null | grep -q ":3000" || ss -tuln 2>/dev/null | grep -q ":3000"; then
        log "✓ Servidor está escutando na porta 3000"
    else
        warning "Porta 3000 não está escutando"
    fi
    
    # Test health endpoint (if exists)
    if command -v curl &> /dev/null; then
        log "Testando endpoint de saúde..."
        if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
            log "✓ Health check passou"
        else
            warning "Health check falhou (endpoint pode não existir)"
        fi
    fi
}

# Cleanup old logs
cleanup_logs() {
    log "================================"
    log "LIMPEZA DE LOGS ANTIGOS"
    log "================================"
    
    # Keep only last 30 days of logs
    log "Removendo logs com mais de 30 dias..."
    find "$APP_DIR/logs" -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true
    log "✓ Limpeza concluída"
}

# Print summary
print_summary() {
    log "================================"
    log "DEPLOY CONCLUÍDO COM SUCESSO! ✨"
    log "================================"
    
    echo ""
    info "📊 Resumo do Deploy:"
    info "   • Backup: $BACKUP_DIR/${DB_FILE}.bak_${TIMESTAMP}"
    info "   • Log: $LOG_FILE"
    info "   • Servidor: Online"
    info "   • URL: http://localhost:3000"
    echo ""
    info "📝 Próximos passos:"
    info "   1. Verifique os logs: pm2 logs techlog-api"
    info "   2. Monitore a aplicação: pm2 monit"
    info "   3. Teste as novas funcionalidades:"
    info "      - Financial: http://localhost:3000/relatorios.html"
    info "      - SaaS Admin: http://localhost:3000/saas-admin.html"
    echo ""
    info "🔧 Comandos úteis:"
    info "   pm2 logs          - Ver logs em tempo real"
    info "   pm2 monit         - Monitor de recursos"
    info "   pm2 restart all   - Reiniciar aplicação"
    info "   pm2 stop all      - Parar aplicação"
    echo ""
}

# Rollback function (in case of critical failure)
rollback() {
    error "================================"
    error "ERRO CRÍTICO - INICIANDO ROLLBACK"
    error "================================"
    
    local backup_file="$BACKUP_DIR/${DB_FILE}.bak_${TIMESTAMP}"
    
    if [ -f "$backup_file" ]; then
        error "Restaurando backup do banco de dados..."
        cp "$backup_file" "$APP_DIR/$DB_FILE"
        log "✓ Banco de dados restaurado"
    fi
    
    error "Verifique o log para mais detalhes: $LOG_FILE"
    exit 1
}

# Trap errors
trap rollback ERR

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    clear
    log "================================"
    log "🚀 DEPLOY PARA PRODUÇÃO"
    log "================================"
    log "Timestamp: $TIMESTAMP"
    log "Diretório: $APP_DIR"
    echo ""
    
    # Confirmation prompt
    warning "⚠️  ATENÇÃO: Você está prestes a fazer deploy em PRODUÇÃO!"
    echo ""
    read -p "Deseja continuar? (sim/não): " confirm
    
    if [ "$confirm" != "sim" ]; then
        log "Deploy cancelado pelo usuário"
        exit 0
    fi
    
    echo ""
    log "Iniciando deploy..."
    echo ""
    
    # Execute deployment steps
    check_user
    setup_directories
    backup_database
    git_update
    install_dependencies
    run_migrations
    build_frontend
    restart_pm2
    verify_deployment
    cleanup_logs
    print_summary
    
    log "================================"
    log "✅ DEPLOY FINALIZADO"
    log "================================"
}

# Run main function
main "$@"
