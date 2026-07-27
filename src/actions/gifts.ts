"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { giftSchema, categorySchema } from "@/lib/validations";
import { saveUpload, deleteUpload, IMAGE_MIME } from "@/lib/upload";

type ActionResult = { ok: true } | { ok: false; error?: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Não autorizado");
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Resolve a imagem: arquivo enviado tem prioridade sobre URL. */
async function resolveImage(
  formData: FormData,
  previousUrl?: string | null
): Promise<{ imageUrl: string | null; error?: string }> {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const res = await saveUpload(file, "gifts", IMAGE_MIME);
    if (!res.ok || !res.file) return { imageUrl: previousUrl ?? null, error: res.error };
    // remove imagem anterior se era um upload local
    if (previousUrl?.startsWith("/uploads/")) await deleteUpload(previousUrl);
    return { imageUrl: res.file.fileUrl };
  }
  const url = String(formData.get("imageUrl") ?? "").trim();
  if (url) return { imageUrl: url };
  return { imageUrl: previousUrl ?? null };
}

export async function createGift(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = giftSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
    price: formData.get("price"),
    desiredQty: formData.get("desiredQty"),
    categoryId: formData.get("categoryId") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const d = parsed.data;

  const img = await resolveImage(formData);
  if (img.error) return { ok: false, error: img.error };

  await prisma.gift.create({
    data: {
      name: d.name,
      description: d.description || null,
      imageUrl: img.imageUrl,
      price: d.price.toFixed(2),
      desiredQty: d.desiredQty,
      categoryId: d.categoryId || null,
    },
  });

  revalidatePath("/admin/presentes");
  revalidatePath("/presentes");
  return { ok: true };
}

export async function updateGift(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const existing = await prisma.gift.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Presente não encontrado" };

  const parsed = giftSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
    price: formData.get("price"),
    desiredQty: formData.get("desiredQty"),
    categoryId: formData.get("categoryId") ?? "",
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const d = parsed.data;

  const img = await resolveImage(formData, existing.imageUrl);
  if (img.error) return { ok: false, error: img.error };

  await prisma.gift.update({
    where: { id },
    data: {
      name: d.name,
      description: d.description || null,
      imageUrl: img.imageUrl,
      price: d.price.toFixed(2),
      desiredQty: d.desiredQty,
      categoryId: d.categoryId || null,
      active: d.active ?? true,
    },
  });

  revalidatePath("/admin/presentes");
  revalidatePath("/presentes");
  return { ok: true };
}

export async function deleteGift(id: string): Promise<ActionResult> {
  await requireAdmin();

  const gift = await prisma.gift.findUnique({ where: { id } });
  if (!gift) return { ok: false, error: "Presente não encontrado" };

  if (gift.imageUrl?.startsWith("/uploads/")) await deleteUpload(gift.imageUrl);
  await prisma.gift.delete({ where: { id } });

  revalidatePath("/admin/presentes");
  revalidatePath("/presentes");
  return { ok: true };
}

export async function createCategory(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const name = parsed.data.name.trim();
  const slug = slugify(name);
  const exists = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug }] },
  });
  if (exists) return { ok: false, error: "Categoria já existe" };

  await prisma.category.create({ data: { name, slug } });
  revalidatePath("/admin/presentes");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/presentes");
  return { ok: true };
}
