# 🛠️ ONGManager Node API

API RESTful desenvolvida para a plataforma **ONGManager**, um sistema multi-tenant projetado para automação e centralização da gestão de Organizações Não Governamentais (gestão de equipes/voluntários, tarefas kanban e controle financeiro).

---

## 🚀 Tecnologias Utilizadas

- **Runtime / Linguagem:** [Node.js](https://nodejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Framework HTTP:** [Express](https://expressjs.com/)
- **ORM / Banco de Dados:** [Prisma ORM](https://www.prisma.io/) + [PostgreSQL](https://www.postgresql.org/)
- **Validação de Schemas:** [Zod](https://zod.dev/)
- **Autenticação & Segurança:** [JWT (JsonWebToken)](https://jwt.io/) via Cookie `HTTP-Only`, `bcryptjs` e `CORS`
- **Documentação:** [Swagger / OpenAPI 3.0](https://swagger.io/) (`swagger-ui-express`)

---

## 📐 Arquitetura do Projeto

O projeto adota uma **Arquitetura em Camadas (3-Tier Architecture)** para garantir separação de responsabilidades, facilidade de manutenção e alto valor acadêmico/técnico:

```text
src/
├── config/         # Conexões do banco (Prisma), variáveis de ambiente e Swagger
├── interfaces/     # Schemas Zod e Tipos TypeScript (DTOs)
├── services/       # Regras de negócio, autorização e integração com o Prisma
├── controllers/    # Manipuladores de requisições e respostas HTTP
├── routes/         # Definição de endpoints e anotações OpenAPI
├── middlewares/    # Middleware de autenticação JWT e tratamento global de erros
├── app.ts          # Configuração do Express, CORS, Cookies e Middlewares
└── server.ts       # Inicialização do servidor HTTP
```

---

## ✨ Funcionalidades e Módulos

### 🔒 1. Autenticação & Usuários (`/auth`)
- **`POST /auth/register`**: Cadastro de novos usuários.
- **`POST /auth/login`**: Autenticação com geração de cookie `HTTP-Only` seguro (`token`).
- **`GET /auth/me`**: Consulta dos dados do usuário autenticado.
- **`PATCH /auth/me`**: Atualização dos dados do perfil (nome, e-mail) e alteração de senha do usuário logado.
- **`POST /auth/forgot-password`**: Envio de e-mail de recuperação de senha 100% gratuito (Nodemailer / Ethereal).
- **`POST /auth/reset-password`**: Redefinição de senha com validação de token temporário.
- **`POST /auth/logout`**: Encerramento de sessão e remoção do cookie.

### 🏢 2. Gestão de ONGs e Voluntários (`/ong`)
- **`POST /ong`**: Criação de novas ONGs.
- **`GET /ong/user`**: Listagem de todas as ONGs associadas ao usuário logado.
- **`GET /ong/:id`**: Detalhes da ONG e nível de permissão do usuário.
- **`PUT /ong/:id`**: Edição dos dados da ONG (Nome e Descrição/CNPJ - Admin).
- **`DELETE /ong/:id`**: Exclusão da ONG via **Soft Delete** (`active: false` - Admin).
- **`GET /ong/:ongId/members`**: Listagem de membros e voluntários da ONG.
- **`POST /ong/:ongId/volunteers`**: Cadastro de novos voluntários na ONG.
- **`PATCH /ong/:ongId/members/:memberId/role`**: Alteração de cargo do membro (`admin`, `finance_manager`, `member`).
- **`DELETE /ong/:ongId/members/:memberId`**: Remoção de membro com proteção (impede remover o único admin ativo).

### 🔗 3. Sistema de Convites por Link (`/ong/...`)
- **`POST /ong/:id/invites`**: Geração de link de convite único da ONG (Admin).
- **`GET /ong/invites/:token`**: Consulta de detalhes públicos da ONG pelo token do convite.
- **`POST /ong/invites/:token/join`**: Aceite do convite pelo voluntário logado para entrar na ONG.

### 📋 4. Quadro Kanban & Tarefas (`/ong/:ongId/kanban`)
- **`GET /ong/:ongId/kanban/tasks`**: Listagem de tarefas com filtros por status/prioridade.
- **`POST /ong/:ongId/kanban/tasks`**: Criação de nova tarefa vinculada à ONG.
- **`PATCH /ong/:ongId/kanban/tasks/:taskId/status`**: Atualização do status da tarefa (drag-and-drop no frontend).
- **`GET /ong/:ongId/kanban/tasks/:taskId/history`**: Histórico auditável de movimentações e ações (`TaskHistory`).

### 💰 5. Gestão Financeira (`/ong/:ongId/financial`)
- **`GET /ong/:ongId/financial/transactions`**: Extrato financeiro com paginação e filtros (tipo: receita/despesa, categoria, período).
- **`GET /ong/:ongId/financial/summary`**: Resumo consolidado de saldos, total de receitas e despesas.
- **`GET /ong/:ongId/financial/export`**: Exportação de relatórios financeiros em **CSV** ou **PDF** (`?format=csv|pdf`).
- **`POST /ong/:ongId/financial/transactions`**: Lançamento de novas receitas ou despesas.
- **`PUT /ong/:ongId/financial/transactions/:id`**: Edição de lançamento financeiro existente.
- **`DELETE /ong/:ongId/financial/transactions/:id`**: Exclusão de lançamento financeiro.

---

## 📚 Documentação Swagger UI

A documentação interativa da API (OpenAPI 3.0) é gerada automaticamente e pode ser acessada após iniciar o servidor no navegador:

👉 **`http://localhost:3000/api-docs`**

---

## 🛠️ Configuração e Instalação

### Pré-requisitos
- **Node.js** (v18 ou superior)
- **PostgreSQL** em execução

### 1. Clonar o Repositório e Instalar Dependências
```bash
git clone https://github.com/BrenoLemesD/ongManagerNodeApi.git
cd ongManagerNodeApi
npm install
```

### 2. Configurar Variáveis de Ambiente (`.env`)
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
PORT=3000
DATABASE_URL="postgresql://usuario:senha@localhost:5432/ongmanager?schema=public"
JWT_SECRET="sua_chave_secreta_jwt_aqui"
FRONTEND_URL="http://localhost:5173"
```

### 3. Executar as Migrações do Prisma
```bash
npx prisma generate
npx prisma db push
```

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
O servidor estará rodando em **`http://localhost:3000`**.

---

## 🛡️ Níveis de Permissão (RBAC por ONG)

- **`admin`**: Acesso total (gerenciamento de membros, tarefas e financeiro).
- **`finance_manager`**: Gestão financeira completa (extrato, lançamentos e resumo).
- **`member` / `colaborador`**: Visualização e movimentação básica de tarefas no Kanban e consulta do resumo financeiro.

---

## 📄 Licença

Este projeto é desenvolvido para fins acadêmicos como parte do Trabalho de Conclusão de Curso (TCC).
