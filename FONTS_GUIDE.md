# 🎨 Guia de Fontes para PDFKit

## 📋 Problema

Servidores Linux (especialmente Ubuntu/Debian) muitas vezes não têm fontes instaladas, o que pode
causar problemas ao gerar PDFs com PDFKit:

- ❌ Texto não aparece
- ❌ Caracteres especiais (ã, ç, é) ficam quebrados
- ❌ Encoding UTF-8 não funciona corretamente

## ✅ Solução Implementada

### 1. Script de Instalação de Fontes

Criado `scripts/install-fonts.sh` que instala todas as fontes necessárias.

**Para instalar no servidor:**

```bash
# Tornar o script executável
chmod +x scripts/install-fonts.sh

# Executar com sudo (requer permissões de administrador)
sudo bash scripts/install-fonts.sh
```

**O que o script instala:**

- ✅ **Liberation Fonts** - Substitutos livres de Arial, Times New Roman, Courier
- ✅ **DejaVu Fonts** - Suporte completo a UTF-8 e acentuação
- ✅ **Microsoft Core Fonts** - Arial, Times New Roman, etc (via EULA)
- ✅ **Noto Fonts** - Suporte internacional
- ✅ **Fontconfig** - Gerenciador de fontes do sistema

### 2. Fallback Seguro no PrescriptionPdfService

Adicionado sistema de fallback que garante que o PDF sempre será gerado, mesmo sem fontes
instaladas:

```typescript
// PDFKit usa fontes padrão que SEMPRE funcionam:
// - Helvetica (sans-serif, padrão)
// - Times-Roman (serif)
// - Courier (monospace)

// Se uma fonte customizada falhar, usa Helvetica automaticamente
```

**Melhorias implementadas:**

- ✅ Método `applyFontFallback()` - Garante que sempre há uma fonte disponível
- ✅ Configuração segura do PDFDocument
- ✅ Try-catch para fontes customizadas
- ✅ Suporte completo a UTF-8 (acentos, ç, caracteres especiais)

### 3. Rota de Teste de PDF

Criada rota temporária para testar fontes e encoding:

```
GET /debug/pdf-test
```

**Como usar:**

1. Inicie o servidor:

```bash
npm run dev
```

2. Acesse no navegador:

```
http://localhost:3000/debug/pdf-test
```

3. Um PDF será gerado com:
   - ✅ Todos os caracteres especiais (á, é, ç, ã, etc)
   - ✅ Teste de todas as fontes padrão
   - ✅ Símbolos e acentuação
   - ✅ Informações do sistema (Node.js version, platform)

**O que verificar no PDF de teste:**

- Se todos os acentos aparecem corretamente
- Se o "ç" está legível
- Se os símbolos (©, ®, ™) aparecem
- Se não há caracteres "?" ou quadrados vazios

## 🚀 Instalação em Produção

### Passo 1: Atualizar Código

```bash
cd /home/techlog-api
git pull origin main
npm install --production
```

### Passo 2: Instalar Fontes (uma vez só)

```bash
# No servidor VPS (via SSH)
cd /home/techlog-api
sudo bash scripts/install-fonts.sh
```

**Processo de instalação:**

1. Atualiza lista de pacotes (`apt-get update`)
2. Instala Liberation Fonts
3. Instala DejaVu Fonts
4. Instala Microsoft Core Fonts (requer aceitar EULA)
5. Instala Noto Fonts
6. Instala Fontconfig
7. Atualiza cache de fontes (`fc-cache -f -v`)

**Tempo estimado:** 2-5 minutos (dependendo da conexão de internet)

### Passo 3: Testar no Servidor

```bash
# Reiniciar aplicação
pm2 restart techlog-api

# Testar PDF de fontes
curl -o test-fonts.pdf http://localhost:3000/debug/pdf-test

# Verificar se o PDF foi gerado
ls -lh test-fonts.pdf

# Baixar PDF para seu computador para visualizar
# (via SCP ou copiar conteúdo)
```

### Passo 4: Verificar Fontes Instaladas

```bash
# Listar fontes Liberation
fc-list | grep -i liberation

# Listar fontes DejaVu
fc-list | grep -i dejavu

# Listar fontes Microsoft
fc-list | grep -i arial
```

**Saída esperada:**

```
Liberation Sans
Liberation Serif
Liberation Mono
DejaVu Sans
DejaVu Serif
Arial
Times New Roman
Courier New
```

## 🔍 Comandos Úteis

### Verificar Fontes Disponíveis

```bash
# Todas as fontes
fc-list

# Apenas fontes sans-serif
fc-list : family style | grep -i sans

# Apenas fontes com suporte a português
fc-list :lang=pt
```

### Remover Cache de Fontes (se necessário)

```bash
sudo fc-cache -f -v
```

### Desinstalar Fontes (se necessário)

```bash
sudo apt-get remove --purge fonts-liberation fonts-dejavu ttf-mscorefonts-installer
sudo apt-get autoremove
```

## 📝 Notas Técnicas

### Fontes Padrão do PDFKit

PDFKit inclui 14 fontes **embutidas** que funcionam sem instalar nada:

**Sans-serif:**

- Helvetica
- Helvetica-Bold
- Helvetica-Oblique
- Helvetica-BoldOblique

**Serif:**

- Times-Roman
- Times-Bold
- Times-Italic
- Times-BoldItalic

**Monospace:**

- Courier
- Courier-Bold
- Courier-Oblique
- Courier-BoldOblique

**Símbolos:**

- Symbol
- ZapfDingbats

### Usar Fontes Customizadas

Para usar fontes customizadas (ex: fontes da marca):

```typescript
// 1. Adicionar fonte TTF ao projeto
// /home/techlog-api/assets/fonts/MinhaFonte.ttf

// 2. Usar no código
import path from 'path';

const fontPath = path.join(__dirname, '../../assets/fonts/MinhaFonte.ttf');
doc.font(fontPath);
doc.text('Texto com fonte customizada');

// 3. Sempre adicionar fallback
try {
  doc.font(fontPath);
} catch {
  doc.font('Helvetica'); // Fallback seguro
}
```

### Encoding UTF-8

PDFKit suporta UTF-8 nativamente, mas depende das fontes:

- ✅ **Fontes padrão (Helvetica, Times, Courier):** Suporte básico a Latin-1 (inclui português)
- ✅ **DejaVu Fonts:** Suporte completo a UTF-8
- ✅ **Liberation Fonts:** Suporte completo a UTF-8
- ⚠️ **Fontes embutidas:** Podem não ter todos os caracteres especiais

**Recomendação:** Sempre instalar DejaVu ou Liberation para garantir suporte completo.

## ⚠️ Troubleshooting

### Problema: "Font not found"

```bash
# Solução 1: Instalar fontes
sudo bash scripts/install-fonts.sh

# Solução 2: Atualizar cache
sudo fc-cache -f -v

# Solução 3: Verificar permissões
sudo chmod -R 755 /usr/share/fonts
```

### Problema: "Caracteres ? ou quadrados no PDF"

```bash
# Causa: Fonte não tem suporte a UTF-8
# Solução: Instalar DejaVu ou Liberation
sudo apt-get install fonts-dejavu fonts-liberation
sudo fc-cache -f -v
```

### Problema: "PDF em branco"

```typescript
// Causa: Erro no código antes de doc.end()
// Solução: Adicionar try-catch

try {
  // ... código de geração do PDF
  doc.end();
} catch (error) {
  console.error('Erro ao gerar PDF:', error);
  // Garantir que o documento fecha mesmo com erro
  if (!doc.isDestroyed) {
    doc.end();
  }
}
```

## 🎯 Checklist de Deploy

Antes de deploy em produção:

- [ ] Script install-fonts.sh executado no servidor
- [ ] Fontes instaladas verificadas (`fc-list`)
- [ ] Cache de fontes atualizado (`fc-cache`)
- [ ] Rota `/debug/pdf-test` testada no servidor
- [ ] PDF de teste gerado sem erros
- [ ] Caracteres especiais visíveis no PDF
- [ ] Receitas médicas geradas sem problemas
- [ ] Logs sem warnings de fonte

## 🔒 Segurança

### Rota de Debug em Produção

A rota `/debug/pdf-test` é **temporária** para testes. Para remover:

```typescript
// Em src/server.ts, comentar ou remover:
// this.app.get('/debug/pdf-test', async (_req, res) => { ... });
```

**Ou** adicionar autenticação:

```typescript
import { tenantMiddleware } from './middleware/tenant.middleware';
import { adminRoleMiddleware } from './middleware/role.middleware';

this.app.get('/debug/pdf-test', tenantMiddleware, adminRoleMiddleware, async (_req, res) => {
  // ... código existente
});
```

## 📊 Monitoramento

### Logs de Fontes

```bash
# Ver logs do PDFKit
pm2 logs techlog-api | grep -i font

# Ver warnings de fontes
pm2 logs techlog-api --err | grep -i font
```

### Métricas

```bash
# Contar PDFs gerados com sucesso
pm2 logs techlog-api | grep -c "PDF generated successfully"

# Contar erros de PDF
pm2 logs techlog-api --err | grep -c "Error generating PDF"
```

## 🎉 Resultado Final

Com essas mudanças:

- ✅ PDFs sempre são gerados (mesmo sem fontes instaladas)
- ✅ Suporte completo a caracteres especiais (ã, ç, é, etc)
- ✅ Encoding UTF-8 funciona perfeitamente
- ✅ Fallback automático para fontes seguras
- ✅ Rota de teste para validação
- ✅ Script de instalação automatizado

---

**Última atualização:** 01/02/2026  
**Versão:** 1.0  
**Autor:** DevOps Team
