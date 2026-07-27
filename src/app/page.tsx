import Link from "next/link";
import { redirect } from "next/navigation";
import Countdown from "@/components/Countdown";
import { getSettings } from "@/lib/settings";
import { isSetupComplete } from "@/lib/setup";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!(await isSetupComplete())) redirect("/setup");
  const s = await getSettings();
  const eventDate = s.eventDate ?? new Date("2026-11-14T18:00:00-03:00");
  const dateLabel = eventDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blush/60 via-ivory to-ivory" />
        <div className="relative mx-auto max-w-3xl px-6 pt-20 pb-16 text-center">
          {s.photoUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={s.photoUrl}
              alt={s.coupleNames}
              className="mx-auto mb-10 h-44 w-44 rounded-full object-cover shadow-soft ring-4 ring-white"
            />
          )}
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            Vamos nos casar
          </p>
          <h1 className="mt-4 font-display text-5xl leading-tight text-wine sm:text-7xl">
            {s.coupleNames}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-stone">
            {s.welcomeMsg}
          </p>

          <div className="mt-12">
            <Countdown dateIso={eventDate.toISOString()} />
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/presentes"
              style={{ background: "var(--color-primary)" }}
              className="rounded-full px-9 py-4 text-base text-ivory shadow-soft transition hover:opacity-90"
            >
              Lista de presentes
            </Link>
            <a
              href={s.mapsUrl ?? "#local"}
              className="rounded-full border border-gold/60 px-9 py-4 text-base text-wine transition hover:bg-blush/50"
            >
              Confirmar presença
            </a>
          </div>
        </div>
      </section>

      {/* Detalhes do evento */}
      <section id="local" className="mx-auto max-w-3xl px-6 py-20">
        <div className="hairline pt-16 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Celebração</p>
          <h2 className="mt-3 font-display text-4xl text-wine">{dateLabel}</h2>
          <p className="mt-2 text-lg text-ink">{s.eventTime}</p>
          {s.venueName && (
            <p className="mt-6 font-display text-2xl text-ink">{s.venueName}</p>
          )}
          {s.address && <p className="mt-1 text-stone">{s.address}</p>}
          {s.mapsUrl && (
            <a
              href={s.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block text-sm text-wine underline underline-offset-4 hover:text-gold"
            >
              Ver no Google Maps
            </a>
          )}
        </div>
      </section>
    </main>
  );
}
