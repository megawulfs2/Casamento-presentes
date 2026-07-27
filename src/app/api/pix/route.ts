import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { generatePix, type PixKeyType } from "@/lib/pix";

export async function GET(req: NextRequest) {
  const giftId = req.nextUrl.searchParams.get("giftId");
  const amountParam = req.nextUrl.searchParams.get("amount");
  if (!giftId) {
    return NextResponse.json({ error: "giftId obrigatório" }, { status: 400 });
  }

  const [gift, settings] = await Promise.all([
    prisma.gift.findUnique({ where: { id: giftId } }),
    getSettings(),
  ]);

  if (!gift) {
    return NextResponse.json({ error: "Presente não encontrado" }, { status: 404 });
  }
  if (!settings.pixKey) {
    return NextResponse.json(
      { error: "Chave PIX não configurada pelos noivos" },
      { status: 400 }
    );
  }

  const amount = amountParam ? Number(amountParam) : Number(gift.price);

  const pix = await generatePix({
    pixKey: settings.pixKey,
    pixKeyType: settings.pixKeyType as PixKeyType,
    merchantName: settings.coupleNames,
    merchantCity: settings.pixCity || "BRASILIA",
    amount,
    txid: giftId.slice(0, 25),
  });

  return NextResponse.json({ ...pix, amount });
}
