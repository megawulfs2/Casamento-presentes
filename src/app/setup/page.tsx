import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import SetupWizard, { type WizardInitial } from "@/components/SetupWizard";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const s = await getSettings();

  // Após concluído, só um administrador autenticado pode reabrir o assistente.
  if (s.setupCompleted) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/");
  }

  const initial: WizardInitial = {
    groomName: s.groomName ?? "",
    brideName: s.brideName ?? "",
    coupleStory: s.coupleStory ?? "",
    welcomeMsg: s.welcomeMsg ?? "",
    photoUrl: s.photoUrl ?? "",
    guestMessage: s.guestMessage ?? "",
    eventDate: s.eventDate ? new Date(s.eventDate).toISOString().slice(0, 16) : "",
    eventTime: s.eventTime ?? "",
    venueName: s.venueName ?? "",
    address: s.address ?? "",
    mapsUrl: s.mapsUrl ?? "",
    themeName: s.themeName ?? "classico",
    primaryColor: s.primaryColor ?? "#6E2A3A",
    secondaryColor: s.secondaryColor ?? "#B8945F",
    fontFamily: s.fontFamily ?? "Cormorant Garamond",
    buttonStyle: s.buttonStyle ?? "pill",
    bannerUrl: s.bannerUrl ?? "",
    pixKeyType: s.pixKeyType ?? "email",
    pixKey: s.pixKey ?? "",
    pixCity: s.pixCity ?? "BRASILIA",
    smtpHost: s.smtpHost ?? "",
    smtpPort: s.smtpPort ? String(s.smtpPort) : "",
    smtpUser: s.smtpUser ?? "",
    smtpFrom: s.smtpFrom ?? "",
  };

  return <SetupWizard initial={initial} />;
}
