# 🌐 CHECKLIST DE TESTES NO BROWSER

## ✅ TESTE 1: LOGIN
1. Abrir: `http://localhost:3001/login.html`
2. Inserir:
   - Username: `admin`
   - Password: `admin123`
3. Clicar em "Entrar"
4. **Esperado:** Redirecionamento para admin.html

---

## ✅ TESTE 2: SIDEBAR - BRANDING APLICADO

### 2.1 Logo da Clínica
1. Após login, observar sidebar esquerda
2. **Verificar:**
   - ❓ Logo aparece no topo? (se cadastrado)
   - ❓ Nome "Clínica Viva Saúde" aparece no lugar de "Medical CRM"?
3. **Abrir DevTools Console (F12)**
4. **Procurar logs:**
   ```
   ✅ Using cached clinic settings for branding
   ✅ Sidebar logo updated
   ✅ Primary color applied: #06b6d4
   ```

### 2.2 Cor Primária
1. Observar elementos da interface
2. **Verificar:**
   - ❓ Cor cyan (#06b6d4) aplicada nos botões/highlights?
   - ❓ Hover effects funcionando?

---

## ✅ TESTE 3: KANBAN - CONVÊNIOS DINÂMICOS

### 3.1 Criar/Editar Lead
1. No Kanban, clicar em qualquer lead
2. Modal de edição abre
3. Rolar até "Informações Financeiras"
4. **Verificar select "Convênio":**
   - ❓ Opções carregadas: "Unimed", "Bradesco Saúde", "Particular"
   - ❓ Select populado automaticamente?

### 3.2 Console Logs
1. **Abrir DevTools (F12)**
2. **Procurar:**
   ```
   ✅ Using cached insurance plans
   ✅ Populated editInsuranceName with 3 plans
   ```

---

## ✅ TESTE 4: GESTÃO DE EQUIPE

### 4.1 Listar Usuários
1. Acessar: `http://localhost:3001/settings.html`
2. Aba "Gestão de Equipe" (ativa por padrão)
3. **Verificar:**
   - ❓ Tabela com usuários carregada
   - ❓ Admin aparece na lista
   - ❓ Botão "Novo Usuário" visível

### 4.2 Criar Usuário
1. Clicar em "Novo Usuário"
2. Preencher:
   - Nome: `Dra. Maria Santos`
   - Username: `maria.santos@clinica.com`
   - Senha: `senha123`
   - Role: `staff`
3. Clicar em "Criar"
4. **Verificar:**
   - ❓ Notificação de sucesso
   - ❓ Usuário aparece na tabela
   - ❓ Modal fecha automaticamente

### 4.3 Deletar Usuário
1. Na linha do usuário criado, clicar em 🗑️ (lixeira)
2. Confirmar no modal
3. **Verificar:**
   - ❓ Usuário removido da tabela
   - ❓ Notificação de sucesso

### 4.4 Proteção do Admin
1. Tentar deletar usuário "Administrador"
2. **Esperado:**
   - ❌ Botão de deletar desabilitado OU
   - ❌ Mensagem "Admin não pode ser deletado"

---

## ✅ TESTE 5: PERFIL DA CLÍNICA

### 5.1 Visualizar Configurações
1. Em settings.html, clicar na aba "Perfil da Clínica"
2. **Verificar 4 cards:**
   - ✅ Card 1: Identidade & Dados Operacionais
   - ✅ Card 2: Horários de Atendimento
   - ✅ Card 3: Convênios Aceitos
   - ✅ Card 4: Scripts do Chatbot

### 5.2 Editar Identidade
1. Card 1 - Preencher:
   - Nome: `Clínica Viva Saúde`
   - Telefone: `(11) 98765-4321`
   - Endereço: `Rua das Flores, 123`
   - Cor Primária: Escolher verde (#22c55e)
2. Clicar em "Salvar Configurações" (rodapé)
3. **Verificar:**
   - ❓ Notificação "✅ Configurações salvas!"
   - ❓ Console mostra: `localStorage.removeItem('clinicSettings')`

### 5.3 Adicionar Convênios
1. Card 3 - Input "Adicionar convênio"
2. Digitar: `SulAmérica`
3. Pressionar Enter ou clicar em "+"
4. **Verificar:**
   - ❓ Tag "SulAmérica" aparece
   - ❓ Botão ❌ para remover funciona
5. Adicionar mais: `Amil`, `Golden Cross`
6. Clicar em "Salvar Configurações"

### 5.4 Upload de Logo
1. Card 1 - Clicar em "Escolher Imagem"
2. Selecionar uma imagem PNG/JPG
3. **Verificar:**
   - ❓ Preview da imagem aparece
   - ❓ Botão "Remover Logo" fica visível
4. Clicar em "Salvar Configurações"

---

## ✅ TESTE 6: INTEGRAÇÃO COMPLETA

### 6.1 Fluxo End-to-End
1. **Configurar:**
   - Aba "Perfil da Clínica"
   - Adicionar convênio "SulAmérica"
   - Alterar cor para verde (#22c55e)
   - Salvar

2. **Recarregar Kanban:**
   - Abrir nova aba: `http://localhost:3001/admin.html`
   - **Verificar:**
     - ❓ Sidebar atualizada com nova cor?
     - ❓ Select de convênios mostra "SulAmérica"?

3. **Verificar Cache:**
   - **DevTools → Application → Local Storage**
   - **Procurar chave:** `clinicSettings`
   - **Verificar:** Timestamp recente (< 5 min)

### 6.2 Teste de Cache (5 minutos)
1. Após salvar configurações, esperar 6 minutos
2. Recarregar página
3. **Verificar Console:**
   ```
   ✅ Clinic settings loaded from API
   ```
   (Deve buscar da API, não do cache)

---

## ✅ TESTE 7: VALIDAÇÕES

### 7.1 Username Inválido
1. Tentar criar usuário com username: `admin@`
2. **Esperado:** ✅ Aceito (regex permite @, ., -, _)

### 7.2 Senha Vazia
1. Criar usuário sem preencher senha
2. **Esperado:** ❌ Erro de validação

### 7.3 Role Inválido
1. Tentar criar com role fora da lista
2. **Esperado:** ❌ Erro 400

---

## 🎯 RESUMO DE VERIFICAÇÕES

### Logs Esperados no Console

#### Sidebar:
```
✅ Using cached clinic settings for branding
✅ Sidebar logo updated
✅ Primary color applied: #06b6d4
```

#### Kanban:
```
✅ Using cached insurance plans
✅ Populated editInsuranceName with 3 plans
```

#### Settings:
```
✅ Configurações salvas com sucesso!
Cache cleared: clinicSettings
```

---

## 🐛 TROUBLESHOOTING

### Problema: Logo não aparece
- **Verificar:** DevTools → Network → `/api/clinic/settings`
- **Solução:** Fazer upload de imagem novamente

### Problema: Convênios não carregam
- **Verificar:** Console logs
- **Solução:** Limpar cache: `localStorage.clear()`

### Problema: Cor não aplica
- **Verificar:** DevTools → Elements → Procurar `--primary-color`
- **Solução:** Recarregar com Ctrl+Shift+R (hard refresh)

### Problema: Token inválido
- **Verificar:** SessionStorage tem `MEDICAL_CRM_TOKEN`
- **Solução:** Fazer logout e login novamente

---

## ✅ CHECKLIST FINAL

- [ ] Login funciona
- [ ] Sidebar mostra nome da clínica
- [ ] Sidebar aplica logo (se cadastrado)
- [ ] Sidebar aplica cor primária
- [ ] Kanban popula selects de convênio
- [ ] Criar usuário funciona
- [ ] Deletar usuário funciona
- [ ] Admin protegido contra deleção
- [ ] Salvar perfil da clínica funciona
- [ ] Adicionar/remover convênios funciona
- [ ] Upload de logo funciona
- [ ] Cache de 5 minutos funciona
- [ ] Cache é limpo ao salvar
- [ ] Recarregar atualiza dados

---

**Todos os itens devem estar ✅ para aprovação final!**
