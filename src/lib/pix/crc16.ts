/**
 * CRC16-CCITT (FALSE) — polinômio 0x1021, valor inicial 0xFFFF.
 * É o algoritmo exigido pelo padrão PIX (Banco Central do Brasil) para o
 * campo "6304" do BR Code. Sem reflexão de bits e sem XOR final.
 *
 * Valor de verificação de referência: CRC de "123456789" = 0x29B1.
 */
export function crc16ccitt(payload: string): string {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}
