import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

/** Indica se a primeira configuração já foi concluída. */
export async function isSetupComplete(): Promise<boolean> {
  const s = await getSettings();
  return s.setupCompleted;
}

/**
 * Libera o acesso às rotas do assistente quando:
 *  - a configuração ainda NÃO foi concluída (primeiro uso), ou
 *  - existe um administrador autenticado (reexecução pelo painel).
 * Caso contrário, lança erro (bloqueia visitantes de reexecutar o setup).
 */
export async function assertSetupAccess(): Promise<void> {
  const s = await getSettings();
  if (!s.setupCompleted) return;
  const session = await getServerSession(authOptions);
  if (session) return;
  throw new Error("Configuração já concluída");
}
