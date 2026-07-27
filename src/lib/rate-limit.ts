/**
 * Rate limit simples em memória (janela deslizante por chave).
 * Suficiente para uma única instância. Em ambientes serverless com múltiplas
 * instâncias, troque por Redis/Upstash — veja o README.
 */
const hits = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - timestamps[0])) / 1000);
    hits.set(key, timestamps);
    return { allowed: false, retryAfter };
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return { allowed: true, retryAfter: 0 };
}
