import { prisma } from "@/lib/prisma";
import ConfirmationsList, {
  type ConfirmationRow,
} from "@/components/ConfirmationsList";

export const dynamic = "force-dynamic";

export default async function ConfirmacoesPage() {
  const confirmations = await prisma.confirmation.findMany({
    include: { gift: { include: { category: true } }, receipt: true },
    orderBy: { createdAt: "desc" },
  });

  const items: ConfirmationRow[] = confirmations.map(
    (c: (typeof confirmations)[number]) => ({
    id: c.id,
    giftName: c.gift.name,
    categoryName: c.gift.category?.name ?? null,
    amount: Number(c.amount),
    guestName: c.guestName,
    guestEmail: c.guestEmail,
    guestWhatsapp: c.guestWhatsapp,
    message: c.message,
    createdAt: c.createdAt.toLocaleString("pt-BR"),
    status: c.status,
    rejectReason: c.rejectReason,
    receiptUrl: c.receipt?.fileUrl ?? null,
    receiptName: c.receipt?.fileName ?? null,
    receiptMime: c.receipt?.mimeType ?? null,
  }));

  return (
    <div>
      <h1 className="font-display text-4xl text-wine">Confirmações</h1>
      <p className="mt-2 text-sm text-stone">
        Verifique o recebimento no app do banco e confirme cada presente.
      </p>
      <div className="mt-8">
        <ConfirmationsList items={items} />
      </div>
    </div>
  );
}
