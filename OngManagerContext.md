# 📘 Contexto do Projeto: ONGManager

Documento oficial de contexto do projeto **ONGManager**, contemplando a visão geral do sistema, a arquitetura do novo backend em Node.js (`ongManagerNodeApi`), a estrutura do frontend em Next.js (`front`), a modelagem do banco de dados (Prisma/PostgreSQL), as regras de segurança e o catálogo de todos os endpoints RESTful.

---

## 📌 1. Visão Geral da Aplicação

O **ONGManager** é uma plataforma **multi-tenant por ONG**, desenvolvida como Trabalho de Conclusão de Curso (TCC), voltada para centralização e automação da gestão de Organizações Não Governamentais:
- **Gestão de Equipe e Voluntários**: Convites via link público, cadastros e controle de permissões em 3 níveis (`admin`, `finance_manager`, `member`).
- **Quadro Kanban de Tarefas**: Gestão visual de atividades com prioridades, prazos, atribuição de responsáveis e histórico auditável de ações (`TaskHistory`).
- **Saúde e Controle Financeiro**: Lançamentos monetários (receitas e despesas), filtros, resumos de saldos e exportação de relatórios em **CSV** e **PDF**.

---

## 🛠️ 2. Arquitetura Técnica & Stack

### **Backend (`ongManagerNodeApi`)**
- **Linguagem & Runtime:** Node.js + TypeScript
- **Framework HTTP:** Express
- **ORM / Banco de Dados:** Prisma ORM v6 + PostgreSQL
- **Validação de Dados:** Zod schemas
- **Autenticação & Segurança:**
  - JWT transmitido via cookie de sessão `HTTP-Only` seguro (`token`).
  - Criptografia de senhas com `bcryptjs` (salt 10).
  - CORS configurado para troca de credenciais com o frontend.
  - **Rate Limiting (`express-rate-limit`)**: Limitador global (100 req/15min) e limitador estrito de login/recuperação de senha (10 req/15min).
- **Envio de E-mail:** `nodemailer` integrado ao **Ethereal Email** (geração automática de preview visual no console para testes 100% gratuitos) com suporte a provedores SMTP no `.env`.
- **Geração de Arquivos:** `pdfkit` (para exportação de relatórios em PDF) e geração nativa de CSV.
- **Documentação:** Swagger / OpenAPI 3.0 (`http://localhost:3000/api-docs`).
- **Porta de Execução:** `3000` (`http://localhost:3000`).

### **Frontend (`front`)**
- **Framework:** Next.js 15 (App Router)
- **Linguagem & Estilos:** TypeScript + Tailwind CSS v4 + Vanilla CSS + Material UI (Dialogs/Forms) + Sonner (toasts).
- **Cliente HTTP:** Axios com `withCredentials: true` para envio automático do cookie JWT.
- **Armazenamento Local:** Fica salvo apenas o `selectedOngId` no `localStorage` (dados não sensíveis).
- **Porta de Execução:** `5173` (`http://localhost:5173`).

---

## 🗄️ 3. Modelo de Banco de Dados (Prisma Schema)

- **`User`**: Usuários globais do sistema (`id`, `name`, `email`, `password`, `role`).
- **`Ong`**: Organizações cadastradas (`id`, `name`, `description`, `active`). Possui campo `active: boolean` para **Soft Delete**.
- **`UserOng`**: Tabela pivô de relacionamento N:N entre Usuário e ONG, definindo a função específica do membro (`role`: `admin` | `finance_manager` | `member`).
- **`KanbanTask`**: Tarefas vinculadas à ONG (`title`, `description`, `priority`, `status`, `deadline`, `createdById`, `assignedToId`).
- **`TaskHistory`**: Histórico auditável de ações e movimentações nas tarefas.
- **`Financial`**: Lançamentos financeiros (`type`: receita/despesa, `amount`, `category`, `status`, `date`, `createdById`).
- **`OngInviteToken`**: Tokens de convite público por link para entrar na ONG (`id`, `ongId`, `token`, `expiresAt`).
- **`PasswordResetToken`**: Tokens temporários (1h) para redefinição de senha (`id`, `userId`, `token`, `expiresAt`).
- **`Event`**: Eventos promovidos pela ONG (`id`, `title`, `description`, `date`, `location`, `maxTickets`, `status`, `inviteToken`, `ongId`, `createdById`, `hasLandingPage`, `landingTemplate`, `primaryColor`, `bannerUrl`, `ctaText`).
- **`EventGuest`**: Participantes/convidados inscritos no evento (`id`, `eventId`, `name`, `email`, `phone`, `ticketCode`, `status`). Possui restrição de unicidade por evento e e-mail (`@@unique([eventId, email])`).

---

## 🔒 4. Níveis de Permissão (RBAC por ONG) e Decisões de Design

1. **`admin`**: Acesso total. Pode editar dados da ONG, desativar a ONG (Soft Delete), gerenciar membros/cargos, gerar links de convite, gerenciar tarefas, controlar todas as movimentações financeiras e gerenciar eventos com landing pages customizadas.
   - *Trava de Segurança*: Não é permitido remover ou rebaixar a função se for o **único administrador ativo** da ONG.
2. **`finance_manager`**: Acesso completo ao módulo financeiro (criação de lançamentos, consulta de extratos, resumo e exportação em CSV/PDF).
3. **`member` / `colaborador`**: Visualização e movimentação de tarefas no Kanban (`em_andamento`, `aguardando_aprovacao`) e consulta do resumo financeiro.

---

## 📡 5. Catálogo Completo de Endpoints RESTful

### 🔐 **Módulo de Autenticação (`/auth`)**
- `POST /auth/register` — Cadastro de novo usuário e opcionalmente criação de ONG inicial.
- `POST /auth/login` — Autenticação de usuário com geração de cookie `HTTP-Only` (`authLimiter`: 10 req/15min).
- `GET /auth/me` — Retorna perfil do usuário logado.
- `PATCH /auth/me` — Atualiza perfil (nome, e-mail) e altera a senha (valida `oldPassword`).
- `POST /auth/forgot-password` — Solicita link de recuperação de senha por e-mail (`authLimiter`: 10 req/15min).
- `POST /auth/reset-password` — Redefine a senha utilizando o token de recuperação.
- `POST /auth/logout` — Encerra a sessão e limpa o cookie JWT.

### 🏢 **Módulo de ONGs, Membros e Convites (`/ong`)**
- `POST /ong` — Criação de nova ONG.
- `GET /ong/user` — Listagem de todas as ONGs ativas do usuário.
- `GET /ong/:id` — Detalhes da ONG e papel do usuário nela.
- `PUT /ong/:id` — Edição dos dados da ONG (Admin).
- `DELETE /ong/:id` — Desativação da ONG via **Soft Delete** (`active: false` - Admin).
- `GET /ong/:id/members` — Listagem dos membros da ONG.
- `POST /ong/:id/volunteers` — Cadastro direto de novo voluntário (Admin).
- `PATCH /ong/:id/members/:memberId/role` — Alteração do cargo do membro (Admin).
- `DELETE /ong/:id/members/:memberId` — Remoção de membro (Admin com proteção do último admin).
- `POST /ong/:id/invites` — Geração de link de convite único da ONG (Admin).
- `GET /ong/invites/:token` — Detalhes públicos da ONG vinculada ao convite.
- `POST /ong/invites/:token/join` — Aceite do convite e entrada automática do usuário na ONG como voluntário.

### 📋 **Módulo Kanban (`/ong/:ongId/kanban`)**
- `GET /ong/:ongId/kanban/tasks` — Listagem de tarefas com filtros por status/prioridade.
- `POST /ong/:ongId/kanban/tasks` — Criação de tarefa na ONG.
- `GET /ong/:ongId/kanban/tasks/:taskId` — Detalhes da tarefa e seu histórico de ações.
- `PUT /ong/:ongId/kanban/tasks/:taskId` — Edição de dados da tarefa.
- `PATCH /ong/:ongId/kanban/tasks/:taskId/status` — Atualização do status da tarefa.
- `DELETE /ong/:ongId/kanban/tasks/:taskId` — Exclusão da tarefa.

### 💰 **Módulo Financeiro (`/ong/:ongId/financial`)**
- `GET /ong/:ongId/financial/transactions` — Extrato financeiro com paginação e filtros (tipo, categoria, datas).
- `GET /ong/:ongId/financial/summary` — Resumo consolidado de receitas, despesas e saldo.
- `GET /ong/:ongId/financial/export` — Exportação de relatório em **CSV** ou **PDF** (`?format=csv` ou `?format=pdf`).
- `POST /ong/:ongId/financial/transactions` — Lançamento de nova receita ou despesa.
- `PUT /ong/:ongId/financial/transactions/:id` — Edição de lançamento financeiro (Admin).
- `DELETE /ong/:ongId/financial/transactions/:id` — Exclusão de lançamento financeiro (Admin).

### 🎟️ **Módulo de Eventos & Landing Pages (`/ong/:ongId/events` e `/events/public`)**
- `POST /ong/:ongId/events` — Criação de novo evento com cota de ingressos, geração de token de convite e configuração de Landing Page (Admin).
- `GET /ong/:ongId/events` — Listagem dos eventos da ONG com status de ocupação, ingressos restantes, presenças e status da landing page.
- `GET /ong/:ongId/events/:eventId` — Detalhes completos do evento, métricas e configuração visual da landing page.
- `PUT /ong/:ongId/events/:eventId` — Edição de dados, cota e configurações visuais de landing page (Admin).
- `DELETE /ong/:ongId/events/:eventId` — Exclusão do evento (Admin).
- `GET /ong/:ongId/events/:eventId/guests` — Listagem de convidados/inscritos do evento com busca e filtros (Admin).
- `PATCH /ong/:ongId/events/:eventId/guests/:guestId/status` — Check-in de presença ou alteração de status do participante (Admin).
- `DELETE /ong/:ongId/events/:eventId/guests/:guestId` — Cancelamento manual de convidado, liberando vaga de ingresso (Admin).
- `GET /events/public/:token` — Consulta pública dos detalhes do evento e ingressos disponíveis via link de convite.
- `POST /events/public/:token/register` — Inscrição pública de convidado para o evento com emissão de ingresso digital (`ticketCode`).
- `GET /events/public/landing/:eventId` — Retorno público dos dados completos da Landing Page (template, cores, banner, CTA, detalhes da ONG e vagas) para renderização SSR/SPA da página `/eventos/:id`.

---

## 🚦 6. Como Rodar o Projeto

1. **Backend API (`ongManagerNodeApi`)**:
   ```bash
   cd ongManagerNodeApi
   npm run dev
   ```
   *Roda na porta `3000`. Swagger UI interativo acessível em `http://localhost:3000/api-docs`.*

2. **Frontend Next.js (`front`)**:
   ```bash
   cd front
   npm run dev
   ```
   *Roda na porta `5173` em `http://localhost:5173`.*