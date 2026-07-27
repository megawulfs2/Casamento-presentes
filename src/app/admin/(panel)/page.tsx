import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function DashboardPage() {
  const [gifts, confirmations] = await Promise.all([
    prisma.gift.findMany(),
    prisma.confirmation.findMany({
      include: { gift: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalGifts = gifts.length;
  type GiftRow = (typeof gifts)[number];
  type ConfRow = (typeof confirmations)[number];
  const confirmed = confirmations.filter((c: ConfRow) => c.status === "CONFIRMADO");
  const pending = confirmations.filter((c: ConfRow) => c.status === "AGUARDANDO");
  const rejected = confirmations.filter((c: ConfRow) => c.status === "RECUSADO");
  const soldOut = gifts.filter((g: GiftRow) => g.giftedQty >= g.desiredQty).length;
  const totalValue = gifts.reduce((s: number, g: GiftRow) => s + Number(g.price) * g.desiredQty, 0);
  const confirmedValue = confirmed.reduce((s: number, c: ConfRow) => s + Number(c.amount), 0);
  const totalDesired = gifts.reduce((s: number, g: GiftRow) => s + g.desiredQty, 0);
  const totalGifted = gifts.reduce((s: number, g: GiftRow) => s + g.giftedQty, 0);
  const remaining = totalDesired - totalGifted;
  const progress = totalDesired > 0 ? (totalGifted / totalDesired) * 100 : 0;

  const cards = [
    { label: "Presentes na lista", value: totalGifts },
    { label: "Presentes confirmados", value: totalGifted },
    { label: "Presentes esgotados", value: soldOut },
    { label: "Unidades restantes", value: remaining },
    { label: "Valor total da lista", value: brl(totalValue) },
    { label: "Valor já confirmado", value: brl(confirmedValue) },
  ];

  const chart = [
    { label: "Aguardando", value: pending.length, color: "bg-amber-400" },
    { label: "Confirmado", value: confirmed.length, color: "bg-green-500" },
    { label: "Recusado", value: rejected.length, color: "bg-red-400" },
  ];
  const chartMax = Math.max(1, ...chart.map((c) => c.value));

  return (
    <div>
      <h1 className="font-display text-4xl text-wine">Dashboard</h1>

      {pending.length > 0 && (
        <Link
          href="/admin/confirmacoes"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-wine/10 px-4 py-2 text-sm text-wine hover:bg-wine/20"
        >
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
          {pending.length} confirmaç{pending.length === 1 ? "ão" : "ões"} pendente
          {pending.length === 1 ? "" : "s"} — revisar
        </Link>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-white p-5 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-stone">{c.label}</p>
            <p className="mt-2 font-display text-3xl text-wine">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-soft">
          <div className="mb-2 flex justify-between text-sm text-stone">
            <span>Progresso da lista</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-blush">
            <div
              className="h-full rounded-full bg-gold"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-soft">
          <p className="mb-4 text-sm text-stone">Confirmações por status</p>
          <div className="space-y-3">
            {chart.map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <span className="w-24 text-xs text-stone">{c.label}</span>
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-blush">
                  <div
                    className={`h-full rounded-full ${c.color}`}
                    style={{ width: `${(c.value / chartMax) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-ink">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="mt-10 font-display text-2xl text-wine">
        Últimas confirmações
      </h2>
      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-soft">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-blush/40 text-stone">
            <tr>
              <th className="px-4 py-3">Convidado</th>
              <th className="px-4 py-3">Presente</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {confirmations.slice(0, 8).map((c: ConfRow) => (
              <tr key={c.id} className="border-t border-blush/60">
                <td className="px-4 py-3">{c.guestName}</td>
                <td className="px-4 py-3">{c.gift.name}</td>
                <td className="px-4 py-3">{brl(Number(c.amount))}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
            {confirmations.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-stone">
                  Nenhuma confirmação ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    AGUARDANDO: "bg-amber-100 text-amber-800",
    CONFIRMADO: "bg-green-100 text-green-800",
    RECUSADO: "bg-red-100 text-red-800",
  };
  const label: Record<string, string> = {
    AGUARDANDO: "Aguardando",
    CONFIRMADO: "Confirmado",
    RECUSADO: "Recusado",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs ${map[status]}`}>
      {label[status]}
    </span>
  );
}
