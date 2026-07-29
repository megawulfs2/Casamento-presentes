import { prisma } from "@/lib/prisma";
import { Prisma, type Settings } from "@prisma/client";

/**
 * Valores padrão usados APENAS para leitura, quando o registro de configurações
 * ainda não existe (ex.: banco recém-criado, antes de concluir o assistente de
 * setup). A CRIAÇÃO do registro acontece somente no seed ou no fluxo de setup /
 * painel (ambos via upsert) — nunca durante a renderização de páginas/layouts.
 */
const DEFAULT_SETTINGS: Settings = {
  id: "singleton",
  coupleNames: "Maria Mercedez e Henrique",
  groomName: null,
  brideName: null,
  coupleStory: null,
  welcomeMsg: "Ficamos muito felizes em compartilhar este momento com você.",
  guestMessage: null,
  photoUrl: null,
  bannerUrl: null,
  logoUrl: null,
  eventDate: null,
  eventTime: null,
  venueName: null,
  address: null,
  mapsUrl: null,
  notifyEmail: null,
  themeName: "classico",
  primaryColor: "#6E2A3A",
  secondaryColor: "#B8945F",
  fontFamily: "Cormorant Garamond",
  buttonStyle: "pill",
  setupCompleted: false,
  pixKey: "",
  pixKeyType: "email",
  pixCity: "BRASILIA",
  defaultAmount: new Prisma.Decimal(0),
  smtpHost: null,
  smtpPort: null,
  smtpUser: null,
  smtpPass: null,
  smtpFrom: null,
  updatedAt: new Date(0),
};

/**
 * Lê as configurações (registro singleton). É SOMENTE LEITURA: não escreve no
 * banco, para não disparar acesso de escrita durante a renderização/build do
 * Next.js. Se o registro ainda não existir, devolve os padrões em memória.
 */
export async function getSettings(): Promise<Settings> {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });
  return settings ?? DEFAULT_SETTINGS;
}
