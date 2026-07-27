import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Exporta todos os dados do sistema em JSON. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [categories, gifts, confirmations, receipts, settings] =
    await Promise.all([
      prisma.category.findMany(),
      prisma.gift.findMany(),
      prisma.confirmation.findMany(),
      prisma.receipt.findMany(),
      prisma.settings.findUnique({ where: { id: "singleton" } }),
    ]);

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { categories, gifts, confirmations, receipts, settings },
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="backup-casamento-${Date.now()}.json"`,
    },
  });
}

/** Importa um backup JSON (substitui presentes, categorias, confirmações e configurações). */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let payload: {
    data?: {
      categories?: unknown[];
      gifts?: unknown[];
      confirmations?: unknown[];
      receipts?: unknown[];
      settings?: Record<string, unknown> | null;
    };
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const d = payload?.data;
  if (!d) {
    return NextResponse.json(
      { error: "Formato de backup inválido" },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Ordem respeita as chaves estrangeiras
      await tx.receipt.deleteMany();
      await tx.confirmation.deleteMany();
      await tx.gift.deleteMany();
      await tx.category.deleteMany();

      if (Array.isArray(d.categories) && d.categories.length) {
        await tx.category.createMany({ data: d.categories as never, skipDuplicates: true });
      }
      if (Array.isArray(d.gifts) && d.gifts.length) {
        await tx.gift.createMany({ data: d.gifts as never, skipDuplicates: true });
      }
      if (Array.isArray(d.confirmations) && d.confirmations.length) {
        await tx.confirmation.createMany({ data: d.confirmations as never, skipDuplicates: true });
      }
      if (Array.isArray(d.receipts) && d.receipts.length) {
        await tx.receipt.createMany({ data: d.receipts as never, skipDuplicates: true });
      }
      if (d.settings) {
        const { id: _omit, ...rest } = d.settings;
        void _omit;
        await tx.settings.upsert({
          where: { id: "singleton" },
          update: rest as never,
          create: { id: "singleton", ...(rest as object) } as never,
        });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[backup] falha na importação:", err);
    return NextResponse.json(
      { error: "Falha ao importar o backup" },
      { status: 500 }
    );
  }
}
