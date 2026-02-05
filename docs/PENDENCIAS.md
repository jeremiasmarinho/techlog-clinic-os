# 🎯 Pendências e Próximos Passos

> **Status:** Atualizado em 05/02/2026

---

## 🔴 Pendências Críticas

### 1. Light Mode - Estilos não aplicando corretamente

**Problema:** Lead cards e badges não estão com as cores corretas no modo claro.

**Sintomas:**

- Lead cards continuam com fundo escuro/transparente
- Badges (Consulta, Recorrência) sem contraste adequado
- Botões de filtro (7 Dias, Privacidade) com cores feias

**Investigação feita:**

- ✅ themes.css movido para depois dos estilos inline em admin.html
- ✅ Seletores com alta especificidade (`html[data-theme="light"]`)
- ✅ Testes E2E passando (14/14 tests)
- ❓ Possível problema de cache ou Tailwind CDN sobrescrevendo

**Próximos passos:**

1. Verificar se Tailwind CDN está gerando classes inline que sobrescrevem
2. Considerar remover classes Tailwind de cores dos elementos dinâmicos
3. Usar `style` inline via JavaScript como última opção
4. Testar em aba anônima para descartar cache

**Arquivos relevantes:**

- `/public/css/themes.css` - Estilos de tema
- `/public/css/design-system.css` - Variáveis CSS
- `/public/admin.html` - Página do kanban (linhas 160-175 tem estilos inline)
- `/public/js/components/lead-card.js` - Componente que gera os cards

---

## 🟡 Pendências Médias

### 2. Testes E2E incompletos

**Status:** Parcial

**Testes existentes:**

- ✅ Theme visual effects (40-theme-visual-effects.spec.ts)
- ✅ Settings logo upload (settings-logo.spec.ts)
- ✅ Login e autenticação
- ✅ Financial module

**Testes faltando:**

- [ ] Kanban drag-and-drop completo
- [ ] Agenda com FullCalendar
- [ ] Relatórios
- [ ] Criação/edição de usuários
- [ ] Multi-tenant isolation E2E

### 3. Responsividade Mobile

**Status:** Parcial

- Sidebar responsiva ✅
- Kanban columns no mobile ⚠️ (scroll horizontal)
- Modais no mobile ⚠️ (podem ficar cortados)

---

## 🟢 Concluídos Recentemente

### ✅ Sistema de Temas (05/02/2026)

- ThemeManager com persistência
- Sincronização com backend
- Toggle funcionando

### ✅ Upload de Logo (05/02/2026)

- Endpoint POST /api/clinic/logo
- Preview em tempo real
- Persistência no servidor

### ✅ Criação de Usuários (05/02/2026)

- Endpoint POST /api/users
- Validação de senha forte
- Hash com bcrypt

### ✅ CI/CD com Testes (05/02/2026)

- Pre-push hook roda testes
- 173 testes passando
- Build sem erros

---

## 📋 Backlog Futuro

### Features

- [ ] Integração Google Calendar
- [ ] Notificações push
- [ ] Chat interno
- [ ] App mobile
- [ ] Exportação de relatórios PDF
- [ ] Dashboard com gráficos

### Técnico

- [ ] Migrar para PostgreSQL em produção
- [ ] Implementar Redis para cache
- [ ] Adicionar rate limiting
- [ ] Logging centralizado (ex: Sentry)

### Documentação

- [x] Consolidar docs antigas ✅
- [ ] Adicionar API docs (Swagger)
- [ ] Vídeos tutoriais

---

## 🔧 Instruções para Continuar

### Para resolver o Light Mode:

```bash
# 1. Verificar estado atual
cd /home/techlog-api
git status

# 2. Abrir o browser em modo anônimo
# Acessar http://localhost:3001/admin.html

# 3. Alternar para light mode (botão Tema no sidebar)

# 4. Abrir DevTools (F12)
# - Ir em Elements
# - Verificar se <html data-theme="light">
# - Inspecionar um lead-card
# - Ver quais estilos estão aplicando

# 5. Se Tailwind estiver sobrescrevendo:
# - Remover classes de cor do lead-card.js
# - Ou adicionar classes customizadas que não conflitam
```

### Para adicionar novos testes E2E:

```bash
# 1. Criar arquivo de teste
touch tests/e2e/50-minha-feature.spec.ts

# 2. Seguir padrão dos testes existentes
# Ver: tests/e2e/40-theme-visual-effects.spec.ts

# 3. Rodar teste
npx playwright test tests/e2e/50-minha-feature.spec.ts --ui
```

### Para fazer deploy:

```bash
# 1. Garantir que tudo está ok
npm test
npm run build

# 2. Commit e push
git add .
git commit -m "feat/fix: descrição"
git push origin main

# 3. O CI/CD vai rodar automaticamente
# Verificar em: https://github.com/jeremiasmarinho/techlog-clinic-os/actions
```

---

## 📞 Contexto da Sessão Anterior

**O que foi feito:**

1. Pesquisamos designs de CRMs médicos (Aetna, Oscar Health)
2. Atualizamos cores do light mode em design-system.css
3. Adicionamos estilos de lead-cards e badges em themes.css
4. Movemos themes.css para carregar após estilos inline
5. Criamos testes E2E para tema (todos passando)
6. Fizemos commit e push

**O que não funcionou:**

- Visualmente os estilos não estão aparecendo como esperado
- Testes passam mas visual não muda

**Hipótese principal:**

- O Tailwind CDN pode estar gerando estilos inline que têm maior especificidade
- Ou há cache agressivo do browser

---

_Última atualização: 05/02/2026_
