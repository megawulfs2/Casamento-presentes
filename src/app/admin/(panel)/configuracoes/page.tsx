import { getSettings } from "@/lib/settings";
import { updateSettings } from "@/actions/settings";
import { redirect } from "next/navigation";
import PixValidator from "@/components/PixValidator";
import BackupPanel from "@/components/BackupPanel";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const s = await getSettings();
  const dateValue = s.eventDate
    ? new Date(s.eventDate).toISOString().slice(0, 16)
    : "";

  async function saveAction(formData: FormData) {
    "use server";
    const res = await updateSettings(formData);
    redirect(
      res.ok
        ? "/admin/configuracoes?saved=1"
        : "/admin/configuracoes?error=1"
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl text-wine">Configurações</h1>
      <p className="mt-2 text-sm text-stone">
        Tudo o que os noivos precisam ajustar fica aqui — sem editar código.
      </p>

      {sp.saved && (
        <p className="mt-4 rounded-lg bg-green-100 px-4 py-3 text-sm text-green-800">
          Configurações salvas com sucesso.
        </p>
      )}
      {sp.error && (
        <p className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800">
          Não foi possível salvar. Verifique os campos e tente novamente.
        </p>
      )}

      <form action={saveAction} className="mt-8 space-y-8">
        <Section title="Chave PIX">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tipo da chave">
              <select name="pixKeyType" defaultValue={s.pixKeyType} className="input">
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="telefone">Telefone</option>
                <option value="aleatoria">Chave aleatória</option>
              </select>
            </Field>
            <Field label="Cidade do recebedor">
              <input name="pixCity" defaultValue={s.pixCity} className="input" />
            </Field>
          </div>
          <Field label="Chave PIX">
            <input name="pixKey" defaultValue={s.pixKey} className="input" />
          </Field>
          <Field label="Valor padrão (opcional)">
            <input
              name="defaultAmount"
              type="number"
              step="0.01"
              defaultValue={Number(s.defaultAmount)}
              className="input"
            />
          </Field>
          <PixValidator
            pixKey={s.pixKey}
            pixKeyType={s.pixKeyType}
            pixCity={s.pixCity}
            merchantName={s.coupleNames}
          />
        </Section>

        <Section title="Os noivos">
          <Field label="Nome dos noivos">
            <input name="coupleNames" defaultValue={s.coupleNames} className="input" />
          </Field>
          <Field label="Mensagem de boas-vindas">
            <textarea name="welcomeMsg" defaultValue={s.welcomeMsg} rows={3} className="input" />
          </Field>
          <Field label="Foto do casal (URL)">
            <input name="photoUrl" defaultValue={s.photoUrl ?? ""} className="input" />
          </Field>
          <Field label="Logo (URL)">
            <input name="logoUrl" defaultValue={s.logoUrl ?? ""} className="input" />
          </Field>
        </Section>

        <Section title="Evento">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Data e hora">
              <input name="eventDate" type="datetime-local" defaultValue={dateValue} className="input" />
            </Field>
            <Field label="Horário (texto)">
              <input name="eventTime" defaultValue={s.eventTime ?? ""} className="input" />
            </Field>
          </div>
          <Field label="Local">
            <input name="venueName" defaultValue={s.venueName ?? ""} className="input" />
          </Field>
          <Field label="Endereço">
            <input name="address" defaultValue={s.address ?? ""} className="input" />
          </Field>
          <Field label="Google Maps (URL)">
            <input name="mapsUrl" defaultValue={s.mapsUrl ?? ""} className="input" />
          </Field>
        </Section>

        <Section title="E-mail (SMTP)">
          <p className="text-xs text-stone">
            Preencha para enviar e-mails de confirmação. Se deixar em branco, o
            sistema usa as variáveis de ambiente (.env).
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Servidor SMTP (host)">
              <input name="smtpHost" defaultValue={s.smtpHost ?? ""} placeholder="smtp.gmail.com" className="input" />
            </Field>
            <Field label="Porta">
              <input name="smtpPort" type="number" defaultValue={s.smtpPort ?? ""} placeholder="587" className="input" />
            </Field>
          </div>
          <Field label="Usuário SMTP">
            <input name="smtpUser" defaultValue={s.smtpUser ?? ""} className="input" />
          </Field>
          <Field label="Senha SMTP">
            <input name="smtpPass" type="password" defaultValue={s.smtpPass ?? ""} className="input" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Remetente (From)">
              <input name="smtpFrom" defaultValue={s.smtpFrom ?? ""} placeholder="Noivos <noivos@exemplo.com>" className="input" />
            </Field>
            <Field label="E-mail para notificações">
              <input name="notifyEmail" defaultValue={s.notifyEmail ?? ""} className="input" />
            </Field>
          </div>
        </Section>

        <button
          type="submit"
          className="rounded-full bg-wine px-8 py-3 text-sm text-ivory hover:bg-wineDark"
        >
          Salvar configurações
        </button>
      </form>

      <div className="mt-10">
        <Section title="Backup e recuperação">
          <p className="text-xs text-stone">
            Exporte todos os dados (presentes, categorias, confirmações e
            configurações) em JSON, ou importe um backup anterior.
          </p>
          <BackupPanel />
        </Section>
      </div>

      <div className="mt-8">
        <Section title="Assistente de configuração">
          <p className="text-xs text-stone">
            Reabra o assistente para revisar todas as configurações passo a passo.
            Os dados já salvos serão carregados automaticamente.
          </p>
          <a
            href="/setup"
            className="inline-block rounded-full bg-wine px-5 py-2.5 text-sm text-ivory hover:bg-wineDark"
          >
            Executar assistente novamente
          </a>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl bg-white p-6 shadow-soft">
      <legend className="px-2 font-display text-xl text-wine">{title}</legend>
      <div className="mt-2 space-y-3">{children}</div>
    </fieldset>
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
