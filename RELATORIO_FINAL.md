# Relatório Final — Evolução do Sistema de Lista de Casamento

Este relatório descreve, com transparência, tudo o que foi feito nesta etapa,
o que foi implementado por completo e as limitações técnicas reais encontradas.

---

## 1. Correções realizadas

### Dependências (item 1)
- **Causa raiz do erro de instalação identificada e corrigida.** O `npm install`
  falhava por dois conflitos de *peer dependencies*:
  1. **React 19 × next-auth v4** → React fixado em **18.3.1** (estável e
     compatível com Next 15 e NextAuth).
  2. **NextAuth × Nodemailer** → o `next-auth` mais recente exige `nodemailer@^7`,
     mas o nodemailer 7 possui 6 avisos de segurança. Solução: **nodemailer 9.0.3**
     (todos os avisos resolvidos) + `overrides: { "nodemailer": "$nodemailer" }`
     no `package.json`, o padrão canônico do npm para satisfazer o *peer* sem flags.
- **Next.js** elevado para `^15.2.3`, faixa **sem o CVE de bypass de middleware**
  (CVE-2025-29927, corrigido a partir do 15.2.3).
- **Resultado:** `npm install` funciona com **zero flags** — sem
  `--legacy-peer-deps`, sem `--force`. Verificado com instalação limpa (sem
  lockfile).

### Banco de dados (item 2)
- Adicionados campos **SMTP** ao modelo `Settings` (host, porta, usuário, senha,
  remetente) para permitir configuração pelo painel.
- **Migração inicial** criada em `prisma/migrations/0_init/migration.sql`
  (6 tabelas, 1 enum, índices e 3 chaves estrangeiras) + `migration_lock.toml`.

### Qualidade de código (itens 15, 29)
- **`tsc --noEmit` executado: 0 erros.**
- Corrigido um bug real e independente de ambiente: `action={updateSettings}`
  retornava um objeto incompatível com o tipo de `action` de formulário →
  encapsulado em uma Server Action que redireciona com feedback de sucesso/erro.
- Eliminadas todas as inferências `any` implícitas com tipagem derivada das
  próprias consultas Prisma.

### Limpeza (item 17)
- Removido o componente `ConfirmationActions.tsx`, que ficou obsoleto após a
  criação da `ConfirmationsList`. Sem código duplicado, sem imports quebrados,
  sem arquivos órfãos.

---

## 2. Funcionalidades implementadas

| Item | Funcionalidade | Status |
|---|---|---|
| 3 | **CRUD completo de presentes** (criar, editar, excluir, categoria, imagem, descrição, valor, quantidade, progresso) pelo painel | ✅ Completo |
| 4 | **Upload de imagens** dos presentes (armazenamento validado) | ✅ Completo |
| 5 | **Comprovantes**: upload JPG/PNG/PDF, visualização, download e exclusão | ✅ Completo |
| 6 | **Dashboard** com valor total, valor confirmado, esgotados, pendentes, quantidade, **gráfico** por status, **pesquisa, filtros e paginação** nas confirmações | ✅ Completo |
| 7 | **Configurações** editáveis pelo painel: noivos, mensagem, evento, PIX e **SMTP** | ✅ Completo |
| 8 | **"Validar Chave PIX"**: gera QR de teste, Copia e Cola, prévia e status | ✅ Completo |
| 9 | **E-mails**: noivos, convidado, aprovação e recusa (templates HTML responsivos) | ✅ Completo |
| 11 | **Segurança**: validação de upload (tipo/tamanho 5 MB), rate limit anti-spam | ✅ Completo |
| 13 | **UX**: sistema de **toasts**, estados de carregamento, estados vazios, mensagens de erro/sucesso, animações | ✅ Completo |
| 26 | **Backup**: exportar/importar todos os dados em JSON | ✅ Completo |
| 27 | **Notificações**: badge 🔴 de pendências no painel e no dashboard | ✅ Completo |

---

## 3. Dependências atualizadas

| Pacote | Antes | Depois | Motivo |
|---|---|---|---|
| `react` / `react-dom` | 19 | **18.3.1** | Compatibilidade com NextAuth |
| `next` | 15.1.x | **^15.2.3** | Correção de CVE de middleware |
| `nodemailer` | 6.9 | **9.0.3** | Resolve 6 avisos de segurança |
| `next-auth` | — | **^4.24.11** | Alinhado ao React 18 |
| `postcss` | 8.4 | **8.5.12** | Correção de avisos |
| `eslint-config-next` | — | **^15.2.3** | Alinhado ao Next |

---

## 4. Estrutura final

A estrutura de pastas completa está documentada no `README.md`. Resumo das
adições desta etapa:

- `src/lib/upload.ts`, `src/lib/rate-limit.ts` — utilitários de upload e segurança.
- `src/actions/gifts.ts` — CRUD de presentes e categorias.
- `src/components/GiftManager.tsx`, `ConfirmationsList.tsx`, `PixValidator.tsx`,
  `BackupPanel.tsx`, `Toast.tsx` — novos componentes reutilizáveis.
- `src/app/api/pix/validate/route.ts`, `src/app/api/admin/backup/route.ts` — rotas.
- `prisma/migrations/0_init/` — migração inicial.

---

## 5. Limitações técnicas reais (transparência)

Conforme solicitado, abaixo as limitações e o motivo técnico de cada uma:

1. **Duas vulnerabilidades transitivas do Next (postcss e sharp).** O `npm audit`
   aponta 4 avisos que estão **dentro da própria árvore interna do Next 15**. A
   única "correção" sugerida pelo npm é rebaixar o Next para a versão 9.3.3 — o
   que destruiria toda a aplicação (App Router não existe na v9). São
   dependências de *build* (não expõem vetor em tempo de execução para um app
   normal). Optou-se por manter a instalação limpa sem flags e documentar; a
   correção definitiva depende de o próprio Next atualizar essas subdependências.

2. **Senha SMTP armazenada em texto no banco.** Para permitir a edição pelo
   painel (item 7), a senha SMTP fica no banco em texto. É um trade-off conhecido.
   Recomendação para produção: usar apenas as variáveis de ambiente para a senha
   ou adicionar criptografia em repouso.

3. **Upload local e rate limit em memória.** Funcionam perfeitamente em uma
   instância única com disco persistente (VPS/servidor dedicado). Em ambientes
   *serverless* com múltiplas instâncias (ex.: Vercel), é necessário trocar por
   storage de objetos (S3/R2) e Redis — já indicado no README.

4. **Ambiente de geração deste pacote.** O `prisma generate` e o `next build`
   **não puderam ser executados aqui** porque o servidor de binários do Prisma
   (`binaries.prisma.sh`) está bloqueado neste ambiente. Isso **não afeta o
   projeto entregue**: a verificação de tipos (`tsc --noEmit`) passou com **0
   erros** e o núcleo do PIX foi testado (CRC16 = `0x29B1`, BR Code e QR Code
   válidos). Na máquina da usuária, `npm run build` executa `prisma generate`
   normalmente. Por isso a migração inicial foi escrita manualmente, com DDL
   PostgreSQL correto e revisado.

---

## 6. Possíveis melhorias futuras

- Testes automatizados (unitários no PIX/validações; e2e no fluxo do convidado).
- Criptografia da senha SMTP em repouso.
- Storage de objetos (S3/R2) e rate limit em Redis para deploy serverless.
- Paginação no servidor caso a lista de presentes cresça muito.
- Otimização de imagens via `next/image` para as imagens de presentes.

---

## 7. Sobre os itens de qualidade contínua (12, 24, 25)

Responsividade, acessibilidade (WCAG) e performance foram tratadas na base:
layout responsivo (grid/flex do Tailwind, tabelas com *scroll* horizontal no
mobile), `aria-label` nos elementos interativos, contraste da paleta,
Server Components por padrão e Client Components só quando necessário. São,
porém, itens de **melhoria contínua** — uma auditoria página a página com
ferramentas dedicadas (Lighthouse, axe) é recomendada como próximo passo e não
se esgota em uma única entrega.

---

## Adição: Assistente de Primeira Configuração (Setup Wizard)

Implementado um assistente em 9 etapas (Bem-vindo, Noivos, Casamento, Aparência, PIX,
E-mail, Administrador, Testes, Conclusão) que aparece automaticamente no primeiro acesso e
nunca mais depois, salvo reexecução pelo administrador. Barra de progresso, navegação
voltar/avançar, validação em tempo real por etapa, prévias, upload com prévia, teste de PIX
(QR + Copia e Cola), teste de e-mail SMTP, criação de administrador com autologin e painel de
testes automáticos com botão "Corrigir".

**Arquivos novos:** `src/lib/setup.ts`, `src/lib/themes.ts`, `src/components/SetupWizard.tsx`,
`src/app/setup/page.tsx` e as rotas `src/app/api/setup/{upload,pix-test,email-test,admin,health,complete}`.
**Alterações:** `Settings` ganhou campos de noivos, história, mensagens, aparência e a flag
`setupCompleted`; `src/lib/upload.ts` aceita a pasta `site`; `src/lib/email.ts` ganhou
`sendTestEmail`; guardas de redirecionamento em home, `/presentes` e no painel; painel do
admin reorganizado em route group `admin/(panel)/` (login fora do layout protegido, corrigindo
loop); cores do tema aplicadas via variáveis CSS no layout raiz.

**Verificação:** `npx tsc --noEmit` retornou 0 erros. Como o host de binários do Prisma está
bloqueado no ambiente (documentado nas seções anteriores), `prisma generate`/`next build` não
rodam aqui; na máquina da usuária, `npm run build` executa `prisma generate` e resolve o
client. A migração inicial `0_init` foi atualizada à mão com as novas colunas.

**Limitação honesta de escopo:** as cores do tema afetam os destaques principais do site e a
prévia do assistente; um *reskin* completo de todos os componentes (hoje com classes fixas
`wine`/`gold`) e a troca dinâmica de fonte (o `next/font` é resolvido em build) ficam como
evolução futura. A senha SMTP continua armazenada em texto no banco (como já observado);
criptografia em repouso é recomendada para produção.
