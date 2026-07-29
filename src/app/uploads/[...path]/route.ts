import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { UPLOAD_ROOT, LEGACY_UPLOAD_ROOT } from "@/lib/upload";

/**
 * Serve os arquivos enviados pelo sistema (imagens de presentes, comprovantes e
 * imagens do site) nas MESMAS URLs de antes: /uploads/<pasta>/<arquivo>.
 *
 * Necessário porque o Next.js monta o índice da pasta `public/` uma única vez,
 * na inicialização do servidor: arquivos gravados em tempo de execução não
 * entram nesse índice e retornam 404 em produção. Como route handler, o arquivo
 * é lido do disco a cada requisição.
 */

export const dynamic = "force-dynamic";

const CONTENT_TYPE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

/** Resolve o caminho absoluto garantindo que ele permaneça dentro da raiz. */
function safeResolve(root: string, relative: string): string | null {
  const abs = path.resolve(root, relative);
  const base = path.resolve(root);
  if (abs !== base && !abs.startsWith(base + path.sep)) return null;
  return abs;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const relative = (segments ?? []).join("/");

  if (!relative) {
    return new NextResponse("Arquivo não encontrado", { status: 404 });
  }

  const ext = path.extname(relative).toLowerCase();
  const contentType = CONTENT_TYPE[ext];
  if (!contentType) {
    // Apenas os formatos aceitos pelo upload são servidos.
    return new NextResponse("Arquivo não encontrado", { status: 404 });
  }

  // Procura na raiz atual e, se não achar, no local anterior (public/uploads).
  for (const root of [UPLOAD_ROOT, LEGACY_UPLOAD_ROOT]) {
    const abs = safeResolve(root, relative);
    if (!abs) continue;
    try {
      const info = await stat(abs);
      if (!info.isFile()) continue;
      const bytes = await readFile(abs);
      return new NextResponse(new Uint8Array(bytes), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(info.size),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // tenta a próxima raiz
    }
  }

  return new NextResponse("Arquivo não encontrado", { status: 404 });
}
