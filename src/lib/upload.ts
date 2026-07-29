import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/** Limites e tipos aceitos (compartilhados por imagens e comprovantes). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];
export const RECEIPT_MIME = ["image/jpeg", "image/png", "application/pdf"];

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/**
 * Diretório físico dos uploads.
 *
 * Fica FORA de `public/` porque o Next.js indexa `public/` apenas uma vez, na
 * inicialização do servidor: arquivos criados depois disso não são servidos
 * como estáticos (retornam 404 em produção). Os arquivos passam a ser servidos
 * pela route handler `/uploads/[...path]`, mantendo as mesmas URLs.
 *
 * Em produção (Railway), aponte um volume persistente para este caminho
 * (por padrão, `/app/uploads`) — ou defina UPLOAD_DIR.
 */
export const UPLOAD_ROOT =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

/** Local anterior dos arquivos — mantido apenas para ler uploads já existentes. */
export const LEGACY_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export interface SavedFile {
  fileUrl: string;
  fileName: string;
  mimeType: string;
}

export interface UploadResult {
  ok: boolean;
  file?: SavedFile;
  error?: string;
}

/**
 * Valida e grava um arquivo enviado em <UPLOAD_ROOT>/<folder>.
 * Retorna erro amigável em vez de lançar exceção.
 */
export async function saveUpload(
  file: File,
  folder: "gifts" | "receipts" | "site",
  allowed: string[],
  baseName?: string
): Promise<UploadResult> {
  if (!file || file.size === 0) return { ok: false, error: "Arquivo vazio" };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Arquivo maior que 5 MB" };
  }
  if (!allowed.includes(file.type)) {
    return { ok: false, error: "Formato não permitido" };
  }

  const dir = path.join(UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });

  const ext = EXT[file.type] ?? "bin";
  const name = `${baseName ?? randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), bytes);

  return {
    ok: true,
    file: {
      fileUrl: `/uploads/${folder}/${name}`,
      fileName: file.name,
      mimeType: file.type,
    },
  };
}

/** Remove um arquivo salvo a partir da sua URL pública (/uploads/...). */
export async function deleteUpload(fileUrl: string): Promise<void> {
  if (!fileUrl.startsWith("/uploads/")) return;
  const relative = fileUrl.replace(/^\/uploads\//, "");
  // Remove da raiz atual e também do local anterior (arquivos já existentes).
  for (const root of [UPLOAD_ROOT, LEGACY_UPLOAD_ROOT]) {
    try {
      await unlink(path.join(root, relative));
    } catch {
      // arquivo já ausente — ignora
    }
  }
}
