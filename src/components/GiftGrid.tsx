"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import GiftModal from "./GiftModal";

export interface GiftView {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  desiredQty: number;
  giftedQty: number;
  category: string | null;
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Sort = "populares" | "caros" | "baratos" | "alfabetica";

export default function GiftGrid({
  gifts,
  categories,
  pixConfigured,
}: {
  gifts: GiftView[];
  categories: string[];
  pixConfigured: boolean;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("todas");
  const [sort, setSort] = useState<Sort>("populares");
  const [selected, setSelected] = useState<GiftView | null>(null);

  const list = useMemo(() => {
    let out = gifts.filter((g) =>
      g.name.toLowerCase().includes(query.toLowerCase())
    );
    if (cat !== "todas") out = out.filter((g) => g.category === cat);
    switch (sort) {
      case "caros":
        out = [...out].sort((a, b) => b.price - a.price);
        break;
      case "baratos":
        out = [...out].sort((a, b) => a.price - b.price);
        break;
      case "alfabetica":
        out = [...out].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        break;
      default:
        out = [...out].sort((a, b) => b.giftedQty - a.giftedQty);
    }
    return out;
  }, [gifts, query, cat, sort]);

  return (
    <div className="mt-12">
      {/* Controles */}
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar presente…"
          className="w-full rounded-full border border-gold/30 bg-white px-5 py-3 text-sm outline-none focus:border-wine sm:max-w-xs"
        />
        <div className="flex gap-3">
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="rounded-full border border-gold/30 bg-white px-4 py-3 text-sm outline-none focus:border-wine"
          >
            <option value="todas">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-full border border-gold/30 bg-white px-4 py-3 text-sm outline-none focus:border-wine"
          >
            <option value="populares">Mais comprados</option>
            <option value="caros">Mais caros</option>
            <option value="baratos">Mais baratos</option>
            <option value="alfabetica">Ordem alfabética</option>
          </select>
        </div>
      </div>

      {/* Grade */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((g, i) => {
          const esgotado = g.giftedQty >= g.desiredQty;
          const pct = Math.min(100, (g.giftedQty / g.desiredQty) * 100);
          return (
            <motion.article
              key={g.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.05 }}
              className="overflow-hidden rounded-2xl bg-white shadow-soft"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-blush/40">
                {g.imageUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={g.imageUrl}
                    alt={g.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-5">
                {g.category && (
                  <span className="text-[11px] uppercase tracking-[0.18em] text-gold">
                    {g.category}
                  </span>
                )}
                <h3 className="mt-1 font-display text-2xl text-wine">
                  {g.name}
                </h3>
                <p className="mt-1 text-lg text-ink">{brl(g.price)}</p>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-stone">
                    <span>
                      {g.giftedQty} de {g.desiredQty} presentes
                    </span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-blush">
                    <div
                      className="h-full rounded-full bg-wine transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <button
                  disabled={esgotado}
                  onClick={() => setSelected(g)}
                  className={`mt-5 w-full rounded-full px-5 py-3 text-sm transition ${
                    esgotado
                      ? "cursor-not-allowed bg-stone/20 text-stone"
                      : "bg-wine text-ivory hover:bg-wineDark"
                  }`}
                >
                  {esgotado ? "Presente esgotado" : "Presentear"}
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>

      {list.length === 0 && (
        <p className="py-16 text-center text-stone">
          Nenhum presente encontrado.
        </p>
      )}

      <GiftModal
        gift={selected}
        pixConfigured={pixConfigured}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
