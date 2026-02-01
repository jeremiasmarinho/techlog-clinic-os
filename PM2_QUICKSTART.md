# ⚡ PM2 Quick Start - Alta Disponibilidade

## 🚀 Instalação (Uma Única Vez)

```bash
npm install -g pm2
```

---

## 🎯 Comandos Essenciais

### Iniciar em Produção

```bash
# Build + Start
npm run build
npm run pm2:start

# Ver status
npm run pm2:status
```

### Auto-Start no Boot

**Linux:**

```bash
pm2 startup
# Copiar e executar o comando mostrado
pm2 save
```

**Windows:**

```bash
npm install -g pm2-windows-startup
pm2-startup install
pm2 start ecosystem.config.js --env production
pm2 save
```

---

## 🔄 Deploy/Atualização (Zero Downtime)

```bash
# 1. Build nova versão
npm run build

# 2. Reload sem downtime
npm run pm2:reload

# 3. Verificar
npm run pm2:status
npm run pm2:logs
```

---

## 📊 Monitoramento

```bash
# Dashboard em tempo real
npm run pm2:monit

# Ver logs
npm run pm2:logs

# Status
npm run pm2:status
```

---

## 🛠️ Gerenciamento

```bash
npm run pm2:restart    # Reiniciar (downtime ~1s)
npm run pm2:reload     # Reload (zero downtime)
npm run pm2:stop       # Parar
npm run pm2:delete     # Remover
npm run pm2:flush      # Limpar logs
```

---

## 📈 O Que Você Ganha

✅ **Cluster Mode** - Usa TODOS os núcleos da CPU  
✅ **Auto-Restart** - Reinicia se crashar  
✅ **Limite de Memória** - Reinicia se passar de 500MB  
✅ **Zero Downtime** - Deploy sem parar serviço  
✅ **Logs Rotacionados** - Não enche o disco  
✅ **Auto-Start** - Inicia automaticamente no boot

---

## 🔧 Configuração (ecosystem.config.js)

```javascript
{
  name: 'techlog-clinic-api',
  script: './dist/server.js',
  instances: 'max',           // Todos os CPUs
  exec_mode: 'cluster',       // Cluster mode
  max_memory_restart: '500M', // Limite de memória
  autorestart: true,          // Auto-restart
  env_production: {
    NODE_ENV: 'production',
    PORT: 3001,
  }
}
```

---

## 🚨 Comandos de Emergência

```bash
# Ver o que está acontecendo
pm2 logs techlog-clinic-api --err --lines 100

# Reiniciar tudo
pm2 restart all

# Parar tudo
pm2 stop all

# Deletar tudo
pm2 delete all
```

---

## 📝 Checklist de Deploy

```bash
# 1. Instalar PM2 (primeira vez)
npm install -g pm2

# 2. Build
npm run build

# 3. Iniciar
npm run pm2:start

# 4. Verificar (4+ instâncias = cluster ativo)
pm2 status

# 5. Auto-start no boot
pm2 startup
# [executar comando mostrado]
pm2 save

# 6. Instalar log rotation
pm2 install pm2-logrotate

# 7. Testar reboot
sudo reboot
# Após reiniciar:
pm2 list  # Deve mostrar app rodando
```

---

## 🎉 Resultado

Aplicação rodando com:

- ✅ Múltiplas instâncias (cluster)
- ✅ Auto-restart se crashar
- ✅ Auto-start no boot
- ✅ Logs organizados
- ✅ Zero downtime em deploy

**Documentação completa:** [PM2_PRODUCTION_GUIDE.md](PM2_PRODUCTION_GUIDE.md)

---

**Versão:** 1.0  
**Data:** February 1, 2026
