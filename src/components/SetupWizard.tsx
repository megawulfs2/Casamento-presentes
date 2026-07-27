"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { THEMES, FONT_OPTIONS, BUTTON_STYLES, buttonRadius } from "@/lib/themes";

/* ---------- tipos ---------- */
export interface WizardInitial {
  groomName: string;
  brideName: string;
  coupleStory: string;
  welcomeMsg: string;
  photoUrl: string;
  guestMessage: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  address: string;
  mapsUrl: string;
  themeName: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  buttonStyle: string;
  bannerUrl: string;
  pixKeyType: string;
  pixKey: string;
  pixCity: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpFrom: string;
}

type Data = WizardInitial & {
  smtpPass: string;
  merchantName: string;
  emailLater: boolean;
  emailVerified: boolean;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  adminPasswordConfirm: string;
};

interface HealthCheck {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
  optional?: boolean;
}

const STEPS = [
  "Bem-vindo",
  "Noivos",
  "Casamento",
  "Aparência",
  "PIX",
  "E-mail",
  "Administrador",
  "Testes",
  "Conclusão",
];

export default function SetupWizard({ initial }: { initial: WizardInitial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const [data, setData] = useState<Data>({
    ...initial,
    smtpPass: "",
    merchantName:
      initial.groomName && initial.brideName
        ? `${initial.groomName} e ${initial.brideName}`
        : "",
    emailLater: false,
    emailVerified: false,
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    adminPasswordConfirm: "",
  });

  const set = <K extends keyof Data>(k: K, v: Data[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  /* ---------- validação por etapa ---------- */
  function validate(): string | null {
    if (step === 1) {
      if (!data.groomName.trim() || !data.brideName.trim())
        return "Informe o nome do noivo e da noiva.";
    }
    if (step === 4) {
      if (!data.pixKey.trim()) return "Informe a chave PIX.";
    }
    if (step === 5) {
      if (data.smtpHost.trim() && !data.emailLater && !data.emailVerified)
        return "Envie um e-mail de teste com sucesso ou marque \"configurar depois\".";
    }
    if (step === 6) {
      if (!data.adminName.trim()) return "Informe o nome do administrador.";
      if (!data.adminEmail.includes("@")) return "Informe um e-mail válido.";
      if (data.adminPassword.length < 8)
        return "A senha deve ter ao menos 8 caracteres.";
      if (data.adminPassword !== data.adminPasswordConfirm)
        return "As senhas não coincidem.";
    }
    return null;
  }

  async function next() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);

    // Etapa Administrador: cria a conta e autentica antes de avançar
    if (step === 6) {
      const res = await fetch("/api/setup/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.adminName,
          email: data.adminEmail,
          password: data.adminPassword,
        }),
      }).then((r) => r.json());
      if (!res.ok) {
        setError(res.error ?? "Não foi possível criar o administrador.");
        return;
      }
      await signIn("credentials", {
        email: data.adminEmail.toLowerCase(),
        password: data.adminPassword,
        redirect: false,
      });
    }

    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function goTo(target: number) {
    setError(null);
    setStep(target);
  }

  const progress = (step / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-ivory px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Barra de progresso */}
        <div className="mb-2 flex items-center justify-between text-xs text-stone">
          <span>
            Etapa {step + 1} de {STEPS.length}
          </span>
          <span>{STEPS[step]}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-blush">
          <motion.div
            className="h-full rounded-full bg-wine"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
        <ol className="mt-3 hidden flex-wrap gap-1.5 text-[11px] text-stone sm:flex">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={`rounded-full px-2.5 py-0.5 ${
                i === step
                  ? "bg-wine text-ivory"
                  : i < step
                    ? "bg-blush text-wine"
                    : "bg-white text-stone"
              }`}
            >
              {i + 1}. {s}
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-2xl bg-white p-7 shadow-soft">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && <Welcome names={initial} />}
              {step === 1 && <StepCouple data={data} set={set} />}
              {step === 2 && <StepWedding data={data} set={set} />}
              {step === 3 && <StepAppearance data={data} set={set} />}
              {step === 4 && <StepPix data={data} set={set} />}
              {step === 5 && <StepEmail data={data} set={set} />}
              {step === 6 && <StepAdmin data={data} set={set} />}
              {step === 7 && <StepTests data={data} onFix={goTo} />}
              {step === 8 && (
                <StepFinish data={data} pending={pending} completed={completed} onFinish={finish} />
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <p className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          {/* Navegação */}
          {step < 8 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={back}
                disabled={step === 0}
                className="rounded-full border border-gold/40 px-5 py-2.5 text-sm text-stone hover:bg-blush/30 disabled:opacity-40"
              >
                Voltar
              </button>
              <button
                onClick={next}
                className="rounded-full bg-wine px-6 py-2.5 text-sm text-ivory hover:bg-wineDark"
              >
                {step === 0 ? "Iniciar configuração" : "Avançar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ---------- finalização ---------- */
  function finish() {
    startTransition(async () => {
      const res = await fetch("/api/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json());
      if (res.ok) {
        setError(null);
        setCompleted(true);
        router.refresh();
      } else {
        setError(res.error ?? "Não foi possível concluir. Verifique os testes.");
      }
    });
  }
}

/* ================= ETAPAS ================= */

function Welcome({ names }: { names: WizardInitial }) {
  return (
    <div className="text-center">
      <p className="text-5xl">💍</p>
      <h1 className="mt-3 font-display text-3xl text-wine">
        Bem-vindo(a) à configuração
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink">
        Vamos preparar o seu site de lista de casamento com pagamento por PIX.
        É rápido: em poucos minutos você define os dados dos noivos, o evento, a
        aparência, a chave PIX, o e-mail e a conta de administrador.
      </p>
      {names.groomName && (
        <p className="mt-4 text-xs text-stone">
          Já há dados salvos — você pode revisá-los e ajustá-los.
        </p>
      )}
    </div>
  );
}

interface StepProps {
  data: Data;
  set: <K extends keyof Data>(k: K, v: Data[K]) => void;
}

function StepCouple({ data, set }: StepProps) {
  return (
    <div className="space-y-4">
      <H title="Dados dos noivos" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome do noivo">
          <input className="input" value={data.groomName} onChange={(e) => set("groomName", e.target.value)} />
        </Field>
        <Field label="Nome da noiva">
          <input className="input" value={data.brideName} onChange={(e) => set("brideName", e.target.value)} />
        </Field>
      </div>
      <Field label="Mensagem de boas-vindas">
        <textarea className="input" rows={2} value={data.welcomeMsg} onChange={(e) => set("welcomeMsg", e.target.value)} />
      </Field>
      <Field label="História do casal (opcional)">
        <textarea className="input" rows={3} value={data.coupleStory} onChange={(e) => set("coupleStory", e.target.value)} />
      </Field>
      <Uploader label="Foto do casal" value={data.photoUrl} onUploaded={(url) => set("photoUrl", url)} />
      {data.photoUrl && (
        <div>
          <p className="mb-1 text-xs text-stone">Prévia:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.photoUrl} alt="Prévia da foto do casal" className="h-40 w-full rounded-lg object-cover" />
        </div>
      )}
    </div>
  );
}

function StepWedding({ data, set }: StepProps) {
  return (
    <div className="space-y-4">
      <H title="O casamento" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Data e hora">
          <input type="datetime-local" className="input" value={data.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
        </Field>
        <Field label="Horário (texto)">
          <input className="input" placeholder="16h" value={data.eventTime} onChange={(e) => set("eventTime", e.target.value)} />
        </Field>
      </div>
      <Field label="Nome do local">
        <input className="input" value={data.venueName} onChange={(e) => set("venueName", e.target.value)} />
      </Field>
      <Field label="Endereço">
        <input className="input" value={data.address} onChange={(e) => set("address", e.target.value)} />
      </Field>
      <Field label="Link do Google Maps">
        <input className="input" placeholder="https://maps.google.com/…" value={data.mapsUrl} onChange={(e) => set("mapsUrl", e.target.value)} />
      </Field>
      <Field label="Mensagem para os convidados">
        <textarea className="input" rows={2} value={data.guestMessage} onChange={(e) => set("guestMessage", e.target.value)} />
      </Field>

      <div className="rounded-lg border border-gold/30 bg-blush/20 p-4">
        <p className="mb-1 text-xs text-stone">Prévia da página inicial:</p>
        <p className="font-display text-2xl text-wine">
          {data.groomName || "Noivo"} &amp; {data.brideName || "Noiva"}
        </p>
        <p className="text-sm text-ink">
          {data.venueName || "Local"} · {data.eventTime || "horário"}
        </p>
        {data.address && <p className="text-xs text-stone">{data.address}</p>}
      </div>
    </div>
  );
}

function StepAppearance({ data, set }: StepProps) {
  function applyTheme(id: string) {
    const t = THEMES.find((x) => x.id === id);
    if (!t) return;
    set("themeName", t.id);
    set("primaryColor", t.primaryColor);
    set("secondaryColor", t.secondaryColor);
    set("fontFamily", t.fontFamily);
  }
  return (
    <div className="space-y-4">
      <H title="Aparência do site" />
      <Field label="Tema">
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTheme(t.id)}
              className={`rounded-full px-4 py-2 text-xs ${
                data.themeName === t.id ? "bg-wine text-ivory" : "border border-gold/40 text-wine"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Cor principal">
          <input type="color" className="h-10 w-full rounded" value={data.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} />
        </Field>
        <Field label="Cor secundária">
          <input type="color" className="h-10 w-full rounded" value={data.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Fonte">
          <select className="input" value={data.fontFamily} onChange={(e) => set("fontFamily", e.target.value)}>
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </Field>
        <Field label="Estilo dos botões">
          <select className="input" value={data.buttonStyle} onChange={(e) => set("buttonStyle", e.target.value)}>
            {BUTTON_STYLES.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <Uploader label="Banner principal (opcional)" value={data.bannerUrl} onUploaded={(url) => set("bannerUrl", url)} />

      {/* Prévia em tempo real */}
      <div className="overflow-hidden rounded-xl border border-gold/30">
        <div
          className="flex h-32 items-center justify-center bg-cover bg-center"
          style={{
            background: data.bannerUrl
              ? `center/cover url(${data.bannerUrl})`
              : data.primaryColor,
          }}
        >
          <span
            className="rounded bg-black/30 px-3 py-1 text-lg text-white"
            style={{ fontFamily: `'${data.fontFamily}', serif` }}
          >
            {data.groomName || "Noivo"} &amp; {data.brideName || "Noiva"}
          </span>
        </div>
        <div className="flex items-center gap-3 bg-white p-4">
          <button
            type="button"
            style={{ background: data.primaryColor, borderRadius: buttonRadius(data.buttonStyle) }}
            className="px-4 py-2 text-sm text-white"
          >
            Escolher presente
          </button>
          <span style={{ color: data.secondaryColor }} className="text-sm">
            Cor de destaque
          </span>
        </div>
      </div>
    </div>
  );
}

function StepPix({ data, set }: StepProps) {
  const [result, setResult] = useState<{ valid: boolean; brCode?: string; qrCodeDataUrl?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function test() {
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/setup/pix-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pixKey: data.pixKey,
          pixKeyType: data.pixKeyType,
          pixCity: data.pixCity,
          merchantName: data.merchantName,
        }),
      });
      setResult(await r.json());
    } catch {
      setResult({ valid: false, error: "Não foi possível testar agora." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <H title="Chave PIX" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo da chave">
          <select className="input" value={data.pixKeyType} onChange={(e) => set("pixKeyType", e.target.value)}>
            <option value="cpf">CPF</option>
            <option value="cnpj">CNPJ</option>
            <option value="email">E-mail</option>
            <option value="telefone">Telefone</option>
            <option value="aleatoria">Chave aleatória</option>
          </select>
        </Field>
        <Field label="Cidade do recebedor">
          <input className="input" value={data.pixCity} onChange={(e) => set("pixCity", e.target.value)} />
        </Field>
      </div>
      <Field label="Chave PIX">
        <input className="input" value={data.pixKey} onChange={(e) => set("pixKey", e.target.value)} />
      </Field>
      <Field label="Nome do recebedor">
        <input className="input" value={data.merchantName} onChange={(e) => set("merchantName", e.target.value)} />
      </Field>

      <button
        type="button"
        onClick={test}
        disabled={loading || !data.pixKey}
        className="rounded-full bg-wine px-5 py-2.5 text-sm text-ivory hover:bg-wineDark disabled:opacity-60"
      >
        {loading ? "Testando…" : "Testar configuração"}
      </button>

      {result?.valid && result.qrCodeDataUrl && (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-blush/30 p-4 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.qrCodeDataUrl} alt="QR Code de teste" className="h-36 w-36 rounded" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-green-700">✔ Configuração válida</p>
            <p className="mb-1 mt-2 text-xs text-stone">PIX Copia e Cola:</p>
            <code className="block max-h-20 overflow-y-auto break-all rounded bg-white p-2 text-[11px]">{result.brCode}</code>
          </div>
        </div>
      )}
      {result && !result.valid && (
        <p className="text-sm text-red-700">{result.error ?? "Configuração inválida."}</p>
      )}
    </div>
  );
}

function StepEmail({ data, set }: StepProps) {
  const [status, setStatus] = useState<{ ok?: boolean; msg?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function testEmail() {
    setLoading(true);
    setStatus(null);
    try {
      const r = await fetch("/api/setup/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost: data.smtpHost,
          smtpPort: data.smtpPort,
          smtpUser: data.smtpUser,
          smtpPass: data.smtpPass,
          smtpFrom: data.smtpFrom,
          to: data.smtpUser,
        }),
      }).then((res) => res.json());
      setStatus({ ok: r.ok, msg: r.ok ? "E-mail de teste enviado! Verifique a caixa de entrada." : r.error });
      if (r.ok) set("emailVerified", true);
    } catch {
      setStatus({ ok: false, msg: "Falha ao enviar." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <H title="E-mail (SMTP)" />
      <p className="text-xs text-stone">
        Usado para enviar confirmações. Você pode configurar depois pelo painel.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Servidor SMTP">
          <input className="input" placeholder="smtp.gmail.com" value={data.smtpHost} onChange={(e) => set("smtpHost", e.target.value)} />
        </Field>
        <Field label="Porta">
          <input className="input" placeholder="587" value={data.smtpPort} onChange={(e) => set("smtpPort", e.target.value)} />
        </Field>
      </div>
      <Field label="Usuário">
        <input className="input" value={data.smtpUser} onChange={(e) => set("smtpUser", e.target.value)} />
      </Field>
      <Field label="Senha">
        <input type="password" className="input" value={data.smtpPass} onChange={(e) => set("smtpPass", e.target.value)} />
      </Field>
      <Field label="Remetente (From)">
        <input className="input" placeholder="Noivos <noivos@exemplo.com>" value={data.smtpFrom} onChange={(e) => set("smtpFrom", e.target.value)} />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={testEmail}
          disabled={loading || !data.smtpHost}
          className="rounded-full bg-wine px-5 py-2.5 text-sm text-ivory hover:bg-wineDark disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Enviar e-mail de teste"}
        </button>
        <label className="flex items-center gap-2 text-xs text-stone">
          <input type="checkbox" checked={data.emailLater} onChange={(e) => set("emailLater", e.target.checked)} className="accent-wine" />
          Configurar depois
        </label>
      </div>
      {status && (
        <p className={`text-sm ${status.ok ? "text-green-700" : "text-red-700"}`}>{status.msg}</p>
      )}
    </div>
  );
}

function StepAdmin({ data, set }: StepProps) {
  const strong = data.adminPassword.length >= 8;
  const match = data.adminPassword === data.adminPasswordConfirm && data.adminPasswordConfirm.length > 0;
  return (
    <div className="space-y-4">
      <H title="Conta do administrador" />
      <p className="text-xs text-stone">
        Com esta conta os noivos acessam o painel para confirmar presentes.
      </p>
      <Field label="Nome">
        <input className="input" value={data.adminName} onChange={(e) => set("adminName", e.target.value)} />
      </Field>
      <Field label="E-mail">
        <input type="email" className="input" value={data.adminEmail} onChange={(e) => set("adminEmail", e.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Senha (mín. 8 caracteres)">
          <input type="password" className="input" value={data.adminPassword} onChange={(e) => set("adminPassword", e.target.value)} />
        </Field>
        <Field label="Confirmar senha">
          <input type="password" className="input" value={data.adminPasswordConfirm} onChange={(e) => set("adminPasswordConfirm", e.target.value)} />
        </Field>
      </div>
      <div className="text-xs">
        <p className={strong ? "text-green-700" : "text-stone"}>• Pelo menos 8 caracteres {strong ? "✔" : ""}</p>
        <p className={match ? "text-green-700" : "text-stone"}>• Senhas coincidem {match ? "✔" : ""}</p>
      </div>
    </div>
  );
}

function StepTests({ data, onFix }: { data: Data; onFix: (n: number) => void }) {
  const [checks, setChecks] = useState<HealthCheck[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const r = await fetch("/api/setup/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pix: { pixKey: data.pixKey, pixKeyType: data.pixKeyType, pixCity: data.pixCity, merchantName: data.merchantName },
          smtp: { smtpHost: data.smtpHost, smtpPort: data.smtpPort, smtpUser: data.smtpUser, smtpPass: data.smtpPass },
        }),
      }).then((res) => res.json());
      setChecks(r.checks ?? []);
    } catch {
      setChecks([{ key: "err", label: "Sistema", ok: false, detail: "Falha ao executar os testes." }]);
    } finally {
      setLoading(false);
    }
  }

  const fixStep: Record<string, number> = { pix: 4, smtp: 5, auth: 6 };

  return (
    <div className="space-y-4">
      <H title="Testes automáticos" />
      <p className="text-xs text-stone">
        Verificamos se tudo está pronto antes de publicar o site.
      </p>
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="rounded-full bg-wine px-5 py-2.5 text-sm text-ivory hover:bg-wineDark disabled:opacity-60"
      >
        {loading ? "Executando…" : checks ? "Executar novamente" : "Executar testes"}
      </button>

      {checks && (
        <ul className="space-y-2">
          {checks.map((c) => (
            <li key={c.key} className="flex items-start justify-between gap-3 rounded-lg border border-blush p-3 text-sm">
              <div>
                <p className={c.ok ? "text-green-700" : c.optional ? "text-stone" : "text-red-700"}>
                  {c.ok ? "✓" : c.optional ? "○" : "✕"} {c.label}
                </p>
                <p className="text-xs text-stone">{c.detail}</p>
              </div>
              {!c.ok && !c.optional && c.key in fixStep && (
                <button
                  type="button"
                  onClick={() => onFix(fixStep[c.key])}
                  className="shrink-0 rounded-full border border-gold/40 px-3 py-1 text-xs text-wine hover:bg-blush/40"
                >
                  Corrigir
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-stone">
        Itens marcados com ○ são opcionais (ex.: e-mail) e não impedem a conclusão.
      </p>
    </div>
  );
}

function StepFinish({
  data,
  pending,
  completed,
  onFinish,
}: {
  data: Data;
  pending: boolean;
  completed: boolean;
  onFinish: () => void;
}) {
  return (
    <div id="setup-done" className="text-center">
      {!completed ? (
        <>
          <H title="Tudo pronto para concluir" center />
          <div className="mt-3 space-y-1 rounded-lg bg-blush/30 p-4 text-left text-sm">
            <Summary label="Noivos" value={`${data.groomName} e ${data.brideName}`} />
            <Summary label="Local" value={data.venueName || "—"} />
            <Summary label="Tema" value={data.themeName} />
            <Summary label="Chave PIX" value={data.pixKey || "—"} />
            <Summary label="E-mail (SMTP)" value={data.smtpHost || "a configurar depois"} />
            <Summary label="Administrador" value={data.adminEmail} />
          </div>
          <button
            onClick={onFinish}
            disabled={pending}
            className="mt-6 rounded-full bg-wine px-8 py-3 text-sm text-ivory hover:bg-wineDark disabled:opacity-60"
          >
            {pending ? "Concluindo…" : "Concluir configuração"}
          </button>
        </>
      ) : (
        <>
          <p className="text-5xl">🎉</p>
          <h1 className="mt-3 font-display text-3xl text-wine">Seu site está pronto!</h1>
          <p className="mt-2 text-sm text-ink">
            As configurações foram salvas. Você já pode acessar o painel ou ver o site.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="/admin" className="rounded-full bg-wine px-6 py-3 text-sm text-ivory hover:bg-wineDark">
              Acessar painel administrativo
            </a>
            <a href="/" className="rounded-full border border-gold/40 px-6 py-3 text-sm text-wine hover:bg-blush/40">
              Visualizar meu site
            </a>
          </div>
        </>
      )}
    </div>
  );
}

/* ================= AUXILIARES ================= */

function H({ title, center }: { title: string; center?: boolean }) {
  return (
    <h2 className={`font-display text-2xl text-wine ${center ? "text-center" : ""}`}>{title}</h2>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-stone">{label}</span>
      {children}
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-4">
      <span className="text-stone">{label}</span>
      <span className="text-right text-ink">{value}</span>
    </p>
  );
}

function Uploader({
  label,
  value,
  onUploaded,
}: {
  label: string;
  value: string;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/setup/upload", { method: "POST", body: fd }).then((res) => res.json());
      if (r.url) onUploaded(r.url);
      else setErr(r.error ?? "Falha no upload.");
    } catch {
      setErr("Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field label={label}>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handle}
        className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-blush file:px-4 file:py-2 file:text-wine"
      />
      {uploading && <p className="mt-1 text-xs text-stone">Enviando…</p>}
      {value && !uploading && <p className="mt-1 text-xs text-green-700">Imagem enviada ✔</p>}
      {err && <p className="mt-1 text-xs text-red-700">{err}</p>}
    </Field>
  );
}
