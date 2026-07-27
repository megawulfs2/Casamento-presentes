"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Providers from "@/components/Providers";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/admin/confirmacoes";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(form.get("email")),
      password: String(form.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) setError("E-mail ou senha inválidos");
    else router.push(callbackUrl);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-soft">
        <h1 className="text-center font-display text-3xl text-wine">
          Painel dos noivos
        </h1>
        <p className="mt-1 text-center text-sm text-stone">
          Acesse para confirmar os presentes.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            name="email"
            type="email"
            placeholder="E-mail"
            required
            className="w-full rounded-lg border border-gold/30 px-4 py-3 text-sm outline-none focus:border-wine"
          />
          <input
            name="password"
            type="password"
            placeholder="Senha"
            required
            className="w-full rounded-lg border border-gold/30 px-4 py-3 text-sm outline-none focus:border-wine"
          />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-wine px-6 py-3 text-sm text-ivory hover:bg-wineDark disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Providers>
      <Suspense>
        <LoginForm />
      </Suspense>
    </Providers>
  );
}
