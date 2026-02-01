# TechLog Clinic OS

Sistema de gerenciamento de leads para clínicas desenvolvido em TypeScript.

## 🚀 Tecnologias

- **TypeScript** - Tipagem estática e segurança de código
- **Express** - Framework web para Node.js
- **SQLite3** - Banco de dados leve e embutido
- **CORS** - Controle de acesso entre origens

## 📁 Estrutura do Projeto

```
techlog-api/
├── src/
│   ├── database/
│   │   └── index.ts           # Conexão SQLite e inicialização do BD
│   ├── controllers/
│   │   └── LeadController.ts  # Lógica de negócio dos leads
│   ├── routes/
│   │   └── lead.routes.ts     # Definição das rotas e autenticação
│   └── server.ts              # Ponto de entrada da aplicação
├── dist/                      # Código compilado (gerado automaticamente)
├── public/
│   ├── index.html             # Landing page
│   ├── admin.html             # Painel administrativo
│   └── widget.js              # Widget de chat
├── tsconfig.json              # Configuração do TypeScript
├── package.json               # Dependências e scripts
└── clinic.db                  # Banco de dados (não versionado)
```

## 🏗️ Arquitetura

O projeto segue uma arquitetura modular para melhor manutenção:

- **database/**: Gerenciamento da conexão com SQLite
- **controllers/**: Lógica de negócio e manipulação de dados
- **routes/**: Definição de rotas e middlewares de autenticação
- **server.ts**: Configuração do Express e inicialização do servidor

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Compilar TypeScript → JavaScript
npm run build

# Executar servidor em produção
npm start

# Compilação contínua (watch mode)
npm run watch
```

## 📦 Instalação

```bash
# Instalar dependências
npm install

# (Opcional) Configurar variáveis de ambiente
cp .env.example .env

# Compilar o projeto
npm run build

# Iniciar o servidor
npm start
```

## 🔌 Endpoints da API

### `GET /`

Rota de teste do sistema.

**Resposta:**

```json
{
  "message": "TechLog Clinic OS - Sistema Online 🚀"
}
```

### `POST /api/leads`

Cadastra um novo lead no sistema.

**Body:**

```json
{
  "name": "João Silva",
  "phone": "63999999999",
  "type": "Consulta"
}
```

**Resposta:**

```json
{
  "id": 1,
  "message": "Salvo com sucesso!",
  "whatsapp_link": "https://wa.me/5563999999999"
}
```

### `GET /api/leads`

Lista todos os leads cadastrados.

**Resposta:**

```json
{
  "total": 1,
  "leads": [
    {
      "id": 1,
      "name": "João Silva",
      "phone": "63999999999",
      "type": "Consulta",
      "status": "novo",
      "created_at": "2026-01-26 20:00:00"
    }
  ]
}
```

### `PATCH /api/leads/:id` 🔒

Atualiza o status de um lead (requer autenticação).

**Headers:**

```
x-access-token: techlog-secret-2026
```

**Body:**

```json
{
  "status": "Agendado"
}
```

**Resposta:**

```json
{
  "message": "Status atualizado com sucesso",
  "id": 1,
  "status": "Agendado",
  "changes": 1
}
```

### `DELETE /api/leads/:id` 🔒

Remove um lead do sistema (requer autenticação).

**Headers:**

```
x-access-token: techlog-secret-2026
```

**Resposta:**

```json
{
  "message": "Lead removido com sucesso",
  "id": 1,
  "changes": 1
}
```

## 🔐 Autenticação

Rotas protegidas (PATCH e DELETE) requerem o header `x-access-token`.

Configure a variável de ambiente `ACCESS_TOKEN` ou use o padrão: `techlog-secret-2026`

## 🔒 Segurança

- Arquivos `.db` e `.env` estão no `.gitignore`
- CORS habilitado para acesso controlado
- Validação de dados obrigatórios nas rotas

## 🌐 Deployment

O servidor roda na porta **3001** por padrão.

Para rodar em produção:

```bash
npm run build && npm start
```

### 📋 Deploy Completo

Ver guia detalhado: [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)

**Deploy automático:**

```bash
bash scripts/deploy-prod.sh
```

**Instalar fontes para PDFs (primeira vez):**

```bash
sudo bash scripts/install-fonts.sh
```

Ver: [FONTS_GUIDE.md](FONTS_GUIDE.md) | [FONTS_CHECKLIST.md](FONTS_CHECKLIST.md)

## 📄 Licença

ISC
