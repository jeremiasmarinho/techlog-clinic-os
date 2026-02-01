# 🚀 Guia de Deploy para Produção

**Versão:** 1.0  
**Data:** 01/02/2026  
**Novas Funcionalidades:** Financial Module + SaaS Admin Dashboard

---

## 📋 Pré-requisitos

### No Servidor VPS

- ✅ Node.js v16+ instalado
- ✅ PM2 instalado globalmente (`npm install -g pm2`)
- ✅ Git configurado
- ✅ Acesso SSH ao servidor
- ✅ Repositório clonado em `/home/techlog-api`

### Variáveis de Ambiente

Certifique-se de que o arquivo `.env` existe no servidor:

```bash
# /home/techlog-api/.env
NODE_ENV=production
PORT=3000
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
SUPER_ADMIN_EMAIL=seu-email@domain.com
DATABASE_PATH=./clinic.db
```

---

## 🎯 Processo de Deploy - Método Automático

### 1. Conectar ao Servidor

```bash
ssh usuario@seu-servidor-ip
cd /home/techlog-api
```

### 2. Executar Script de Deploy

```bash
bash scripts/deploy-prod.sh
```

**O script fará automaticamente:**

1. ✅ Backup do banco de dados (`clinic.db.bak_TIMESTAMP`)
2. ✅ Git pull das últimas mudanças
3. ✅ npm install --production
4. ✅ Execução das migrations (tabela transactions + coluna last_login_at)
5. ✅ Build do frontend (se necessário)
6. ✅ Reload do PM2 (zero-downtime)
7. ✅ Verificação de saúde da aplicação

### 3. Confirmar Deploy

Quando perguntado "Deseja continuar? (sim/não):", digite:

```
sim
```

---

## 🛠️ Processo de Deploy - Método Manual

Se preferir fazer passo a passo:

### 1. Backup Manual

```bash
cd /home/techlog-api
mkdir -p backups
cp clinic.db backups/clinic.db.bak_$(date +%Y%m%d_%H%M%S)
```

### 2. Atualizar Código

```bash
git pull origin main
```

### 3. Instalar Dependências

```bash
npm install --production
```

### 4. Executar Migrations

```bash
npm run migrate
```

### 5. Instalar Fontes (apenas primeira vez ou se atualizado)

```bash
sudo bash scripts/install-fonts.sh
```

**O que instala:**

- Liberation Fonts (substitutos de Arial, Times, Courier)
- DejaVu Fonts (suporte completo UTF-8)
- Microsoft Core Fonts (Arial, Times New Roman, etc)
- Fontconfig (gerenciador de fontes)

**Necessário para:** Geração de PDFs de receitas com caracteres especiais (ã, ç, é)

### 6. Reiniciar Aplicação

```bash
pm2 reload ecosystem.config.js --update-env
```

### 6. Verificar Status

```bash
pm2 list
pm2 logs techlog-api --lines 50
```

---

## 🔍 Verificações Pós-Deploy

### 1. Status da Aplicação

```bash
pm2 list
```

**Esperado:** Status = `online`

### 2. Logs em Tempo Real

```bash
pm2 logs techlog-api
```

**Busque por:**

- ✅ `Server running on port 3000`
- ✅ `Database connected successfully`
- ❌ Nenhum erro crítico

### 3. Teste Manual no Navegador

**Health Check:**

```
http://seu-servidor-ip:3000/health
```

**Financial Module:**

```
http://seu-servidor-ip:3000/relatorios.html
```

**SaaS Admin Dashboard:**

```
http://seu-servidor-ip:3000/saas-admin.html
```

### 4. Teste de Login

1. Acesse `/login.html`
2. Faça login com um usuário existente
3. Verifique se o dashboard carrega sem erros

### 5. Verificar Tabela Transactions

```bash
cd /home/techlog-api
sqlite3 clinic.db
```

No SQLite shell:

```sql
-- Verificar tabela transactions
SELECT name FROM sqlite_master WHERE type='table' AND name='transactions';

-- Ver estrutura
PRAGMA table_info(transactions);

-- Contar registros
SELECT COUNT(*) FROM transactions;

-- Sair
.quit
```

### 6. Testar Geração de PDF de Receitas

**Teste de fontes e encoding UTF-8:**

```
http://seu-servidor-ip:3000/debug/pdf-test
```

**O que verificar:**

- ✅ PDF abre sem erros
- ✅ Acentos (á, é, ã, ç) aparecem corretamente
- ✅ Símbolos (©, ®, ™) visíveis
- ✅ Todas as fontes listadas estão funcionando

**Se caracteres ficarem quebrados (? ou quadrados):**

```bash
# Instalar fontes manualmente
sudo bash scripts/install-fonts.sh

# Reiniciar aplicação
pm2 restart techlog-api
```

---

## 🚨 Solução de Problemas

### Problema: Deploy falha com erro de Git

```bash
# Solução: Fazer stash das mudanças locais
git stash
bash scripts/deploy-prod.sh
```

### Problema: PM2 não encontrado

```bash
# Solução: Instalar PM2 globalmente
npm install -g pm2
```

### Problema: Migrations falham

```bash
# Solução: Executar migrations manualmente
node scripts/run-migrations.js
```

### Problema: Aplicação não inicia após deploy

```bash
# Ver logs de erro
pm2 logs techlog-api --err --lines 100

# Reiniciar manualmente
pm2 restart techlog-api

# Se ainda falhar, iniciar em modo debug
pm2 delete techlog-api
pm2 start ecosystem.config.js --env production
```

### Problema: Banco de dados corrompido

```bash
# Restaurar último backup
cd /home/techlog-api/backups
ls -lh clinic.db.bak_*

# Restaurar backup específico
cp clinic.db.bak_TIMESTAMP ../clinic.db

# Reiniciar aplicação
pm2 restart techlog-api
```

### Problema: PDF de receitas não gera ou fica com caracteres quebrados

```bash
# Solução 1: Instalar fontes do sistema
sudo bash scripts/install-fonts.sh

# Solução 2: Verificar fontes instaladas
fc-list | grep -i liberation
fc-list | grep -i dejavu

# Solução 3: Atualizar cache de fontes
sudo fc-cache -f -v

# Solução 4: Testar PDF de debug
curl -o test.pdf http://localhost:3000/debug/pdf-test

# Solução 5: Ver logs de erro do PDFKit
pm2 logs techlog-api | grep -i font
```

**Mais detalhes:** Ver [FONTS_GUIDE.md](FONTS_GUIDE.md)

---

## 📊 Comandos Úteis do PM2

### Monitoramento

```bash
# Dashboard interativo
pm2 monit

# Logs em tempo real
pm2 logs

# Logs específicos da aplicação
pm2 logs techlog-api

# Status de todos os processos
pm2 list

# Informações detalhadas
pm2 show techlog-api
```

### Gerenciamento

```bash
# Restart
pm2 restart techlog-api

# Reload (zero-downtime)
pm2 reload techlog-api

# Stop
pm2 stop techlog-api

# Delete
pm2 delete techlog-api

# Salvar configuração atual
pm2 save

# Configurar startup automático
pm2 startup
```

### Limpeza de Logs

```bash
# Limpar logs antigos
pm2 flush

# Ver tamanho dos logs
du -h /home/techlog-api/logs/
```

---

## 🔐 Segurança Pós-Deploy

### 1. Verificar Permissões do Banco

```bash
chmod 640 clinic.db
chown $USER:$USER clinic.db
```

### 2. Verificar Variáveis de Ambiente

```bash
# Não exibir conteúdo, apenas verificar existência
ls -la .env

# JWT_SECRET deve ter pelo menos 32 caracteres
# Não deve ser o valor padrão "test-jwt-secret-key"
```

### 3. Configurar Firewall (se necessário)

```bash
# Permitir apenas porta 3000 localmente
# O acesso externo deve ser via Nginx/Apache
sudo ufw allow 3000/tcp
```

---

## 📈 Monitoramento Contínuo

### Agendar Verificações Diárias

```bash
# Adicionar no crontab
crontab -e
```

Adicione:

```bash
# Backup diário às 2 AM
0 2 * * * cp /home/techlog-api/clinic.db /home/techlog-api/backups/clinic.db.daily_$(date +\%A).bak

# Limpar logs antigos semanalmente
0 3 * * 0 find /home/techlog-api/logs -name "*.log" -type f -mtime +30 -delete

# Restart semanal aos domingos às 4 AM
0 4 * * 0 /usr/bin/pm2 restart techlog-api
```

### Monitoramento de Recursos

```bash
# Uso de CPU e memória
pm2 monit

# Uso de disco
df -h

# Processos
htop
```

---

## 🎉 Checklist Final

Antes de considerar o deploy completo:

- [ ] Backup do banco criado
- [ ] Git pull executado sem erros
- [ ] Dependencies instaladas
- [ ] Migrations executadas com sucesso
- [ ] **Fontes do sistema instaladas (para PDFs)**
- [ ] PM2 reload sem erros
- [ ] Status = `online` no pm2 list
- [ ] Health check respondendo
- [ ] Login funcional
- [ ] Financial module acessível
- [ ] SaaS Admin acessível (para super admin)
- [ ] **PDF de teste gerado com sucesso (`/debug/pdf-test`)**
- [ ] **Caracteres especiais visíveis no PDF (ã, ç, é)**
- [ ] Logs sem erros críticos
- [ ] Tabela `transactions` existe no banco
- [ ] Coluna `last_login_at` existe em users

---

## 📞 Suporte

### Logs para Debug

```bash
# Coletar informações para suporte
cd /home/techlog-api

echo "=== PM2 Status ===" > debug-info.txt
pm2 list >> debug-info.txt

echo "\n=== PM2 Logs (últimas 100 linhas) ===" >> debug-info.txt
pm2 logs techlog-api --lines 100 --nostream >> debug-info.txt

echo "\n=== Database Tables ===" >> debug-info.txt
sqlite3 clinic.db "SELECT name FROM sqlite_master WHERE type='table';" >> debug-info.txt

echo "\n=== Disk Usage ===" >> debug-info.txt
df -h >> debug-info.txt

echo "\n=== Memory Usage ===" >> debug-info.txt
free -h >> debug-info.txt

cat debug-info.txt
```

### Rollback Rápido

Se algo der errado:

```bash
# 1. Parar aplicação
pm2 stop techlog-api

# 2. Restaurar backup do banco
cp backups/clinic.db.bak_MAIS_RECENTE clinic.db

# 3. Voltar para commit anterior
git reset --hard HEAD~1

# 4. Reinstalar dependências
npm install --production

# 5. Reiniciar
pm2 restart techlog-api
```

---

## 📝 Notas de Versão

### v1.0 - Financial Module + SaaS Admin

**Mudanças no Banco de Dados:**

- ✅ Nova tabela: `transactions` (receitas e despesas)
- ✅ Nova coluna: `users.last_login_at` (tracking de login)
- ✅ Índices otimizados para queries de relatório

**Novas Funcionalidades:**

- ✅ Gestão financeira completa (CRUD de transações)
- ✅ Relatórios financeiros com filtros
- ✅ Dashboard Super Admin com MRR
- ✅ Bloqueio/desbloqueio de clínicas
- ✅ Tracking de último login

**Impacto:**

- ✅ Zero breaking changes
- ✅ Compatível com dados existentes
- ✅ Migrations idempotentes (safe para rerun)

---

**Última atualização:** 01/02/2026  
**Versão do Guia:** 1.0  
**Autor:** DevOps Team
