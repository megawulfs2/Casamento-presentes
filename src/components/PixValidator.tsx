"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/Toast";

interface Props {
  pixKey: string;
  pixKeyType: string;
  pixCity: string;
  merchantName: string;
}

interface Result {
  valid: boolean;
  brCode?: string;
  qrCodeDataUrl?: string;
  error?: string;
}

export default function PixValidator({
  pixKey,
  pixKeyType,
  pixCity,
  merchantName,
}: Props) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  function validate() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/pix/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pixKey, pixKeyType, pixCity, merchantName }),
        });
        const data: Result = await res.json();
        setResult(data);
        toast(
          data.valid ? "Chave PIX válida ✔" : data.error ?? "Chave inválida",
          data.valid ? "success" : "error"
        );
      } catch {
        toast("Não foi possível validar agora.", "error");
      }
    });
  }

  function copy() {
    if (result?.brCode) {
      navigator.clipboard.writeText(result.brCode);
      toast("Copia e Cola copiado!", "success");
    }
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-blush/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-wine">Validar Chave PIX</p>
          <p className="text-xs text-stone">
            Gera um QR Code de teste (R$ 1,00) com os dados salvos.
          </p>
        </div>
        <button
          type="button"
          onClick={validate}
          disabled={pending || !pixKey}
          className="rounded-full bg-wine px-5 py-2.5 text-sm text-ivory hover:bg-wineDark disabled:opacity-60"
        >
          {pending ? "Validando…" : "Validar agora"}
        </button>
      </div>

      {result?.valid && result.qrCodeDataUrl && (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-lg bg-white p-4 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.qrCodeDataUrl}
            alt="QR Code PIX de teste"
            className="h-40 w-40 rounded-md"
          />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-medium text-green-700">
              ✔ Configuração válida
            </p>
            <p className="mb-1 text-xs text-stone">PIX Copia e Cola:</p>
            <code className="block max-h-24 overflow-y-auto break-all rounded bg-blush/40 p-2 text-[11px] text-ink">
              {result.brCode}
            </code>
            <button
              type="button"
              onClick={copy}
              className="mt-2 rounded-full border border-gold/40 px-4 py-1.5 text-xs text-wine hover:bg-blush/40"
            >
              Copiar código
            </button>
          </div>
        </div>
      )}

      {result && !result.valid && (
        <p className="mt-3 text-sm text-red-700">
          {result.error ?? "A configuração de PIX não é válida."}
        </p>
      )}
    </div>
  );
}
