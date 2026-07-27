"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/components/Toast";
import {
  createGift,
  updateGift,
  deleteGift,
  createCategory,
  deleteCategory,
} from "@/actions/gifts";

export interface AdminGift {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  desiredQty: number;
  giftedQty: number;
  active: boolean;
  categoryId: string | null;
  categoryName: string | null;
}
export interface AdminCategory {
  id: string;
  name: string;
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function GiftManager({
  gifts,
  categories,
}: {
  gifts: AdminGift[];
  categories: AdminCategory[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<AdminGift | null>(null);
  const [creating, setCreating] = useState(false);

  const open = creating || editing !== null;

  function handleDelete(g: AdminGift) {
    if (!confirm(`Excluir "${g.name}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      const res = await deleteGift(g.id);
      if (res.ok) {
        toast("Presente excluído.", "success");
        router.refresh();
      } else toast(res.error ?? "Erro ao excluir", "error");
    });
  }

  function handleCategoryAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const res = await createCategory(data);
      if (res.ok) {
        toast("Categoria criada.", "success");
        form.reset();
        router.refresh();
      } else toast(res.error ?? "Erro", "error");
    });
  }

  function handleCategoryDelete(c: AdminCategory) {
    if (!confirm(`Excluir a categoria "${c.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteCategory(c.id);
      if (res.ok) {
        toast("Categoria excluída.", "success");
        router.refresh();
      } else toast(res.error ?? "Erro", "error");
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = editing
        ? await updateGift(editing.id, data)
        : await createGift(data);
      if (res.ok) {
        toast(editing ? "Presente atualizado." : "Presente criado.", "success");
        setEditing(null);
        setCreating(false);
        router.refresh();
      } else toast(res.error ?? "Erro ao salvar", "error");
    });
  }

  return (
    <div>
      {/* Categorias */}
      <section className="rounded-xl bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-stone">Categorias:</span>
          {categories.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 rounded-full bg-blush/60 px-3 py-1 text-xs text-wine"
            >
              {c.name}
              <button
                onClick={() => handleCategoryDelete(c)}
                aria-label={`Excluir categoria ${c.name}`}
                className="text-wine/60 hover:text-wine"
              >
                ×
              </button>
            </span>
          ))}
          {categories.length === 0 && (
            <span className="text-xs text-stone">nenhuma ainda</span>
          )}
        </div>
        <form onSubmit={handleCategoryAdd} className="mt-3 flex gap-2">
          <input
            name="name"
            placeholder="Nova categoria"
            required
            className="input max-w-xs"
          />
          <button
            disabled={pending}
            className="rounded-full bg-wine px-4 py-2 text-sm text-ivory hover:bg-wineDark disabled:opacity-60"
          >
            Adicionar
          </button>
        </form>
      </section>

      {/* Ações */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-display text-2xl text-wine">
          {gifts.length} presente{gifts.length === 1 ? "" : "s"}
        </h2>
        <button
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          className="rounded-full bg-wine px-5 py-2.5 text-sm text-ivory hover:bg-wineDark"
        >
          + Novo presente
        </button>
      </div>

      {/* Tabela */}
      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-soft">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-blush/40 text-stone">
            <tr>
              <th className="px-4 py-3">Presente</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Progresso</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {gifts.map((g) => {
              const pct = Math.min(100, (g.giftedQty / g.desiredQty) * 100);
              const esgotado = g.giftedQty >= g.desiredQty;
              return (
                <tr key={g.id} className="border-t border-blush/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 overflow-hidden rounded-md bg-blush/40">
                        {g.imageUrl && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={g.imageUrl}
                            alt={g.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </span>
                      <span className="font-medium">{g.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{g.categoryName ?? "—"}</td>
                  <td className="px-4 py-3">{brl(g.price)}</td>
                  <td className="px-4 py-3">
                    <div className="w-28">
                      <div className="mb-1 text-xs text-stone">
                        {g.giftedQty}/{g.desiredQty}
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-blush">
                        <div
                          className="h-full rounded-full bg-wine"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {!g.active ? (
                      <Badge tone="stone">Inativo</Badge>
                    ) : esgotado ? (
                      <Badge tone="stone">Esgotado</Badge>
                    ) : (
                      <Badge tone="green">Disponível</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setCreating(false);
                          setEditing(g);
                        }}
                        className="rounded-full border border-gold/40 px-3 py-1.5 text-xs text-wine hover:bg-blush/40"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(g)}
                        className="rounded-full border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {gifts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-stone">
                  Nenhum presente cadastrado. Clique em “Novo presente”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de formulário */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setEditing(null);
              setCreating(false);
            }}
          >
            <motion.form
              onSubmit={handleSubmit}
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-ivory p-7 shadow-soft"
            >
              <h3 className="font-display text-2xl text-wine">
                {editing ? "Editar presente" : "Novo presente"}
              </h3>

              <div className="mt-5 space-y-3">
                <Labeled label="Nome">
                  <input
                    name="name"
                    defaultValue={editing?.name}
                    required
                    className="input"
                  />
                </Labeled>
                <div className="grid grid-cols-2 gap-3">
                  <Labeled label="Valor (R$)">
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      defaultValue={editing?.price}
                      required
                      className="input"
                    />
                  </Labeled>
                  <Labeled label="Quantidade desejada">
                    <input
                      name="desiredQty"
                      type="number"
                      min="1"
                      defaultValue={editing?.desiredQty ?? 1}
                      required
                      className="input"
                    />
                  </Labeled>
                </div>
                <Labeled label="Categoria">
                  <select
                    name="categoryId"
                    defaultValue={editing?.categoryId ?? ""}
                    className="input"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Labeled>
                <Labeled label="Descrição">
                  <textarea
                    name="description"
                    defaultValue={editing?.description ?? ""}
                    rows={3}
                    className="input"
                  />
                </Labeled>
                <Labeled label="Imagem (arquivo JPG, PNG ou WEBP)">
                  <input
                    type="file"
                    name="image"
                    accept="image/jpeg,image/png,image/webp"
                    className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-blush file:px-4 file:py-2 file:text-wine"
                  />
                </Labeled>
                <Labeled label="…ou URL da imagem">
                  <input
                    name="imageUrl"
                    defaultValue={editing?.imageUrl ?? ""}
                    placeholder="https://…"
                    className="input"
                  />
                </Labeled>
                {editing && (
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={editing.active}
                      className="accent-wine"
                    />
                    Presente ativo (visível para os convidados)
                  </label>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setCreating(false);
                  }}
                  className="rounded-full border border-gold/40 px-5 py-2.5 text-sm text-stone hover:bg-blush/30"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-full bg-wine px-6 py-2.5 text-sm text-ivory hover:bg-wineDark disabled:opacity-60"
                >
                  {pending ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-stone">{label}</span>
      {children}
    </label>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "green" | "stone";
  children: React.ReactNode;
}) {
  const cls =
    tone === "green"
      ? "bg-green-100 text-green-800"
      : "bg-stone/20 text-stone";
  return <span className={`rounded-full px-3 py-1 text-xs ${cls}`}>{children}</span>;
}
