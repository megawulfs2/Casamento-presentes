import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSetupComplete } from "@/lib/setup";
import { ToastProvider } from "@/components/Toast";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isSetupComplete())) redirect("/setup");
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const pendingCount = await prisma.confirmation.count({
    where: { status: "AGUARDANDO" },
  });

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-ivory">
        <aside className="border-b border-gold/20 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
            <span className="font-display text-xl text-wine">Painel</span>
            <nav className="flex flex-wrap gap-5 text-sm text-stone">
              <Link href="/admin" className="hover:text-wine">
                Dashboard
              </Link>
              <Link
                href="/admin/confirmacoes"
                className="inline-flex items-center gap-1.5 hover:text-wine"
              >
                Confirmações
                {pendingCount > 0 && (
                  <span
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-wine px-1.5 text-xs text-ivory"
                    aria-label={`${pendingCount} confirmações pendentes`}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
              <Link href="/admin/presentes" className="hover:text-wine">
                Presentes
              </Link>
              <Link href="/admin/configuracoes" className="hover:text-wine">
                Configurações
              </Link>
            </nav>
            <Link
              href="/api/auth/signout"
              className="ml-auto text-sm text-wine hover:underline"
            >
              Sair
            </Link>
          </div>
        </aside>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
          {children}
        </main>
        <SiteFooter area="admin" />
      </div>
    </ToastProvider>
  );
}
