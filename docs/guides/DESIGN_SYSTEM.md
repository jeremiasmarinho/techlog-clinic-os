# 🎨 TechLog Clinic - Design System

Sistema de design centralizado para padronizar todos os componentes da aplicação.

## Como Usar

Adicione no `<head>` de qualquer página HTML:

```html
<link rel="stylesheet" href="/css/design-system.css" />
```

---

## 📐 Variáveis CSS

Use `var(--nome)` para acessar as variáveis em qualquer CSS customizado.

### Cores de Fundo

```css
var(--bg-primary)    /* Fundo principal da página */
var(--bg-secondary)  /* Fundo de cards/seções */
var(--bg-tertiary)   /* Fundo de elementos destacados */
var(--bg-card)       /* Cards com transparência */
var(--bg-hover)      /* Estado hover */
var(--bg-input)      /* Campos de input */
```

### Cores de Texto

```css
var(--text-primary)     /* Texto principal */
var(--text-secondary)   /* Texto secundário */
var(--text-muted)       /* Texto sutil/dicas */
var(--text-placeholder) /* Placeholder de inputs */
```

### Cores de Status

```css
var(--primary)  /* Cyan - cor principal */
var(--success)  /* Verde */
var(--warning)  /* Amarelo/Laranja */
var(--danger)   /* Vermelho */
var(--info)     /* Azul */
var(--orange)   /* Laranja */
var(--purple)   /* Roxo */
var(--teal)     /* Verde-azulado */
var(--pink)     /* Rosa */
```

Cada cor tem variantes:

```css
var(--primary)       /* Cor base */
var(--primary-hover) /* Hover */
var(--primary-light) /* Background suave */
var(--primary-glow)  /* Para sombras */
```

### Bordas

```css
var(--border-default) /* Borda padrão */
var(--border-subtle)  /* Borda sutil */
var(--border-strong)  /* Borda forte */
var(--border-focus)   /* Borda ao focar */
```

### Espaçamentos

```css
var(--spacing-xs)  /* 4px */
var(--spacing-sm)  /* 8px */
var(--spacing-md)  /* 16px */
var(--spacing-lg)  /* 24px */
var(--spacing-xl)  /* 32px */
var(--spacing-2xl) /* 48px */
```

### Border Radius

```css
var(--radius-sm)   /* 4px */
var(--radius-md)   /* 8px */
var(--radius-lg)   /* 12px */
var(--radius-xl)   /* 16px */
var(--radius-full) /* Circular */
```

---

## 🔘 Botões

### Base

```html
<button class="btn">Botão Padrão</button>
```

### Variantes de Cor

```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-danger">Danger</button>
<button class="btn btn-warning">Warning</button>
<button class="btn btn-info">Info</button>
<button class="btn btn-orange">Orange</button>
<button class="btn btn-purple">Purple</button>
<button class="btn btn-teal">Teal</button>
<button class="btn btn-pink">Pink</button>
```

### Botões Outline

```html
<button class="btn btn-outline">Outline</button>
<button class="btn btn-outline-primary">Outline Primary</button>
<button class="btn btn-outline-success">Outline Success</button>
<button class="btn btn-outline-danger">Outline Danger</button>
```

### Botões Ghost (Transparentes)

```html
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-ghost-primary">Ghost Primary</button>
<button class="btn btn-ghost-danger">Ghost Danger</button>
```

### Tamanhos

```html
<button class="btn btn-primary btn-xs">Extra Small</button>
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Default</button>
<button class="btn btn-primary btn-lg">Large</button>
<button class="btn btn-primary btn-xl">Extra Large</button>
```

### Com Ícone

```html
<button class="btn btn-primary">
  <i class="fas fa-plus"></i>
  Adicionar
</button>

<!-- Apenas ícone -->
<button class="btn btn-icon btn-primary">
  <i class="fas fa-plus"></i>
</button>
```

### Gradiente

```html
<button class="btn btn-gradient-primary">Gradient</button>
```

### Grupo de Botões

```html
<div class="btn-group">
  <button class="btn btn-primary">Esquerda</button>
  <button class="btn btn-primary">Meio</button>
  <button class="btn btn-primary">Direita</button>
</div>
```

### Full Width

```html
<button class="btn btn-primary btn-block">Full Width</button>
```

---

## 🃏 Cards

### Card Básico

```html
<div class="card">
  <h3>Título</h3>
  <p>Conteúdo do card</p>
</div>
```

### Com Header e Footer

```html
<div class="card">
  <div class="card-header">
    <h4>Título do Card</h4>
  </div>
  Conteúdo aqui
  <div class="card-footer">
    <button class="btn btn-primary">Ação</button>
  </div>
</div>
```

### Card Glass (Glassmorphism)

```html
<div class="card-glass">Conteúdo com efeito glass</div>
```

### Card com Borda Colorida

```html
<div class="card card-primary">Primary</div>
<div class="card card-success">Success</div>
<div class="card card-warning">Warning</div>
<div class="card card-danger">Danger</div>
```

### Stat Card (para Dashboards)

```html
<div class="stat-card">
  <div class="stat-icon bg-success-light">
    <i class="fas fa-users text-success"></i>
  </div>
  <div class="stat-value">1,234</div>
  <div class="stat-label">Total de Pacientes</div>
</div>
```

---

## 📝 Inputs

### Input Básico

```html
<input type="text" class="input" placeholder="Digite aqui..." />
```

### Tamanhos

```html
<input class="input input-sm" placeholder="Small" />
<input class="input" placeholder="Default" />
<input class="input input-lg" placeholder="Large" />
```

### Estados

```html
<input class="input input-error" placeholder="Com erro" />
<input class="input input-success" placeholder="Sucesso" />
<input class="input" disabled placeholder="Desabilitado" />
```

### Select

```html
<select class="input select">
  <option>Opção 1</option>
  <option>Opção 2</option>
</select>
```

### Textarea

```html
<textarea class="input textarea" placeholder="Texto longo..."></textarea>
```

### Com Ícone

```html
<div class="input-group">
  <i class="fas fa-search input-icon"></i>
  <input type="text" class="input" placeholder="Buscar..." />
</div>
```

### Form Group (Label + Input + Hint)

```html
<div class="form-group">
  <label class="form-label">Nome</label>
  <input type="text" class="input" placeholder="Digite seu nome" />
  <span class="form-hint">Seu nome completo</span>
</div>

<!-- Com erro -->
<div class="form-group">
  <label class="form-label">Email</label>
  <input type="email" class="input input-error" />
  <span class="form-error">Email inválido</span>
</div>
```

### Checkbox e Radio

```html
<input type="checkbox" class="checkbox" /> <input type="radio" class="radio" name="grupo" />
```

---

## 🏷️ Badges

### Cores

```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Sucesso</span>
<span class="badge badge-warning">Atenção</span>
<span class="badge badge-danger">Erro</span>
<span class="badge badge-info">Info</span>
<span class="badge badge-orange">Orange</span>
<span class="badge badge-purple">Purple</span>
<span class="badge badge-teal">Teal</span>
```

### Badges Sólidos

```html
<span class="badge badge-solid-primary">Sólido</span>
<span class="badge badge-solid-success">Sólido</span>
```

### Com Dot

```html
<span class="badge badge-success badge-dot">Online</span>
```

---

## 📊 Tabelas

```html
<table class="table">
  <thead>
    <tr>
      <th>Nome</th>
      <th>Email</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>João Silva</td>
      <td>joao@email.com</td>
      <td><span class="badge badge-success">Ativo</span></td>
    </tr>
  </tbody>
</table>
```

### Variantes

```html
<table class="table table-striped">
  ...
</table>
<!-- Linhas alternadas -->
<table class="table table-compact">
  ...
</table>
<!-- Compacta -->
<table class="table table-bordered">
  ...
</table>
<!-- Com bordas -->
```

---

## 🗃️ Modais

```html
<div class="modal-overlay active">
  <div class="modal">
    <div class="modal-header">
      <h3>Título do Modal</h3>
      <button class="btn btn-icon btn-ghost">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body">Conteúdo do modal</div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancelar</button>
      <button class="btn btn-primary">Confirmar</button>
    </div>
  </div>
</div>
```

### Tamanhos

```html
<div class="modal modal-sm">...</div>
<!-- 24rem -->
<div class="modal">...</div>
<!-- 32rem (default) -->
<div class="modal modal-lg">...</div>
<!-- 48rem -->
<div class="modal modal-xl">...</div>
<!-- 64rem -->
```

---

## 🧩 Outros Componentes

### Avatar

```html
<div class="avatar">JS</div>
<div class="avatar avatar-sm">J</div>
<div class="avatar avatar-lg">JS</div>
```

### Progress Bar

```html
<div class="progress">
  <div class="progress-bar" style="width: 60%"></div>
</div>

<div class="progress">
  <div class="progress-bar progress-bar-success" style="width: 80%"></div>
</div>
```

### Spinner (Loading)

```html
<div class="spinner"></div>
<div class="spinner spinner-sm"></div>
<div class="spinner spinner-lg"></div>
```

### Toast

```html
<div class="toast toast-success">
  <i class="fas fa-check"></i>
  Sucesso!
</div>
```

### Empty State

```html
<div class="empty-state">
  <i class="fas fa-inbox empty-state-icon"></i>
  <div class="empty-state-title">Nenhum item encontrado</div>
  <div class="empty-state-description">Adicione itens para começar</div>
</div>
```

### Tabs

```html
<div class="tabs">
  <div class="tab active">Tab 1</div>
  <div class="tab">Tab 2</div>
  <div class="tab">Tab 3</div>
</div>
```

### Pills

```html
<div class="pills">
  <div class="pill active">Opção 1</div>
  <div class="pill">Opção 2</div>
  <div class="pill">Opção 3</div>
</div>
```

### Dropdown

```html
<div class="dropdown active">
  <button class="btn btn-primary">Menu</button>
  <div class="dropdown-menu">
    <div class="dropdown-item">
      <i class="fas fa-edit"></i>
      Editar
    </div>
    <div class="dropdown-divider"></div>
    <div class="dropdown-item">
      <i class="fas fa-trash"></i>
      Excluir
    </div>
  </div>
</div>
```

### Tooltip

```html
<button class="btn tooltip" data-tooltip="Texto do tooltip">Passe o mouse</button>
```

---

## 🎯 Classes Utilitárias

### Texto

```html
<p class="text-primary">Texto principal</p>
<p class="text-muted">Texto sutil</p>
<p class="text-success">Sucesso</p>
<p class="text-danger">Erro</p>
```

### Fundos

```html
<div class="bg-primary">...</div>
<div class="bg-success-light">...</div>
```

### Sombras

```html
<div class="shadow-sm">...</div>
<div class="shadow-md">...</div>
<div class="shadow-lg">...</div>
<div class="shadow-glow">...</div>
```

### Espaçamento

```html
<div class="p-md">Padding médio</div>
<div class="m-lg">Margin grande</div>
<div class="gap-sm">Gap pequeno (flex/grid)</div>
```

### Hover Effects

```html
<div class="hover-lift">Sobe no hover</div>
<div class="hover-glow">Brilha no hover</div>
<div class="hover-scale">Escala no hover</div>
```

### Animações

```html
<div class="animate-fadeIn">...</div>
<div class="animate-slideUp">...</div>
<div class="animate-pulse">...</div>
<div class="animate-spin">...</div>
```

---

## 🌙 Suporte a Temas

O Design System suporta automaticamente **Dark** e **Light** mode.

Todas as variáveis mudam automaticamente baseado no atributo `data-theme`:

```html
<html data-theme="dark">
  <!-- Modo escuro (padrão) -->
  <html data-theme="light">
    <!-- Modo claro -->
  </html>
</html>
```

Para alternar via JavaScript:

```javascript
document.documentElement.setAttribute('data-theme', 'light');
```

---

## ✅ Migração

Para migrar código existente:

1. **Botões**: Substitua classes Tailwind por `.btn .btn-*`
2. **Cards**: Use `.card` ou `.card-glass`
3. **Inputs**: Use `.input` com modificadores
4. **Cores**: Use `var(--nome)` em vez de valores hardcoded
5. **Espaçamentos**: Use `var(--spacing-*)`

### Exemplo de migração:

**Antes:**

```html
<button class="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition-colors">
  Salvar
</button>
```

**Depois:**

```html
<button class="btn btn-primary">Salvar</button>
```
