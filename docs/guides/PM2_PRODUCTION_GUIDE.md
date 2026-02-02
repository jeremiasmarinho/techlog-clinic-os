# 🚀 PM2 Process Manager - Guia Completo de Alta Disponibilidade

## 📋 O Que É PM2?

PM2 é um **gerenciador de processos** para aplicações Node.js que garante:

- ✅ Alta disponibilidade (zero downtime)
- ✅ Auto-restart em caso de crash
- ✅ Modo cluster (usa todos os núcleos da CPU)
- ✅ Gerenciamento de logs
- ✅ Monitoramento em tempo real
- ✅ Auto-start no boot do sistema

---

## 📦 Instalação

### Instalar PM2 Globalmente

```bash
npm install -g pm2
```

**Ou instalar localmente no projeto:**

```bash
npm install --save-dev pm2
```

### Verificar Instalação

```bash
pm2 --version
```

---

## ⚙️ Configuração (ecosystem.config.js)

### Características da Configuração

```javascript
{
  name: 'techlog-clinic-api',
  script: './dist/server.js',

  // ALTA DISPONIBILIDADE
  instances: 'max',              // Usa todos os núcleos da CPU
  exec_mode: 'cluster',          // Modo cluster (load balancing)

  // ESTABILIDADE
  max_memory_restart: '500M',    // Reinicia se passar de 500MB
  max_restarts: 10,              // Máx 10 restarts em 1 minuto
  min_uptime: '10s',             // Considera estável após 10s

  // LOGS
  error_file: './logs/pm2-error.log',
  out_file: './logs/pm2-out.log',

  // AMBIENTE
  env_production: {
    NODE_ENV: 'production',
    PORT: 3001,
  }
}
```

---

## 🚀 Comandos Essenciais

### Iniciar Aplicação

```bash
# Produção (cluster mode)
npm run pm2:start
# OU
pm2 start ecosystem.config.js --env production

# Desenvolvimento (single instance)
npm run pm2:dev
# OU
pm2 start ecosystem.config.js --only techlog-clinic-api-dev
```

### Gerenciar Aplicação

```bash
# Ver status de todos os processos
npm run pm2:status
# OU
pm2 status

# Parar aplicação
npm run pm2:stop
# OU
pm2 stop techlog-clinic-api

# Reiniciar aplicação (downtime de ~1s)
npm run pm2:restart

# Reload sem downtime (cluster mode)
npm run pm2:reload

# Deletar da lista do PM2
npm run pm2:delete
```

### Logs

```bash
# Ver logs em tempo real
npm run pm2:logs
# OU
pm2 logs techlog-clinic-api

# Ver logs de erro apenas
pm2 logs techlog-clinic-api --err

# Ver últimas 100 linhas
pm2 logs techlog-clinic-api --lines 100

# Limpar todos os logs
npm run pm2:flush
# OU
pm2 flush
```

### Monitoramento

```bash
# Interface de monitoramento (CPU, RAM)
npm run pm2:monit
# OU
pm2 monit

# Informações detalhadas
pm2 show techlog-clinic-api

# Ver métricas
pm2 describe techlog-clinic-api
```

---

## 🔄 Auto-Start no Boot do Sistema

### Linux (Ubuntu/Debian/CentOS)

```bash
# 1. Gerar script de startup
pm2 startup

# 2. Copiar e executar o comando que aparece (exemplo):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u node --hp /home/node

# 3. Iniciar sua aplicação
pm2 start ecosystem.config.js --env production

# 4. Salvar configuração atual
pm2 save

# 5. Verificar se funcionou
pm2 list
```

**Testar reboot:**

```bash
sudo reboot
# Após reiniciar, verificar:
pm2 list
```

### Windows

```bash
# 1. Instalar pm2-windows-startup
npm install -g pm2-windows-startup

# 2. Configurar auto-start
pm2-startup install

# 3. Iniciar aplicação
pm2 start ecosystem.config.js --env production

# 4. Salvar configuração
pm2 save
```

**Testar reboot:**

```bash
# Reiniciar Windows
# Após reiniciar, abrir CMD/PowerShell:
pm2 list
```

### Desabilitar Auto-Start

```bash
# Linux
pm2 unstartup systemd

# Windows
pm2-startup uninstall
```

---

## 📊 Rotação de Logs

### Instalar Módulo de Log Rotation

```bash
pm2 install pm2-logrotate
```

### Configurar (arquivo pm2-logrotate.json já criado)

```json
{
  "max_size": "10M", // Máx 10MB por arquivo
  "retain": "30", // Manter 30 arquivos antigos
  "compress": true, // Comprimir logs antigos (.gz)
  "dateFormat": "YYYY-MM-DD_HH-mm-ss",
  "rotateInterval": "0 0 * * *" // Rotacionar diariamente à meia-noite
}
```

### Aplicar Configuração

```bash
# Ver configuração atual
pm2 conf pm2-logrotate

# Alterar configurações
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

---

## 🔧 Deploy de Produção - Passo a Passo

### 1. Build da Aplicação

```bash
npm install
npm run build
```

### 2. Verificar Build

```bash
ls -lh dist/
# Deve mostrar arquivos .js compilados
```

### 3. Iniciar com PM2

```bash
pm2 start ecosystem.config.js --env production
```

### 4. Verificar Status

```bash
pm2 status
pm2 logs techlog-clinic-api --lines 50
```

### 5. Configurar Auto-Start

```bash
pm2 startup
# Copiar e executar o comando mostrado
pm2 save
```

### 6. Verificar Cluster Mode

```bash
pm2 status
# Deve mostrar múltiplas instâncias (uma por núcleo de CPU)
```

**Exemplo de output:**

```
┌─────┬───────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name                  │ mode    │ ↺       │ status   │
├─────┼───────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ techlog-clinic-api    │ cluster │ 0       │ online   │
│ 1   │ techlog-clinic-api    │ cluster │ 0       │ online   │
│ 2   │ techlog-clinic-api    │ cluster │ 0       │ online   │
│ 3   │ techlog-clinic-api    │ cluster │ 0       │ online   │
└─────┴───────────────────────┴─────────┴─────────┴──────────┘
```

---

## 🔄 Atualização Zero-Downtime

### Método 1: Reload (Recomendado)

```bash
# Build nova versão
npm run build

# Reload sem downtime (cluster gracefully restarts)
npm run pm2:reload
# OU
pm2 reload ecosystem.config.js --env production
```

**Como funciona:**

1. PM2 reinicia instância 1 (outras continuam rodando)
2. Aguarda instância 1 ficar pronta
3. Reinicia instância 2 (1 e outras continuam)
4. Repete até todas atualizadas
5. **Zero downtime!** ✅

### Método 2: Restart (Downtime de ~1s)

```bash
npm run build
npm run pm2:restart
```

---

## 🛡️ Cenários de Erro e Recuperação

### 1. Crash da Aplicação

**PM2 detecta e reinicia automaticamente:**

```bash
# Simular crash
pm2 trigger techlog-clinic-api restart

# Ver logs
pm2 logs techlog-clinic-api
```

**Configuração no ecosystem.config.js:**

```javascript
autorestart: true,          // Reinicia automaticamente
max_restarts: 10,          // Máx 10 restarts em 1 min
min_uptime: '10s',         // Considera estável após 10s
```

### 2. Vazamento de Memória

**PM2 reinicia se passar de 500MB:**

```javascript
max_memory_restart: '500M';
```

**Monitorar uso de memória:**

```bash
pm2 monit
# OU
watch -n 1 "pm2 jlist | jq '.[0].monit.memory'"
```

### 3. Múltiplos Crashes Rápidos

Se app crashar 10 vezes em 1 minuto, PM2 para de tentar:

```bash
pm2 status
# Status: errored (stopped - max restarts reached)
```

**Resolver:**

```bash
# Ver logs para identificar problema
pm2 logs techlog-clinic-api --err

# Corrigir código
# Fazer build
npm run build

# Resetar contador de restarts e iniciar
pm2 restart techlog-clinic-api
```

---

## 📊 Monitoramento Avançado

### 1. PM2 Dashboard (Terminal)

```bash
pm2 monit
```

Mostra em tempo real:

- CPU usage (%)
- Memory usage (MB)
- Loop delay (ms)
- Active requests

### 2. Logs Estruturados

```bash
# Logs com timestamp
pm2 logs --timestamp

# Logs em formato JSON
pm2 logs --json

# Filtrar por palavra
pm2 logs | grep "ERROR"
```

### 3. Métricas via CLI

```bash
# CPU e memória de todas instâncias
pm2 describe techlog-clinic-api

# Informações detalhadas
pm2 info techlog-clinic-api
```

---

## 🔍 Debugging em Produção

### Acessar Logs Específicos

```bash
# Últimas 100 linhas de erro
pm2 logs techlog-clinic-api --err --lines 100

# Seguir logs de uma instância específica
pm2 logs techlog-clinic-api --instance 0

# Buscar padrão nos logs
pm2 logs techlog-clinic-api | grep "database"
```

### Ver Stack Traces

```bash
# Informações detalhadas de crash
pm2 show techlog-clinic-api

# Ver exceções não tratadas
tail -f logs/pm2-error.log
```

---

## 🚨 Troubleshooting

### Problema: PM2 não encontrado após reboot

**Solução:**

```bash
# Re-configurar startup
pm2 startup
# Executar comando mostrado
pm2 save
```

### Problema: Aplicação não inicia

**Diagnóstico:**

```bash
# Ver status
pm2 status

# Ver logs de erro
pm2 logs techlog-clinic-api --err --lines 50

# Informações detalhadas
pm2 describe techlog-clinic-api
```

### Problema: Logs muito grandes

**Solução:**

```bash
# Limpar logs
pm2 flush

# Configurar rotação
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Problema: Cluster mode não funciona

**Possíveis causas:**

- Servidor HTTP não está usando `cluster` nativamente
- Porta em uso
- Permissões incorretas

**Solução:**

```bash
# Testar em modo fork primeiro
pm2 start dist/server.js --name test-fork

# Se funcionar, problema está no cluster
# Verificar se Express/servidor está configurado corretamente
```

---

## 📈 Comparação: Sem PM2 vs Com PM2

| Aspecto           | ❌ Sem PM2  | ✅ Com PM2          |
| ----------------- | ----------- | ------------------- |
| **Crash**         | App para    | Auto-restart        |
| **CPU**           | 1 núcleo    | Todos os núcleos    |
| **Deploy**        | Downtime    | Zero downtime       |
| **Memória**       | Sem limite  | Restart em 500MB    |
| **Logs**          | console.log | Arquivos + rotação  |
| **Monitoramento** | Manual      | Dashboard integrado |
| **Auto-start**    | Manual      | Automático no boot  |

---

## 📝 Checklist de Produção

### Antes do Deploy

- [ ] ✅ PM2 instalado globalmente: `npm install -g pm2`
- [ ] ✅ Build compilado: `npm run build`
- [ ] ✅ Teste local: `node dist/server.js`
- [ ] ✅ ecosystem.config.js configurado
- [ ] ✅ Diretório `logs/` criado

### Durante Deploy

- [ ] ✅ Iniciar com PM2: `pm2 start ecosystem.config.js --env production`
- [ ] ✅ Verificar status: `pm2 status`
- [ ] ✅ Verificar logs: `pm2 logs techlog-clinic-api --lines 50`
- [ ] ✅ Verificar cluster: múltiplas instâncias rodando

### Pós-Deploy

- [ ] ✅ Configurar auto-start: `pm2 startup` + `pm2 save`
- [ ] ✅ Instalar log rotation: `pm2 install pm2-logrotate`
- [ ] ✅ Configurar rotação de logs
- [ ] ✅ Testar reboot: `sudo reboot` e verificar `pm2 list`
- [ ] ✅ Monitorar por 1 hora: `pm2 monit`

---

## 🎯 Comandos de Referência Rápida

```bash
# INICIAR
pm2 start ecosystem.config.js --env production

# STATUS
pm2 status

# LOGS
pm2 logs techlog-clinic-api

# MONITORAR
pm2 monit

# RELOAD (zero downtime)
pm2 reload ecosystem.config.js

# RESTART (downtime ~1s)
pm2 restart techlog-clinic-api

# PARAR
pm2 stop techlog-clinic-api

# DELETAR
pm2 delete techlog-clinic-api

# AUTO-START
pm2 startup
pm2 save

# LIMPAR LOGS
pm2 flush
```

---

## 📚 Recursos Adicionais

- **Documentação Oficial:** https://pm2.keymetrics.io/docs/usage/quick-start/
- **Cluster Mode:** https://pm2.keymetrics.io/docs/usage/cluster-mode/
- **Log Rotation:** https://github.com/keymetrics/pm2-logrotate
- **Deploy:** https://pm2.keymetrics.io/docs/usage/deployment/

---

**Status:** ✅ Configuração Completa  
**Última atualização:** February 1, 2026  
**Versão:** 1.0
