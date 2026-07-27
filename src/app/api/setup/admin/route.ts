import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { assertSetupAccess } from "@/lib/setup";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    await assertSetupAccess();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!name || !email.includes("@")) {
    return NextResponse.json({ error: "Nome e e-mail válidos são obrigatórios." }, { status: 200 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "A senha deve ter ao menos 8 caracteres." }, { status: 200 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.admin.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { name, email, passwordHash },
  });
  return NextResponse.json({ ok: true });
}
