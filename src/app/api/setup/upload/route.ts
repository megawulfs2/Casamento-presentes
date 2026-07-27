import { NextRequest, NextResponse } from "next/server";
import { assertSetupAccess } from "@/lib/setup";
import { saveUpload, IMAGE_MIME } from "@/lib/upload";

export async function POST(req: NextRequest) {
  try {
    await assertSetupAccess();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
  }
  const res = await saveUpload(file, "site", IMAGE_MIME);
  if (!res.ok || !res.file) {
    return NextResponse.json({ error: res.error ?? "Falha no upload" }, { status: 200 });
  }
  return NextResponse.json({ url: res.file.fileUrl });
}
