# 💍 Lista de Casamento com PIX

Sistema completo de lista de presentes de casamento com **pagamento via PIX
independente** (sem intermediários como Mercado Pago ou Stripe). O convidado
escolhe um presente, o sistema gera localmente o QR Code e o Copia e Cola PIX,
o pagamento cai direto na conta dos noivos, e os noivos confirmam o recebimento
pelo painel administrativo.

Desenvolvido com **Next.js 15 (App Router)**, **TypeScript**, **Prisma**,
**PostgreSQL**, **NextAuth** e **Tailwind CSS**.

---

## Índice

1. [Arquitetura](#arquitetura)
2. [Estrutura de pastas](#estrutura-de-pastas)
3. [Fluxo da aplicação](#fluxo-da-aplicação)
4. [Instalação](#instalação)
5. [Banco de dados (PostgreSQL + Prisma)](#banco-de-dados)
6. [Autenticação](#autenticação)
7. [Sistema de PIX](#sistema-de-pix)
8. [Envio de e-mails](#envio-de-e-mails)
9. [Backup e recuperação](#backup-e-recuperação)
10. [Deploy](#deploy)
11. [Variáveis de ambiente](#variáveis-de-ambiente)

---

## Arquitetura

Aplicação **full-stack Next.js** usando o App Router. A lógica de escrita fica
em **Server Actions** (`src/actions`), a de leitura em **Server Components**, e
a interatividade em **Client Components** (`"use client"`). Não há API REST
separada além de rotas utilitárias específicas (PIX, backup, auth).

- **Server Components** buscam dados direto do banco via Prisma e renderizam no
  servidor (ótimo desempenho e SEO).
- **Server Actions** executam mutações com validação (Zod) e revalidação de
  cache (`revalidatePath`).
- **Client Components** cuidam de formulários, modais, toasts e chamadas às
  ações. Toda a comunicação servidor↔cliente é tipada.

Princípios: responsabilidades separadas, tipagem forte (sem `any` implícito),
reutilização de componentes/utilitários e nenhuma configuração importante presa
ao código — tudo que os noivos precisam ajustar está no painel.

## Estrutura de pastas

```
casamento-presentes/
├── prisma/
│   ├── schema.prisma          # Modelos do banco (fonte da verdade)
│   ├── migrations/            # Migrações versionadas (0_init)
│   └── seed.ts                # Popular admin, categorias e exemplos
├── public/
│   └── uploads/               # Imagens de presentes e comprovantes (gitignore)
├── src/
│   ├── actions/               # Server Actions (mutações)
│   │   ├── confirmations.ts   # Criar/confirmar/recusar confirmações
│   │   ├── gifts.ts           # CRUD de presentes e categorias
│   │   └── settings.ts        # Atualizar configurações
│   ├── app/
│   │   ├── page.tsx           # Landing pública
│   │   ├── presentes/         # Lista de presentes (convidado)
│   │   ├── admin/             # Painel (dashboard, presentes, confirmações, configurações)
│   │   └── api/
│   │       ├── auth/          # NextAuth
│   │       ├── pix/           # Geração de PIX + validação de chave
│   │       └── admin/backup/  # Exportar/importar backup JSON
│   ├── components/            # Componentes reutilizáveis (cliente e servidor)
│   ├── lib/
│   │   ├── pix/               # Geração de BR Code, CRC16 e QR Code (100% local)
│   │   ├── auth.ts            # Configuração do NextAuth
│   │   ├── email.ts           # Templates + envio (SMTP do painel ou .env)
│   │   ├── upload.ts          # Upload validado (tipo/tamanho) e remoção
│   │   ├── rate-limit.ts      # Limitador de requisições em memória
│   │   ├── prisma.ts          # Cliente Prisma (singleton)
│   │   ├── settings.ts        # Acesso às configurações (singleton)
│   │   └── validations.ts     # Schemas Zod
│   └── middleware.ts          # Proteção de rotas /admin
└── package.json
```

## Fluxo da aplicação

**Convidado**
1. Acessa o site e abre a lista de presentes.
2. Escolhe um presente → o sistema gera o QR Code e o PIX Copia e Cola.
3. Paga pelo app do banco e (opcionalmente) anexa o comprovante.
4. Envia a confirmação → recebe um e-mail de agradecimento.

**Noivos (painel)**
1. Recebem e-mail de nova confirmação pendente (badge 🔴 no painel).
2. Conferem o recebimento no app do banco.
3. Confirmam (o presente é marcado como recebido e o convidado é avisado) ou
   recusam (com motivo).

## Instalação

Pré-requisitos: **Node.js 18.18+** e **PostgreSQL**.

```bash
# 1. Instalar dependências (sem flags adicionais)
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite o .env com DATABASE_URL, NEXTAUTH_SECRET, etc.

# 3. Criar as tabelas no banco e gerar o cliente Prisma
npx prisma migrate deploy
npx prisma generate

# 4. Popular dados iniciais (admin + exemplos)
npm run prisma:seed

# 5. Rodar em desenvolvimento
npm run dev
```

Acesse `http://localhost:3000` (site) e `http://localhost:3000/admin` (painel).

> O `npm run build` executa `prisma generate` automaticamente antes de compilar.

## Banco de dados

O schema (`prisma/schema.prisma`) define seis modelos: `Admin`, `Category`,
`Gift`, `Confirmation` (com enum `ConfirmationStatus`), `Receipt` e `Settings`
(singleton com dados do casal, evento, PIX e SMTP).

```bash
npx prisma migrate deploy   # aplica migrações em produção
npx prisma migrate dev      # cria nova migração em desenvolvimento
npx prisma studio           # interface visual do banco
npm run prisma:seed         # popula dados iniciais
```

A migração inicial (`prisma/migrations/0_init/migration.sql`) cria todas as
tabelas, índices e chaves estrangeiras.

## Autenticação

Usa **NextAuth (Credentials Provider)** com sessão JWT. As senhas são
armazenadas com hash **bcrypt**. O `src/middleware.ts` protege todas as rotas
`/admin` (exceto `/admin/login`), redirecionando visitantes não autenticados.

O usuário administrador inicial é criado pelo seed a partir de `ADMIN_EMAIL` e
`ADMIN_PASSWORD` no `.env`.

## Sistema de PIX

Toda a geração de PIX é **local**, seguindo o padrão **BR Code / EMVCo** do
Banco Central:

- `src/lib/pix/payload.ts` monta o payload EMV.
- `src/lib/pix/crc16.ts` calcula o **CRC16-CCITT** (validado contra a
  referência oficial `0x29B1`).
- `src/lib/pix/index.ts` expõe `generatePix()`, que devolve o **Copia e Cola** e
  o **QR Code** (PNG em data URL).

No painel (Configurações) existe a função **"Validar Chave PIX"**, que gera um QR
de teste e o Copia e Cola, exibe a prévia e informa se a configuração é válida.

## Envio de e-mails

`src/lib/email.ts` envia quatro e-mails (todos com template HTML responsivo):

- **Noivos:** nova confirmação pendente.
- **Convidado:** recebemos sua confirmação.
- **Convidado:** presente confirmado (após aprovação).
- **Convidado:** pagamento não localizado (recusa).

A configuração SMTP pode ser feita **pelo painel** (Configurações → E-mail) ou
pelas variáveis de ambiente. Os valores do painel têm prioridade; o `.env` é
usado como fallback. Se o SMTP não estiver configurado, o sistema registra um
aviso no servidor e segue funcionando (sem quebrar a experiência).

## Backup e recuperação

No painel (Configurações → Backup) é possível:

- **Exportar** todos os dados (presentes, categorias, confirmações e
  configurações) em um arquivo **JSON**.
- **Importar** um backup JSON, substituindo os dados atuais (dentro de uma
  transação, respeitando as chaves estrangeiras).

As rotas correspondentes (`/api/admin/backup`) são protegidas por sessão.

> Observação: o backup exporta os **registros** do banco. Os arquivos físicos de
> imagens/comprovantes ficam em `public/uploads` e devem ser copiados à parte em
> uma rotina de backup do servidor.

## Deploy

O sistema roda em qualquer host Node.js com PostgreSQL (VPS, Railway, Render,
Fly.io etc.).

```bash
npm install
npm run build        # roda prisma generate + next build
npx prisma migrate deploy
npm run start
```

Defina as variáveis de ambiente de produção (`DATABASE_URL`, `NEXTAUTH_SECRET`,
`NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`).

> **Uploads e rate limit em serverless:** o armazenamento de arquivos em
> `public/uploads` e o rate limit em memória assumem uma única instância com
> disco persistente. Em plataformas serverless (Vercel), troque o upload por um
> storage de objetos (S3/R2) e o rate limit por Redis/Upstash.

## Variáveis de ambiente

Veja `.env.example`. Resumo:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Conexão PostgreSQL |
| `NEXTAUTH_SECRET` | Segredo da sessão (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL base para o NextAuth |
| `NEXT_PUBLIC_APP_URL` | URL pública (links dos e-mails) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Admin inicial (seed) |
| `SMTP_*` / `NOTIFY_EMAIL` | E-mail (opcional; o painel tem prioridade) |

---

## Assistente de Primeira Configuração (Setup Wizard)

Na primeira vez que o sistema é acessado (banco recém-migrado, sem `setupCompleted`),
qualquer rota pública ou administrativa redireciona automaticamente para `/setup`,
um assistente em 9 etapas no estilo do instalador do WordPress:

1. **Bem-vindo** — apresentação.
2. **Noivos** — nomes, foto do casal (upload com prévia), mensagem de boas-vindas e história (opcional).
3. **Casamento** — data/hora, local, endereço, Google Maps, mensagem aos convidados, com prévia da home.
4. **Aparência** — tema, cor principal/secundária, fonte, estilo de botões e banner, com **prévia em tempo real**.
5. **PIX** — tipo de chave, chave, recebedor e cidade; botão **"Testar configuração"** que gera QR Code e Copia e Cola de teste.
6. **E-mail** — SMTP com **"Enviar e-mail de teste"**; só avança com teste bem-sucedido ou marcando "configurar depois".
7. **Administrador** — cria a conta (senha mínima de 8 caracteres) e **autentica automaticamente**.
8. **Testes automáticos** — verifica banco, autenticação, PIX, SMTP, uploads, QR Code e permissões de escrita, com botão **"Corrigir"** que leva à etapa correspondente.
9. **Conclusão** — resumo e botões para o painel e para o site.

Toda a configuração é salva **no banco de dados** (tabela `Settings` + `Admin`). Nenhuma
configuração depende de edição manual de arquivos, exceto a `DATABASE_URL` (conexão com o banco).

**Reexecução:** o painel oferece *Configurações → "Executar assistente novamente"*, que
reabre `/setup` já com todos os dados carregados. Após concluído, o assistente só pode ser
reaberto por um administrador autenticado; visitantes são redirecionados para a home.

### Detalhes de arquitetura
- As páginas protegidas do painel foram movidas para o *route group* `admin/(panel)/`,
  de modo que `admin/login` fique **fora** do layout autenticado (corrige loop de redirecionamento).
  As URLs permanecem inalteradas (`/admin`, `/admin/presentes`, etc.).
- Novos temas são adicionados apenas incluindo itens em `src/lib/themes.ts`.
- As cores escolhidas são aplicadas ao site via variáveis CSS (`--color-primary`/`--color-secondary`)
  injetadas no `layout` raiz a partir das configurações, além da prévia do assistente.
  **Escopo honesto:** as cores afetam os destaques principais (ex.: CTA da home) e a prévia;
  um *reskin* completo de todos os componentes é um passo futuro. A fonte escolhida é
  armazenada, mas o site publicado usa as fontes já empacotadas via `next/font` — adicionar
  novas fontes exige registrá-las em `next/font` (limitação de build).
- As rotas do assistente (`/api/setup/*`) são liberadas apenas enquanto a configuração não
  foi concluída ou para um administrador autenticado (`assertSetupAccess`).
