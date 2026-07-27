"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { settingsSchema } from "@/lib/validations";

export async function updateSettings(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Não autorizado");

  const raw = {
    coupleNames: String(formData.get("coupleNames") ?? ""),
    welcomeMsg: String(formData.get("welcomeMsg") ?? ""),
    photoUrl: String(formData.get("photoUrl") ?? ""),
    logoUrl: String(formData.get("logoUrl") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    eventTime: String(formData.get("eventTime") ?? ""),
    venueName: String(formData.get("venueName") ?? ""),
    address: String(formData.get("address") ?? ""),
    mapsUrl: String(formData.get("mapsUrl") ?? ""),
    notifyEmail: String(formData.get("notifyEmail") ?? ""),
    pixKey: String(formData.get("pixKey") ?? ""),
    pixKeyType: String(formData.get("pixKeyType") ?? "email"),
    pixCity: String(formData.get("pixCity") ?? ""),
    defaultAmount: formData.get("defaultAmount") ?? 0,
    smtpHost: String(formData.get("smtpHost") ?? ""),
    smtpPort: formData.get("smtpPort") ?? "",
    smtpUser: String(formData.get("smtpUser") ?? ""),
    smtpPass: String(formData.get("smtpPass") ?? ""),
    smtpFrom: String(formData.get("smtpFrom") ?? ""),
  };

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message };
  }
  const d = parsed.data;

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {
      coupleNames: d.coupleNames,
      welcomeMsg: d.welcomeMsg || undefined,
      photoUrl: d.photoUrl || null,
      logoUrl: d.logoUrl || null,
      eventDate: d.eventDate ? new Date(d.eventDate) : null,
      eventTime: d.eventTime || null,
      venueName: d.venueName || null,
      address: d.address || null,
      mapsUrl: d.mapsUrl || null,
      notifyEmail: d.notifyEmail || null,
      pixKey: d.pixKey || "",
      pixKeyType: d.pixKeyType,
      pixCity: d.pixCity || "BRASILIA",
      defaultAmount: (d.defaultAmount ?? 0).toFixed(2),
      smtpHost: d.smtpHost || null,
      smtpPort: typeof d.smtpPort === "number" ? d.smtpPort : null,
      smtpUser: d.smtpUser || null,
      smtpPass: d.smtpPass || null,
      smtpFrom: d.smtpFrom || null,
    },
    create: {
      id: "singleton",
      coupleNames: d.coupleNames,
      pixKey: d.pixKey || "",
      pixKeyType: d.pixKeyType,
      pixCity: d.pixCity || "BRASILIA",
    },
  });

  revalidatePath("/");
  revalidatePath("/presentes");
  revalidatePath("/admin/configuracoes");
  return { ok: true as const };
}
