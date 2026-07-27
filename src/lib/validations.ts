import { z } from "zod";

export const confirmationSchema = z.object({
  giftId: z.string().min(1),
  guestName: z.string().min(2, "Informe seu nome"),
  guestEmail: z.string().email("E-mail inválido"),
  guestWhatsapp: z.string().optional().or(z.literal("")),
  message: z.string().max(600).optional().or(z.literal("")),
  amount: z.coerce.number().positive("Valor inválido"),
  paymentConfirmed: z.literal(true, {
    errorMap: () => ({ message: "Confirme que realizou o pagamento" }),
  }),
});

export type ConfirmationInput = z.infer<typeof confirmationSchema>;

export const giftSchema = z.object({
  name: z.string().min(2, "Informe o nome do presente"),
  description: z.string().max(1000).optional().or(z.literal("")),
  imageUrl: z.string().url("URL de imagem inválida").optional().or(z.literal("")),
  price: z.coerce.number().positive("Valor deve ser maior que zero"),
  desiredQty: z.coerce.number().int().min(1, "Quantidade mínima é 1"),
  categoryId: z.string().optional().or(z.literal("")),
  active: z.coerce.boolean().optional(),
});

export type GiftInput = z.infer<typeof giftSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, "Informe o nome da categoria"),
});

export const pixKeyTypeSchema = z.enum([
  "cpf",
  "cnpj",
  "email",
  "telefone",
  "aleatoria",
]);

export const pixValidateSchema = z.object({
  pixKey: z.string().min(1, "Informe a chave PIX"),
  pixKeyType: pixKeyTypeSchema,
  pixCity: z.string().optional().or(z.literal("")),
  merchantName: z.string().optional().or(z.literal("")),
});

export const settingsSchema = z.object({
  coupleNames: z.string().min(2),
  welcomeMsg: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  eventDate: z.string().optional().or(z.literal("")),
  eventTime: z.string().optional().or(z.literal("")),
  venueName: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  mapsUrl: z.string().url().optional().or(z.literal("")),
  notifyEmail: z.string().email().optional().or(z.literal("")),
  pixKey: z.string().optional().or(z.literal("")),
  pixKeyType: pixKeyTypeSchema,
  pixCity: z.string().optional().or(z.literal("")),
  defaultAmount: z.coerce.number().min(0).optional(),
  smtpHost: z.string().optional().or(z.literal("")),
  smtpPort: z.coerce.number().int().positive().optional().or(z.literal("")),
  smtpUser: z.string().optional().or(z.literal("")),
  smtpPass: z.string().optional().or(z.literal("")),
  smtpFrom: z.string().optional().or(z.literal("")),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
