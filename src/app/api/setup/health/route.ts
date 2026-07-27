import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import nodemailer from "nodemailer";
import { assertSetupAccess } from "@/lib/setup";
import { prisma } from "@/lib/prisma";
import { generatePix, type PixKeyType } from "@/lib/pix";

interface Check {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
  optional?: boolean;
}

async function canWrite(folder: string): Promise<boolean> {
  try {
    const dir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(dir, { recursive: true });
    const probe = path.join(dir, `.probe-${Date.now()}`);
    await writeFile(probe, "ok");
    await unlink(probe);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    await assertSetupAccess();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const checks: Check[] = [];

  // Banco de dados
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({ key: "db", label: "Banco de dados", ok: true, detail: "Conexão estabelecida." });
  } catch {
    checks.push({ key: "db", label: "Banco de dados", ok: false, detail: "Não foi possível conectar. Verifique DATABASE_URL." });
  }

  // Autenticação (admin existe)
  try {
    const count = await prisma.admin.count();
    checks.push({
      key: "auth",
      label: "Autenticação",
      ok: count > 0,
      detail: count > 0 ? "Administrador cadastrado." : "Nenhum administrador criado ainda.",
    });
  } catch {
    checks.push({ key: "auth", label: "Autenticação", ok: false, detail: "Erro ao verificar administradores." });
  }

  // Permissões de escrita + uploads
  const writeOk = await canWrite("");
  checks.push({ key: "write", label: "Permissões de escrita", ok: writeOk, detail: writeOk ? "Escrita liberada em public/uploads." : "Sem permissão de escrita em public/uploads." });
  const imgOk = await canWrite("gifts");
  checks.push({ key: "upload_img", label: "Upload de imagens", ok: imgOk, detail: imgOk ? "Pasta de imagens pronta." : "Falha ao gravar imagens." });
  const rcpOk = await canWrite("receipts");
  checks.push({ key: "upload_receipt", label: "Upload de comprovantes", ok: rcpOk, detail: rcpOk ? "Pasta de comprovantes pronta." : "Falha ao gravar comprovantes." });

  // Geração de QR Code
  try {
    const qr = await generatePix({
      pixKey: "teste@exemplo.com", pixKeyType: "email",
      merchantName: "TESTE", merchantCity: "BRASILIA", amount: 1,
    });
    checks.push({ key: "qr", label: "Geração de QR Code", ok: qr.qrCodeDataUrl.startsWith("data:image"), detail: "QR Code gerado com sucesso." });
  } catch {
    checks.push({ key: "qr", label: "Geração de QR Code", ok: false, detail: "Falha ao gerar QR Code." });
  }

  // Configuração PIX (usa valores em andamento do assistente)
  const pix = body.pix ?? {};
  if (pix.pixKey) {
    try {
      await generatePix({
        pixKey: String(pix.pixKey),
        pixKeyType: (pix.pixKeyType ?? "email") as PixKeyType,
        merchantName: String(pix.merchantName ?? "TESTE"),
        merchantCity: String(pix.pixCity ?? "BRASILIA"),
        amount: 1,
      });
      checks.push({ key: "pix", label: "Configuração PIX", ok: true, detail: "Chave válida e QR gerado." });
    } catch {
      checks.push({ key: "pix", label: "Configuração PIX", ok: false, detail: "A chave PIX informada é inválida." });
    }
  } else {
    checks.push({ key: "pix", label: "Configuração PIX", ok: false, detail: "Chave PIX não informada." });
  }

  // SMTP (opcional)
  const smtp = body.smtp ?? {};
  if (smtp.smtpHost && smtp.smtpUser && smtp.smtpPass) {
    try {
      const t = nodemailer.createTransport({
        host: String(smtp.smtpHost),
        port: Number(smtp.smtpPort) || 587,
        secure: Number(smtp.smtpPort) === 465,
        auth: { user: String(smtp.smtpUser), pass: String(smtp.smtpPass) },
      });
      await t.verify();
      checks.push({ key: "smtp", label: "SMTP (e-mail)", ok: true, detail: "Servidor de e-mail respondeu corretamente.", optional: true });
    } catch {
      checks.push({ key: "smtp", label: "SMTP (e-mail)", ok: false, detail: "Não foi possível conectar ao servidor SMTP.", optional: true });
    }
  } else {
    checks.push({ key: "smtp", label: "SMTP (e-mail)", ok: false, detail: "Não configurado (opcional).", optional: true });
  }

  const allRequiredOk = checks.filter((c) => !c.optional).every((c) => c.ok);
  return NextResponse.json({ checks, allRequiredOk });
}
