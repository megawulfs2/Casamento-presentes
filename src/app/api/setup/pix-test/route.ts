import { NextRequest, NextResponse } from "next/server";
import { assertSetupAccess } from "@/lib/setup";
import { generatePix, type PixKeyType } from "@/lib/pix";
import { pixValidateSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    await assertSetupAccess();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  const parsed = pixValidateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { valid: false, error: parsed.error.issues[0]?.message },
      { status: 200 }
    );
  }
  const d = parsed.data;
  try {
    const pix = await generatePix({
      pixKey: d.pixKey,
      pixKeyType: d.pixKeyType as PixKeyType,
      merchantName: d.merchantName || "TESTE CASAMENTO",
      merchantCity: d.pixCity || "BRASILIA",
      amount: 1,
      txid: "VALIDACAO",
    });
    return NextResponse.json({ valid: true, ...pix });
  } catch {
    return NextResponse.json(
      { valid: false, error: "Não foi possível gerar o PIX com esses dados." },
      { status: 200 }
    );
  }
}
