import { crc16ccitt } from "./crc16";

/**
 * Monta o payload "Copia e Cola" do PIX seguindo o padrão BR Code (EMVCo),
 * inteiramente offline. Nenhuma API externa é usada — apenas a chave PIX
 * cadastrada pelos noivos.
 */

export type PixKeyType = "cpf" | "cnpj" | "email" | "telefone" | "aleatoria";

export interface PixPayloadInput {
  /** Chave PIX (CPF/CNPJ só dígitos, telefone com +55, e-mail, ou chave aleatória). */
  pixKey: string;
  /** Nome do recebedor (máx. 25 caracteres). */
  merchantName: string;
  /** Cidade do recebedor (máx. 15 caracteres). */
  merchantCity: string;
  /** Valor em reais. Opcional — se omitido, o pagador digita o valor. */
  amount?: number;
  /** Identificador da transação (txid). Máx. 25 caracteres alfanuméricos. */
  txid?: string;
}

/** Formata um campo EMV: ID (2) + tamanho (2) + valor. */
function field(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

/** Remove acentos e caracteres inválidos, e limita o tamanho. */
function sanitize(value: string, maxLength: number): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .toUpperCase()
    .slice(0, maxLength)
    .trim();
}

/** Normaliza a chave PIX de acordo com o tipo cadastrado. */
export function normalizePixKey(key: string, type: PixKeyType): string {
  const raw = key.trim();
  switch (type) {
    case "cpf":
    case "cnpj":
      return raw.replace(/\D/g, "");
    case "telefone": {
      const digits = raw.replace(/\D/g, "");
      return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
    }
    case "email":
      return raw.toLowerCase();
    case "aleatoria":
    default:
      return raw;
  }
}

export function buildPixPayload(input: PixPayloadInput): string {
  const { pixKey, merchantName, merchantCity, amount, txid } = input;

  // 26 — Merchant Account Information (GUI + chave)
  const gui = field("00", "br.gov.bcb.pix");
  const key = field("01", pixKey);
  const merchantAccountInfo = field("26", `${gui}${key}`);

  const payloadFormat = field("00", "01"); // versão do payload
  const merchantCategoryCode = field("52", "0000");
  const transactionCurrency = field("53", "986"); // BRL
  const countryCode = field("58", "BR");
  const name = field("59", sanitize(merchantName, 25) || "RECEBEDOR");
  const city = field("60", sanitize(merchantCity, 15) || "BRASIL");

  const transactionAmount =
    amount && amount > 0 ? field("54", amount.toFixed(2)) : "";

  // 62 — Additional Data Field (txid)
  const cleanTxid = (txid || "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25);
  const additionalData = field("62", field("05", cleanTxid || "***"));

  const partial =
    payloadFormat +
    merchantAccountInfo +
    merchantCategoryCode +
    transactionCurrency +
    transactionAmount +
    countryCode +
    name +
    city +
    additionalData +
    "6304"; // ID do CRC + tamanho fixo, antes de calcular

  const crc = crc16ccitt(partial);
  return partial + crc;
}
