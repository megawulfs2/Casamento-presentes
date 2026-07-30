"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createConfirmation } from "@/actions/confirmations";
import type { GiftView } from "./GiftGrid";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  gift: GiftView | null;
  pixConfigured: boolean;
  onClose: () => void;
}

export default function GiftModal({ gift, pixConfigured, onClose }: Props) {
  const [pix, setPix] = useState<{ brCode: string; qrCodeDataUrl: string } | null>(
    null
  );
  const [loadingPix, setLoadingPix] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gift || !pixConfigured) return;
    setPix(null);
    setDone(false);
    setError(null);
    setLoadingPix(true);
    fetch(`/api/pix?giftId=${gift.id}&amount=${gift.price}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPix({ brCode: data.brCode, qrCodeDataUrl: data.qrCodeDataUrl });
      })
      .catch(() => setError("Não foi possível gerar o PIX"))
      .finally(() => setLoadingPix(false));
  }, [gift, pixConfigured]);

  async function copyPix() {
    if (!pix) return;
    await navigator.clipboard.writeText(pix.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!gift) return;
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("giftId", gift.id);
    formData.set("amount", String(gift.price));
    const res = await createConfirmation(formData);
    setSubmitting(false);
    if (res.ok) setDone(true);
    else setError(res.error ?? "Erro ao enviar");
  }

  return (
    <AnimatePresence>
      {gift && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-ivory p-7 shadow-soft"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-3xl text-wine">{gift.name}</h3>
                <p className="mt-1 text-lg text-gold">{brl(gift.price)}</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="text-2xl leading-none text-stone hover:text-wine"
              >
                ×
              </button>
            </div>

            {gift.description && (
              <p className="mt-3 text-sm text-stone">{gift.description}</p>
            )}

            {done ? (
              <div className="mt-8 rounded-xl bg-blush/50 p-6 text-center">
                <p className="font-display text-2xl text-wine">
                  Recebemos sua confirmação ❤️
                </p>
                <p className="mt-2 text-sm text-stone">
                  Os noivos vão conferir o PIX no banco e confirmar em breve.
                  Enviamos um e-mail para você.
                </p>
                <button
                  onClick={onClose}
                  className="mt-5 rounded-full bg-wine px-7 py-3 text-sm text-ivory hover:bg-wineDark"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <>
                {/* PIX */}
                <div className="mt-6 rounded-xl border border-gold/25 bg-white p-5 text-center">
                  {!pixConfigured ? (
                    <p className="text-sm text-stone">
                      Os noivos ainda não configuraram a chave PIX.
                    </p>
                  ) : loadingPix ? (
                    <p className="text-sm text-stone">Gerando QR Code…</p>
                  ) : pix ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pix.qrCodeDataUrl}
                        alt="QR Code PIX"
                        className="mx-auto h-52 w-52"
                      />
                      <button
                        type="button"
                        onClick={copyPix}
                        className="mt-4 w-full rounded-lg bg-wine px-4 py-3 text-sm text-ivory hover:bg-wineDark"
                      >
                        {copied ? "Copiado!" : "Copiar código PIX (Copia e Cola)"}
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-red-700">{error}</p>
                  )}
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                  <Input name="guestName" placeholder="Seu nome" required />
                  <Input
                    name="guestEmail"
                    type="email"
                    placeholder="Seu e-mail"
                    required
                  />
                  <Input
                    name="guestWhatsapp"
                    placeholder="WhatsApp"
                  />
                  <textarea
                    name="message"
                    placeholder="Mensagem aos noivos (opcional)"
                    rows={3}
                    className="w-full rounded-lg border border-gold/30 bg-white px-4 py-3 text-sm outline-none focus:border-wine"
                  />
                  <label className="block text-sm text-stone">
                    Comprovante do PIX (opcional — JPG, PNG ou PDF)
                    <input
                      type="file"
                      name="receipt"
                      accept="image/jpeg,image/png,application/pdf"
                      className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-blush file:px-4 file:py-2 file:text-wine"
                    />
                  </label>
                  <label className="flex items-start gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      name="paymentConfirmed"
                      required
                      className="mt-1 accent-wine"
                    />
                    Confirmo que realizei o pagamento via PIX.
                  </label>

                  {error && !done && (
                    <p className="text-sm text-red-700">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-full bg-gold px-6 py-4 text-base text-white shadow-soft transition hover:brightness-95 disabled:opacity-60"
                  >
                    {submitting ? "Enviando…" : "Enviar confirmação"}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-gold/30 bg-white px-4 py-3 text-sm outline-none focus:border-wine"
    />
  );
}
