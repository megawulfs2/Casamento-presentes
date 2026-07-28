import Link from "next/link";
import { getSettings } from "@/lib/settings";

/**
 * Rodapé com botão de transição entre o site (visão do convidado) e o painel.
 *
 * No site, o botão aponta SEMPRE para "/admin". Quem decide o destino final é o
 * middleware (next-auth): visitantes sem sessão são redirecionados para
 * "/admin/login" (com callbackUrl) e administradores autenticados seguem direto
 * para o painel. Assim o rodapé não precisa conhecer a regra de autenticação.
 *
 * No painel, o botão volta ao site para pré-visualizar a visão do convidado.
 */
export default async function SiteFooter({
  area,
}: {
  area: "public" | "admin";
}) {
  const s = await getSettings();
  const year = new Date().getFullYear();
  const names = s.coupleNames || "Nosso casamento";

  return (
    <footer className="border-t border-gold/20 bg-white/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-stone sm:flex-row">
        <p>
          © {year} · {names}
        </p>

        {area === "public" ? (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-4 py-2 text-wine transition hover:bg-blush/40"
          >
            Área dos noivos →
          </Link>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-4 py-2 text-wine transition hover:bg-blush/40"
          >
            ← Ver o site (visão do convidado)
          </Link>
        )}
      </div>
    </footer>
  );
}
