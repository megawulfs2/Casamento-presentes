import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { isSetupComplete } from "@/lib/setup";
import GiftGrid, { type GiftView } from "@/components/GiftGrid";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export default async function PresentesPage() {
  if (!(await isSetupComplete())) redirect("/setup");
  const [gifts, categories, settings] = await Promise.all([
    prisma.gift.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    getSettings(),
  ]);

  const view: GiftView[] = gifts.map((g: (typeof gifts)[number]) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    imageUrl: g.imageUrl,
    price: Number(g.price),
    desiredQty: g.desiredQty,
    giftedQty: g.giftedQty,
    category: g.category?.name ?? null,
  }));

  return (
    <>
    <main className="min-h-screen">
      <header className="border-b border-gold/20 bg-blush/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link href="/" className="font-display text-2xl text-wine">
            {settings.coupleNames}
          </Link>
          <Link
            href="/"
            className="text-sm text-stone underline underline-offset-4 hover:text-wine"
          >
            Voltar ao início
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            Com carinho
          </p>
          <h1 className="mt-3 font-display text-5xl text-wine">
            Lista de presentes
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-stone">
            Escolha um presente e contribua via PIX. Após o pagamento, é só nos
            avisar — conferimos e confirmamos com todo o cuidado.
          </p>
        </div>

        <GiftGrid
          gifts={view}
          categories={categories.map((c: (typeof categories)[number]) => c.name)}
          pixConfigured={Boolean(settings.pixKey)}
        />
      </div>
    </main>
    <SiteFooter area="public" />
    </>
  );
}
