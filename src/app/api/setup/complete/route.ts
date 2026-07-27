import { NextRequest, NextResponse } from "next/server";
import { assertSetupAccess } from "@/lib/setup";
import { prisma } from "@/lib/prisma";

/** Persiste todas as configurações do assistente e marca a conclusão. */
export async function POST(req: NextRequest) {
  try {
    await assertSetupAccess();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const groom = String(b.groomName ?? "").trim();
  const bride = String(b.brideName ?? "").trim();
  const coupleNames =
    groom && bride ? `${groom} e ${bride}` : groom || bride || "Os noivos";

  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s.length ? s : null;
  };
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
  };

  const data = {
    coupleNames,
    groomName: str(b.groomName),
    brideName: str(b.brideName),
    coupleStory: str(b.coupleStory),
    welcomeMsg: str(b.welcomeMsg) ?? "Ficamos felizes em compartilhar este momento com você.",
    guestMessage: str(b.guestMessage),
    photoUrl: str(b.photoUrl),
    bannerUrl: str(b.bannerUrl),
    eventDate: b.eventDate ? new Date(String(b.eventDate)) : null,
    eventTime: str(b.eventTime),
    venueName: str(b.venueName),
    address: str(b.address),
    mapsUrl: str(b.mapsUrl),
    themeName: str(b.themeName) ?? "classico",
    primaryColor: str(b.primaryColor) ?? "#6E2A3A",
    secondaryColor: str(b.secondaryColor) ?? "#B8945F",
    fontFamily: str(b.fontFamily) ?? "Cormorant Garamond",
    buttonStyle: str(b.buttonStyle) ?? "pill",
    pixKey: str(b.pixKey) ?? "",
    pixKeyType: str(b.pixKeyType) ?? "email",
    pixCity: str(b.pixCity) ?? "BRASILIA",
    notifyEmail: str(b.notifyEmail) ?? str(b.smtpUser),
    smtpHost: str(b.smtpHost),
    smtpPort: num(b.smtpPort),
    smtpUser: str(b.smtpUser),
    smtpPass: str(b.smtpPass),
    smtpFrom: str(b.smtpFrom),
    setupCompleted: true,
  };

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  return NextResponse.json({ ok: true });
}
