import QRCode from "qrcode";
import { buildPixPayload, normalizePixKey, type PixKeyType } from "./payload";

export { buildPixPayload, normalizePixKey };
export type { PixKeyType };

export interface GeneratePixInput {
  pixKey: string;
  pixKeyType: PixKeyType;
  merchantName: string;
  merchantCity: string;
  amount?: number;
  txid?: string;
}

export interface GeneratedPix {
  /** Código PIX "Copia e Cola". */
  brCode: string;
  /** Imagem do QR Code em data URL (PNG base64), pronta para <img src>. */
  qrCodeDataUrl: string;
}

/**
 * Gera o código PIX Copia e Cola e a imagem do QR Code correspondente,
 * 100% localmente (sem chamadas a serviços externos).
 */
export async function generatePix(
  input: GeneratePixInput
): Promise<GeneratedPix> {
  const normalizedKey = normalizePixKey(input.pixKey, input.pixKeyType);

  const brCode = buildPixPayload({
    pixKey: normalizedKey,
    merchantName: input.merchantName,
    merchantCity: input.merchantCity,
    amount: input.amount,
    txid: input.txid,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(brCode, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#2b2320", light: "#ffffff" },
  });

  return { brCode, qrCodeDataUrl };
}
