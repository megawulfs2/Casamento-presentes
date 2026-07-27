"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function BackupPanel() {
  const { toast } = useToast();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !confirm(
        "Importar este backup substituirá presentes, categorias e confirmações atuais. Continuar?"
      )
    ) {
      e.target.value = "";
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (res.ok) {
        toast("Backup importado com sucesso.", "success");
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        toast(d.error ?? "Falha ao importar backup.", "error");
      }
    } catch {
      toast("Arquivo de backup inválido.", "error");
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href="/api/admin/backup"
        className="rounded-full bg-wine px-5 py-2.5 text-sm text-ivory hover:bg-wineDark"
      >
        Exportar backup (JSON)
      </a>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={importing}
        className="rounded-full border border-gold/40 px-5 py-2.5 text-sm text-wine hover:bg-blush/40 disabled:opacity-60"
      >
        {importing ? "Importando…" : "Importar backup"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
}
