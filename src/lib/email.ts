import nodemailer from "nodemailer";
import { getSettings } from "@/lib/settings";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  notify: string;
}

/**
 * Resolve a configuração SMTP: prioriza o que foi salvo no painel
 * (Settings) e usa as variáveis de ambiente como fallback.
 */
async function resolveSmtp(): Promise<SmtpConfig | null> {
  const s = await getSettings();
  const host = s.smtpHost || process.env.SMTP_HOST || "";
  const user = s.smtpUser || process.env.SMTP_USER || "";
  const pass = s.smtpPass || process.env.SMTP_PASS || "";
  const port = s.smtpPort || Number(process.env.SMTP_PORT ?? 587);
  const from = s.smtpFrom || process.env.SMTP_FROM || user;
  const notify = s.notifyEmail || process.env.NOTIFY_EMAIL || user;

  if (!host || !user || !pass) {
    console.warn("[email] SMTP não configurado — e-mail não enviado.");
    return null;
  }
  return { host, port, user, pass, from, notify };
}

async function send(to: string, subject: string, html: string) {
  const cfg = await resolveSmtp();
  if (!cfg || !to) return { ok: false, error: "SMTP não configurado" };
  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    await transporter.sendMail({ from: cfg.from, to, subject, html });
    return { ok: true as const };
  } catch (err) {
    console.error("[email] falha ao enviar:", err);
    return { ok: false as const, error: "Falha no envio de e-mail" };
  }
}

/** Envelope HTML responsivo compartilhado por todos os e-mails. */
function layout(inner: string) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#EFE7E1;padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#FBF8F4;border-radius:16px;overflow:hidden;font-family:Georgia,'Times New Roman',serif;color:#2B2320;">
    <tr><td style="background:#6E2A3A;padding:20px 32px;color:#FBF8F4;font-size:20px;letter-spacing:.5px;">Maria Mercedez &amp; Henrique</td></tr>
    <tr><td style="padding:28px 32px;font-size:15px;line-height:1.6;">${inner}</td></tr>
    <tr><td style="padding:16px 32px;border-top:1px solid #E7DAD5;color:#8A7F79;font-size:12px;">
      Lista de casamento · este é um e-mail automático.
    </td></tr>
  </table></body></html>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;background:#6E2A3A;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;">${label}</a>`;
}

export interface ConfirmationEmailData {
  guestName: string;
  guestEmail: string;
  guestWhatsapp?: string | null;
  giftName: string;
  amount: string;
  message?: string | null;
  hasReceipt: boolean;
}

/** Noivos: nova confirmação pendente. */
export async function notifyCouple(data: ConfirmationEmailData) {
  const cfg = await resolveSmtp();
  const to = cfg?.notify;
  if (!to) return;
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#6E2A3A;">Novo presente aguardando confirmação</h2>
    <p>Um convidado informou que realizou o PIX. Verifique o app do banco e confirme no painel.</p>
    <table role="presentation" width="100%" style="font-size:14px;border-collapse:collapse;margin-top:8px;">
      <tr><td style="padding:6px 0;color:#8A7F79;width:120px;">Convidado</td><td>${data.guestName}</td></tr>
      <tr><td style="padding:6px 0;color:#8A7F79;">E-mail</td><td>${data.guestEmail}</td></tr>
      <tr><td style="padding:6px 0;color:#8A7F79;">WhatsApp</td><td>${data.guestWhatsapp || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#8A7F79;">Presente</td><td>${data.giftName}</td></tr>
      <tr><td style="padding:6px 0;color:#8A7F79;">Valor</td><td>R$ ${data.amount}</td></tr>
      <tr><td style="padding:6px 0;color:#8A7F79;">Comprovante</td><td>${data.hasReceipt ? "Anexado ✔" : "Não enviado"}</td></tr>
    </table>
    ${data.message ? `<p style="margin-top:12px;font-style:italic;">"${data.message}"</p>` : ""}
    ${button(`${appUrl}/admin/login`, "Acessar painel administrativo")}`);
  await send(to, "Novo presente aguardando confirmação", html);
}

/** Convidado: recebemos sua confirmação. */
export async function thankGuest(data: ConfirmationEmailData) {
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#6E2A3A;">Recebemos sua confirmação ❤️</h2>
    <p>Olá, ${data.guestName}! Obrigado de coração pelo seu carinho.</p>
    <p>Sua confirmação para <strong>${data.giftName}</strong> foi recebida. Vamos conferir o
    recebimento do PIX no aplicativo do banco e, após a verificação, o presente será oficialmente confirmado.</p>
    ${data.hasReceipt ? "<p>Seu comprovante foi recebido com sucesso.</p>" : ""}
    <p style="margin-top:20px;">Com carinho,<br/><strong>Maria Mercedez e Henrique</strong></p>`);
  await send(data.guestEmail, "Recebemos sua confirmação ❤️", html);
}

/** Convidado: pagamento aprovado. */
export async function notifyApproved(
  guestName: string,
  guestEmail: string,
  giftName: string
) {
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#6E2A3A;">Presente confirmado ✔</h2>
    <p>Olá, ${guestName}! Confirmamos o recebimento do seu presente
    <strong>${giftName}</strong>. Muito obrigado pelo carinho — significa muito para nós.</p>
    <p style="margin-top:20px;">Com carinho,<br/><strong>Maria Mercedez e Henrique</strong></p>`);
  await send(guestEmail, "Seu presente foi confirmado ✔", html);
}

/** Convidado: pagamento não localizado (recusa). */
export async function notifyReject(
  guestName: string,
  guestEmail: string,
  giftName: string,
  reason?: string | null
) {
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#6E2A3A;">Sobre sua confirmação de presente</h2>
    <p>Olá, ${guestName}. Ainda não localizamos o pagamento referente a
    <strong>${giftName}</strong>.</p>
    ${reason ? `<p>Observação: ${reason}</p>` : ""}
    <p>Se houve algum problema, por favor entre em contato com os noivos para resolvermos juntos. Obrigado!</p>
    <p style="margin-top:20px;">Com carinho,<br/><strong>Maria Mercedez e Henrique</strong></p>`);
  await send(guestEmail, "Sobre sua confirmação de presente", html);
}

export interface TestSmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from?: string;
}

/** Envia um e-mail de teste usando uma configuração SMTP explícita (assistente). */
export async function sendTestEmail(
  cfg: TestSmtpConfig,
  to: string
): Promise<{ ok: boolean; error?: string }> {
  if (!cfg.host || !cfg.user || !cfg.pass || !to) {
    return { ok: false, error: "Preencha host, usuário, senha e destinatário." };
  }
  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    await transporter.sendMail({
      from: cfg.from || cfg.user,
      to,
      subject: "E-mail de teste — Lista de Casamento",
      html: layout(
        `<h2 style="margin:0 0 8px;font-size:22px;color:#6E2A3A;">Funcionou! ✔</h2>
         <p>Se você recebeu esta mensagem, sua configuração de e-mail está correta
         e o sistema já pode enviar confirmações automaticamente.</p>`
      ),
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] teste falhou:", err);
    return { ok: false, error: "Falha ao enviar. Verifique host, porta e credenciais." };
  }
}
