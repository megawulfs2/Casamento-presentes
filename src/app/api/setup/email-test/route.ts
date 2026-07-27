import { NextRequest, NextResponse } from "next/server";
import { assertSetupAccess } from "@/lib/setup";
import { sendTestEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    await assertSetupAccess();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const res = await sendTestEmail(
    {
      host: String(body.smtpHost ?? ""),
      port: Number(body.smtpPort) || 587,
      user: String(body.smtpUser ?? ""),
      pass: String(body.smtpPass ?? ""),
      from: body.smtpFrom ? String(body.smtpFrom) : undefined,
    },
    String(body.to ?? body.smtpUser ?? "")
  );
  return NextResponse.json(res);
}
