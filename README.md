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
│   └── server.ts          # Servidor principal TypeScript
├── dist/                  # Código compilado (gerado automaticamente)
├── public/
│   ├── index.html         # Landing page
│   ├── admin.html         # Painel administrativo
│   └── widget.js          # Widget de chat
├── tsconfig.json          # Configuração do TypeScript
├── package.json           # Dependências e scripts
└── clinic.db              # Banco de dados (não versionado)
```

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
[
  {
    "id": 1,
    "name": "João Silva",
    "phone": "63999999999",
    "type": "Consulta",
    "status": "novo",
    "created_at": "2026-01-26 20:00:00"
  }
]
```

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

## 📄 Licença

ISC
