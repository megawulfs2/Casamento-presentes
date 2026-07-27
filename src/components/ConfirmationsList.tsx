"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import {
  confirmPayment,
  rejectConfirmation,
  deleteReceipt,
} from "@/actions/confirmations";

export type ConfStatus = "AGUARDANDO" | "CONFIRMADO" | "RECUSADO";

export interface ConfirmationRow {
  id: string;
  giftName: string;
  categoryName: string | null;
  amount: number;
  guestName: string;
  guestEmail: string;
  guestWhatsapp: string | null;
  message: string | null;
  createdAt: string;
  status: ConfStatus;
  rejectReason: string | null;
  receiptUrl: string | null;
  receiptName: string | null;
  receiptMime: string | null;
}

const PAGE_SIZE = 8;
const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_LABEL: Record<ConfStatus, string> = {
  AGUARDANDO: "Aguardando",
  CONFIRMADO: "Confirmado",
  RECUSADO: "Recusado",
};
const STATUS_STYLE: Record<ConfStatus, string> = {
  AGUARDANDO: "bg-amber-100 text-amber-800",
  CONFIRMADO: "bg-green-100 text-green-800",
  RECUSADO: "bg-red-100 text-red-800",
};

export default function ConfirmationsList({ items }: { items: ConfirmationRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"TODOS" | ConfStatus>("TODOS");
  const [page, setPage] = useState(1);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((c) => {
      if (status !== "TODOS" && c.status !== status) return false;
      if (!q) return true;
      return (
        c.guestName.toLowerCase().includes(q) ||
        c.guestEmail.toLowerCase().includes(q) ||
        c.giftName.toLowerCase().includes(q)
      );
    });
  }, [items, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast(ok, "success");
        router.refresh();
      } else toast(res.error ?? "Erro", "error");
    });
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por convidado, e-mail ou presente…"
          aria-label="Buscar confirmações"
          className="input sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {(["TODOS", "AGUARDANDO", "CONFIRMADO", "RECUSADO"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-1.5 text-xs ${
                  status === s
                    ? "bg-wine text-ivory"
                    : "border border-gold/40 text-wine hover:bg-blush/40"
                }`}
              >
                {s === "TODOS" ? "Todos" : STATUS_LABEL[s]}
              </button>
            )
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="mt-6 space-y-4">
        {shown.map((c) => (
          <div key={c.id} className="rounded-xl bg-white p-6 shadow-soft">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1 text-sm">
                <p className="font-display text-2xl text-wine">
                  {c.giftName}{" "}
                  <span className="text-lg text-gold">{brl(c.amount)}</span>
                  <span
                    className={`ml-2 rounded-full px-2.5 py-0.5 text-xs align-middle ${STATUS_STYLE[c.status]}`}
                  >
                    {STATUS_LABEL[c.status]}
                  </span>
                </p>
                <p className="text-stone">Categoria: {c.categoryName ?? "—"}</p>
                <p>
                  <strong>{c.guestName}</strong> · {c.guestEmail}
                </p>
                {c.guestWhatsapp && <p>WhatsApp: {c.guestWhatsapp}</p>}
                <p className="text-stone">{c.createdAt}</p>
                {c.message && (
                  <p className="mt-2 rounded-lg bg-blush/40 p-3 italic">
                    “{c.message}”
                  </p>
                )}
                {c.rejectReason && (
                  <p className="mt-1 text-red-700">Motivo: {c.rejectReason}</p>
                )}
                {c.receiptUrl ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <a
                      href={c.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-wine underline underline-offset-4"
                    >
                      Visualizar comprovante
                    </a>
                    <a
                      href={c.receiptUrl}
                      download={c.receiptName ?? true}
                      className="text-wine underline underline-offset-4"
                    >
                      Baixar
                    </a>
                    <button
                      onClick={() =>
                        run(() => deleteReceipt(c.id), "Comprovante removido.")
                      }
                      disabled={pending}
                      className="text-red-700 underline underline-offset-4"
                    >
                      Excluir
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-stone">Sem comprovante anexado.</p>
                )}
              </div>

              {c.status === "AGUARDANDO" && (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        run(
                          () => confirmPayment(c.id),
                          "Pagamento confirmado."
                        )
                      }
                      disabled={pending}
                      className="rounded-full bg-green-700 px-4 py-2 text-xs text-white hover:bg-green-800 disabled:opacity-60"
                    >
                      Confirmar pagamento
                    </button>
                    <button
                      onClick={() =>
                        setRejectingId((v) => (v === c.id ? null : c.id))
                      }
                      disabled={pending}
                      className="rounded-full border border-red-300 px-4 py-2 text-xs text-red-700 hover:bg-red-50"
                    >
                      Recusar
                    </button>
                  </div>
                  {rejectingId === c.id && (
                    <div className="flex w-full items-center gap-2">
                      <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Motivo da recusa"
                        className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs outline-none"
                      />
                      <button
                        onClick={() =>
                          run(() => {
                            const r = reason;
                            setRejectingId(null);
                            setReason("");
                            return rejectConfirmation(c.id, r);
                          }, "Confirmação recusada.")
                        }
                        disabled={pending}
                        className="rounded-full bg-red-700 px-3 py-2 text-xs text-white hover:bg-red-800 disabled:opacity-60"
                      >
                        Confirmar recusa
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center text-stone shadow-soft">
            Nenhuma confirmação encontrada.
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current === 1}
            className="rounded-full border border-gold/40 px-4 py-1.5 text-sm text-wine disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-stone">
            {current} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={current === totalPages}
            className="rounded-full border border-gold/40 px-4 py-1.5 text-sm text-wine disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
