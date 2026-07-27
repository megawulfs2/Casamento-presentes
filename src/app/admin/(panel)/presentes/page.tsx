import { prisma } from "@/lib/prisma";
import GiftManager, {
  type AdminGift,
  type AdminCategory,
} from "@/components/GiftManager";

export const dynamic = "force-dynamic";

export default async function AdminPresentesPage() {
  const [gifts, categories] = await Promise.all([
    prisma.gift.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const giftRows: AdminGift[] = gifts.map((g: (typeof gifts)[number]) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    imageUrl: g.imageUrl,
    price: Number(g.price),
    desiredQty: g.desiredQty,
    giftedQty: g.giftedQty,
    active: g.active,
    categoryId: g.categoryId,
    categoryName: g.category?.name ?? null,
  }));
  const categoryRows: AdminCategory[] = categories.map(
    (c: (typeof categories)[number]) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <div>
      <h1 className="font-display text-4xl text-wine">Presentes</h1>
      <p className="mt-2 text-sm text-stone">
        Cadastre, edite e organize os presentes da lista.
      </p>
      <div className="mt-8">
        <GiftManager gifts={giftRows} categories={categoryRows} />
      </div>
    </div>
  );
}
