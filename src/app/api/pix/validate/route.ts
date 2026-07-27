import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generatePix, type PixKeyType } from "@/lib/pix";
import { pixValidateSchema } from "@/lib/validations";

/** Valida a chave PIX gerando um QR Code e o Copia e Cola de teste. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const parsed = pixValidateSchema.safeParse(body);
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
      { valid: false, error: "Não foi possível gerar o PIX com esses dados" },
      { status: 200 }
    );
  }
}
