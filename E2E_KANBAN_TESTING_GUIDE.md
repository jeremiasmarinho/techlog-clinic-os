# 🎭 Guia de Testes E2E com Playwright - Kanban Board

## 📋 Visão Geral

Este guia documenta os testes End-to-End (E2E) implementados para o **Kanban Board** usando
**Playwright**. Os testes cobrem todo o fluxo de usuário, desde login até manipulação de cards com
verificação de persistência.

## 🛠️ Tecnologias Utilizadas

- **Playwright**: Framework de automação de testes E2E
- **JavaScript**: Linguagem dos testes (compatível com stack Vanilla JS)
- **Chromium/Firefox/WebKit**: Browsers suportados

## 📦 Instalação do Playwright

### Opção 1: Instalação Completa (Recomendada)

```bash
# Instalar Playwright
npm install --save-dev @playwright/test

# Instalar todos os browsers
npx playwright install
```

### Opção 2: Instalação Rápida (Apenas Chromium)

```bash
# Instalar Playwright
npm install --save-dev @playwright/test

# Instalar apenas Chromium (mais rápido)
npx playwright install chromium
```

### Verificar Instalação

```bash
# Verificar versão
npx playwright --version

# Testar com exemplo
npx playwright test --help
```

## 🧪 Arquivo de Teste: kanban.spec.js

### Localização

```
tests/e2e/kanban.spec.js
```

### Estrutura dos Testes

O arquivo contém **6 testes abrangentes**:

#### 1. ✅ Login e Navegação

- Acessa página de login
- Preenche credenciais
- Navega até o Kanban
- Verifica colunas visíveis

#### 2. 🎨 Modal de Detalhes (Glassmorphism)

- Clica em card de paciente
- Verifica abertura do modal
- Valida efeito glassmorphism (backdrop-blur)
- Confirma campos do formulário
- Testa fechamento do modal

#### 3. 🔄 Drag & Drop

- Seleciona card da coluna "Novo"
- Executa drag & drop para "Em Atendimento"
- Verifica movimento do card
- Valida atualização visual

#### 4. 💾 Edição e Persistência

- Abre modal de edição
- Modifica dados (médico, data, nota)
- Salva alterações
- **Recarrega a página**
- Verifica que dados persistiram

#### 5. 🎭 Estilos Glassmorphism

- Verifica classes CSS `.glass-card`
- Valida `backdrop-blur` em elementos
- Confirma aplicação em cards e colunas
- Testa consistência visual

#### 6. ⚡ Performance e Responsividade

- Mede tempo de carregamento
- Testa viewports (Mobile, Tablet, Desktop)
- Valida responsividade das colunas

## 🚀 Executando os Testes

### Executar Todos os Testes E2E

```bash
npm run test:e2e
```

### Executar Apenas kanban.spec.js

```bash
npx playwright test tests/e2e/kanban.spec.js
```

### Modo Headed (Com Interface Visual)

```bash
npx playwright test tests/e2e/kanban.spec.js --headed
```

### Modo Debug (Passo a Passo)

```bash
npx playwright test tests/e2e/kanban.spec.js --debug
```

### Executar Teste Específico

```bash
# Por nome do teste
npx playwright test tests/e2e/kanban.spec.js -g "Deve abrir modal"

# Por número do teste
npx playwright test tests/e2e/kanban.spec.js -g "TESTE 2"
```

### Ver Relatório HTML

```bash
npx playwright show-report
```

## 📊 Saída dos Testes

### Exemplo de Saída Bem-Sucedida

```
🧪 TESTE 1: Login e Navegação ao Kanban
  ✓ Coluna "column-novo" está visível
  ✓ Coluna "column-em_atendimento" está visível
  ✓ Coluna "column-agendado" está visível
  ✓ Coluna "column-finalizado" está visível
✅ TESTE 1 PASSOU: Login e navegação OK

🧪 TESTE 2: Abertura do Modal de Detalhes
  ℹ️  Encontrados cards no Kanban
  📝 Paciente: João Silva
  ✓ Modal de edição está visível
  ✓ Efeito glassmorphism (backdrop-blur) detectado
  ✓ Cabeçalho do modal correto
  ✓ Campos do formulário estão visíveis
  ✓ Modal fechado com sucesso
✅ TESTE 2 PASSOU: Modal glassmorphism OK

🧪 TESTE 3: Drag & Drop de Card
  📝 Card ID: 123, Paciente: Maria Santos
  ↔️  Movendo card de (150, 300) para (450, 300)
  ✓ Drag & Drop executado
  ✅ Card movido com sucesso para coluna de destino
✅ TESTE 3 PASSOU: Drag & Drop testado

🧪 TESTE 4: Edição de Status e Persistência
  📝 Card ID: 123
  👤 Paciente: João Silva
  📊 Status Original: novo
  ✓ Modal de edição aberto
  📅 Data atual: 2026-02-02T10:00
  👨‍⚕️ Médico atual: Dr. Silva
  ✏️  Adicionada nota de teste
  ✓ Alterações salvas
  ✓ Modal fechado após salvar

  🔄 Recarregando página para testar persistência...
  ✅ Card ainda existe após reload
  ✅ Nome do paciente persistiu
  ✅ Nota persistiu após reload
✅ TESTE 4 PASSOU: Persistência verificada com sucesso

🧪 TESTE 5: Verificação de Estilos Glassmorphism
  ✓ Encontrados 24 elementos com classe .glass-card
  ✓ 4 colunas do Kanban encontradas
  ✓ Efeito backdrop-blur detectado nas colunas
  ✓ 18 cards de paciente encontrados
  ✓ Cards têm efeito glassmorphism aplicado
✅ TESTE 5 PASSOU: Estilos glassmorphism verificados

🧪 TESTE 6: Performance e Responsividade
  ⏱️  Tempo de carregamento: 1234ms
  ✓ Carregamento dentro do limite aceitável
  ✓ Mobile (375x667): OK
  ✓ Tablet (768x1024): OK
  ✓ Desktop (1920x1080): OK
✅ TESTE 6 PASSOU: Performance e responsividade OK

============================================================
📊 RESUMO DOS TESTES E2E - KANBAN BOARD
============================================================
✅ Teste 1: Login e Navegação
✅ Teste 2: Modal de Detalhes (Glassmorphism)
✅ Teste 3: Drag & Drop de Cards
✅ Teste 4: Edição e Persistência de Dados
✅ Teste 5: Estilos Glassmorphism
✅ Teste 6: Performance e Responsividade
============================================================
🎉 Todos os testes completados!
============================================================

6 passed (45s)
```

## 🎯 O Que Cada Teste Valida

### Teste 1: Login e Navegação

- ✅ Autenticação funciona corretamente
- ✅ Redirecionamento para página correta
- ✅ Kanban carrega com todas as colunas
- ✅ Título da página está correto

### Teste 2: Modal de Detalhes

- ✅ Click no card abre modal
- ✅ Modal tem classe glassmorphism
- ✅ Efeito backdrop-blur está aplicado
- ✅ Formulário contém todos os campos
- ✅ Modal fecha corretamente

### Teste 3: Drag & Drop

- ✅ Cards são arrastáveis
- ✅ Drop zones funcionam
- ✅ Card muda de coluna visualmente
- ✅ Animações funcionam

### Teste 4: Persistência

- ✅ Edição salva no banco
- ✅ Dados permanecem após reload
- ✅ Notas são persistidas
- ✅ Timestamps atualizados

### Teste 5: Glassmorphism

- ✅ Classes CSS corretas aplicadas
- ✅ Backdrop-blur funciona
- ✅ Transparência e blur consistentes
- ✅ Visual glassmorphism em todos os elementos

### Teste 6: Performance

- ✅ Carrega em menos de 5 segundos
- ✅ Responsivo em mobile
- ✅ Responsivo em tablet
- ✅ Responsivo em desktop

## 🔧 Configuração Avançada

### Alterar Credenciais de Teste

Edite o arquivo `kanban.spec.js`:

```javascript
const CREDENTIALS = {
  username: 'seu.usuario',
  password: 'SuaSenha123!',
};
```

### Ajustar Timeouts

```javascript
test.setTimeout(90000); // 90 segundos
```

### Adicionar Screenshots em Falhas

O Playwright já captura automaticamente, mas você pode forçar:

```javascript
await page.screenshot({ path: 'screenshot.png', fullPage: true });
```

### Debug Interativo

```bash
# Abre DevTools do browser
npx playwright test --debug

# Pausa em ponto específico
await page.pause();
```

## 📸 Capturas e Traces

### Gerar Trace para Debug

```bash
npx playwright test --trace on
```

### Ver Trace Viewer

```bash
npx playwright show-trace trace.zip
```

## 🐛 Troubleshooting

### Problema: "Browser not found"

```bash
# Reinstalar browsers
npx playwright install --force
```

### Problema: "Test timeout"

```javascript
// Aumentar timeout no teste
test.setTimeout(120000); // 2 minutos
```

### Problema: "Element not found"

```javascript
// Adicionar wait mais específico
await page.waitForSelector('.lead-card', { timeout: 10000 });
```

### Problema: Cards não aparecem

```bash
# Verificar se banco de dados tem dados
npm run seed
```

## 📚 Scripts NPM Disponíveis

```json
{
  "test:e2e": "TEST_MODE=true playwright test",
  "test:e2e:ui": "TEST_MODE=true playwright test --ui",
  "test:e2e:headed": "TEST_MODE=true playwright test --headed",
  "test:e2e:debug": "TEST_MODE=true playwright test --debug",
  "test:e2e:report": "playwright show-report"
}
```

## 🎨 Boas Práticas Implementadas

1. ✅ **Helper Functions**: Reutilização de código (login, closeModals)
2. ✅ **Logging Detalhado**: Console logs informativos
3. ✅ **Skip Inteligente**: Testes pulam se não há dados
4. ✅ **Waits Apropriados**: Aguarda animações e carregamentos
5. ✅ **Assertions Claras**: Mensagens descritivas
6. ✅ **Cleanup**: Fecha modais entre testes
7. ✅ **Isolation**: Cada teste é independente

## 🔐 Segurança

- ❌ **NÃO** commitar credenciais reais
- ✅ Usar variáveis de ambiente para CI/CD
- ✅ Banco de teste separado (`clinic.test.db`)

## 🚀 CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v2
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📖 Recursos Adicionais

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright API](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)

## 🤝 Contribuindo

Ao adicionar novos testes E2E:

1. Siga a estrutura de numeração (TESTE 7, TESTE 8, etc.)
2. Use console.log para feedback visual
3. Adicione waits apropriados
4. Verifique responsividade
5. Teste persistência quando aplicável
6. Documente no README

## 📝 Próximos Testes Sugeridos

- [ ] Teste de filtros de data no Kanban
- [ ] Teste de busca por nome/telefone
- [ ] Teste de WhatsApp integration
- [ ] Teste de archive/unarchive
- [ ] Teste de métricas/dashboard
- [ ] Teste de multi-usuário (concorrência)

---

**Desenvolvido por**: QA Engineer  
**Data**: 2026-02-01  
**Versão**: 1.0.0  
**Stack**: Frontend Vanilla (HTML/JS/Tailwind) + Playwright
