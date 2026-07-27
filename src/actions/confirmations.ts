"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { confirmationSchema } from "@/lib/validations";
import { saveUpload, deleteUpload, RECEIPT_MIME } from "@/lib/upload";
import { rateLimit } from "@/lib/rate-limit";
import {
  notifyCouple,
  thankGuest,
  notifyApproved,
  notifyReject,
} from "@/lib/email";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Não autorizado");
  return session;
}

/** Convidado envia a confirmação do PIX (status AGUARDANDO). */
export async function createConfirmation(formData: FormData) {
  // Rate limit por IP (anti-spam)
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rl = rateLimit(`confirm:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return {
      ok: false as const,
      error: `Muitas tentativas. Tente novamente em ${rl.retryAfter}s.`,
    };
  }

  const parsed = confirmationSchema.safeParse({
    giftId: String(formData.get("giftId") ?? ""),
    guestName: String(formData.get("guestName") ?? ""),
    guestEmail: String(formData.get("guestEmail") ?? ""),
    guestWhatsapp: String(formData.get("guestWhatsapp") ?? ""),
    message: String(formData.get("message") ?? ""),
    amount: formData.get("amount"),
    paymentConfirmed: formData.get("paymentConfirmed") === "on",
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message };
  }
  const data = parsed.data;

  const gift = await prisma.gift.findUnique({ where: { id: data.giftId } });
  if (!gift || !gift.active) {
    return { ok: false as const, error: "Presente indisponível" };
  }
  if (gift.giftedQty >= gift.desiredQty) {
    return { ok: false as const, error: "Presente esgotado" };
  }

  const confirmation = await prisma.confirmation.create({
    data: {
      giftId: data.giftId,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestWhatsapp: data.guestWhatsapp || null,
      message: data.message || null,
      amount: data.amount.toFixed(2),
      status: "AGUARDANDO",
    },
  });

  // Comprovante opcional (validado por tipo e tamanho)
  let hasReceipt = false;
  const file = formData.get("receipt");
  if (file instanceof File && file.size > 0) {
    const res = await saveUpload(file, "receipts", RECEIPT_MIME, confirmation.id);
    if (res.ok && res.file) {
      await prisma.receipt.create({
        data: {
          confirmationId: confirmation.id,
          fileUrl: res.file.fileUrl,
          fileName: res.file.fileName,
          mimeType: res.file.mimeType,
        },
      });
      hasReceipt = true;
    }
  }

  const emailData = {
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    guestWhatsapp: data.guestWhatsapp,
    giftName: gift.name,
    amount: data.amount.toFixed(2).replace(".", ","),
    message: data.message,
    hasReceipt,
  };
  await Promise.all([notifyCouple(emailData), thankGuest(emailData)]);

  revalidatePath("/admin/confirmacoes");
  revalidatePath("/admin");
  return { ok: true as const };
}

/** Noivos confirmam o recebimento: +1 no presente e status CONFIRMADO. */
export async function confirmPayment(confirmationId: string) {
  await requireAdmin();

  const confirmation = await prisma.confirmation.findUnique({
    where: { id: confirmationId },
    include: { gift: true },
  });
  if (!confirmation) return { ok: false as const, error: "Não encontrado" };
  if (confirmation.status !== "AGUARDANDO") {
    return { ok: false as const, error: "Confirmação já processada" };
  }

  await prisma.$transaction([
    prisma.confirmation.update({
      where: { id: confirmationId },
      data: { status: "CONFIRMADO" },
    }),
    prisma.gift.update({
      where: { id: confirmation.giftId },
      data: { giftedQty: { increment: 1 } },
    }),
  ]);

  await notifyApproved(
    confirmation.guestName,
    confirmation.guestEmail,
    confirmation.gift.name
  );

  revalidatePath("/admin");
  revalidatePath("/admin/confirmacoes");
  revalidatePath("/presentes");
  return { ok: true as const };
}

/** Noivos recusam a confirmação: presente segue disponível, convidado avisado. */
export async function rejectConfirmation(
  confirmationId: string,
  reason?: string
) {
  await requireAdmin();

  const confirmation = await prisma.confirmation.findUnique({
    where: { id: confirmationId },
    include: { gift: true },
  });
  if (!confirmation) return { ok: false as const, error: "Não encontrado" };

  await prisma.confirmation.update({
    where: { id: confirmationId },
    data: { status: "RECUSADO", rejectReason: reason || null },
  });

  await notifyReject(
    confirmation.guestName,
    confirmation.guestEmail,
    confirmation.gift.name,
    reason
  );

  revalidatePath("/admin/confirmacoes");
  revalidatePath("/admin");
  return { ok: true as const };
}

/** Remove o comprovante de uma confirmação (arquivo + registro). */
export async function deleteReceipt(confirmationId: string) {
  await requireAdmin();

  const receipt = await prisma.receipt.findUnique({
    where: { confirmationId },
  });
  if (!receipt) return { ok: false as const, error: "Sem comprovante" };

  await deleteUpload(receipt.fileUrl);
  await prisma.receipt.delete({ where: { confirmationId } });

  revalidatePath("/admin/confirmacoes");
  return { ok: true as const };
}
