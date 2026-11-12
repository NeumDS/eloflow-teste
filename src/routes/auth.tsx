import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/eloflow/ui";
import { Logo } from "@/components/eloflow/Logo";
import { useAuth } from "@/hooks/useAuth";
import { ensureDemoAccount, type DemoRole } from "@/lib/demo.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    perfil: search["perfil"] === "empresa" ? ("empresa" as const) : ("candidato" as const),
  }),
  head: () => ({
    meta: [
      { title: "Entrar na EloFlow" },
      {
        name: "description",
        content: "Acesse sua área de candidato, empresa ou especialista na EloFlow.",
      },
      { property: "og:title", content: "Entrar na EloFlow" },
      { property: "og:description", content: "Encontre quem consegue fazer." },
    ],
  }),
  component: AuthPage,
});

type AreaPath = "/candidato" | "/empresa" | "/especialista";

const HOME: Record<string, AreaPath> = {
  candidato: "/candidato",
  empresa: "/empresa",
  especialista: "/especialista",
};

function AuthPage() {
  const perfil = Route.useSearch().perfil;
  const navigate = useNavigate();
  const { identity, refresh, session, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "cadastro">("login");
  const [role, setRole] = useState<"candidato" | "empresa">(perfil);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const finish = async () => {
    await refresh();
    const { data } = await supabase.auth.getUser();
    const userEmail = data.user?.email;
    if (!userEmail) return;
    const [candidate, company, specialist] = await Promise.all([
      supabase.from("candidates").select("id").eq("email", userEmail).maybeSingle(),
      supabase.from("companies").select("id").eq("email", userEmail).maybeSingle(),
      supabase.from("specialists").select("id").eq("email", userEmail).maybeSingle(),
    ]);
    const target: AreaPath | null = candidate.data
      ? "/candidato"
      : company.data
        ? "/empresa"
        : specialist.data
          ? "/especialista"
          : null;
    if (target) void navigate({ to: target });
    else toast.error("Não encontramos um perfil vinculado a este e-mail.");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy("form");
    try {
      if (mode === "cadastro") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name, role } },
        });
        if (error) throw error;
        if (role === "candidato") {
          const { error: insertError } = await supabase.from("candidates").insert({
            email,
            full_name: name,
            profile_completion: 25,
          });
          if (insertError && insertError.code !== "23505") throw insertError;
        } else {
          const { error: insertError } = await supabase.from("companies").insert({
            email,
            name,
          });
          if (insertError && insertError.code !== "23505") throw insertError;
        }
        await supabase.auth.signInWithPassword({ email, password });
        toast.success("Conta criada. Bem-vindo à EloFlow.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      await finish();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível continuar.");
    } finally {
      setBusy(null);
    }
  };

  const demoLogin = async (demoRole: DemoRole) => {
    setBusy(demoRole);
    try {
      const credentials = await ensureDemoAccount({ data: { role: demoRole } });
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      await finish();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao entrar na conta demo.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-light">
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}

if (session && identity) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-light px-5">
      <div className="surface-card w-full max-w-md p-6 text-center sm:p-8">
        <Logo size={48} />
        <h1 className="mt-6 text-2xl font-semibold">
          Você já está conectado!
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sua conta já está ativa. Volte ao menu principal para continuar.
        </p>
        <Button
  asChild
  className="mt-6 w-full"
>
  <Link to={HOME[identity.role] ?? "/candidato"}>
    Voltar ao menu
  </Link>
</Button>
      </div>
    </div>
  );
}

return (
  <div className="min-h-screen bg-sand-light">
    <div className="mx-auto grid min-h-screen w-full max-w-5xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <Link to="/">
          <Logo size={48} />
        </Link>

        <div className="mt-4">
          <BackButton to="/" label="Voltar" />
        </div>

        <h1 className="text-display mt-10 text-3xl sm:text-4xl">
          {mode === "login" ? "Bem-vindo de volta." : "Crie sua conta."}
        </h1>

        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          Entendemos o trabalho. Encontramos o talento. Você decide.
        </p>
      </div>

      <div className="surface-card p-6 sm:p-8">
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {(["login", "cadastro"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={
                mode === item
                  ? "flex-1 rounded-md bg-card px-3 py-2 text-sm font-medium text-primary shadow-sm"
                  : "flex-1 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {item === "login" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "cadastro" ? (
            <>
              <div className="flex gap-2">
                {(["candidato", "empresa"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    className={
                      role === item
                        ? "flex-1 rounded-lg border border-primary bg-accent px-3 py-2 text-sm font-medium text-primary"
                        : "flex-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/40"
                    }
                  >
                    {item === "candidato" ? "Sou candidato" : "Quero contratar"}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">
                  {role === "empresa" ? "Nome da empresa" : "Seu nome"}
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            </>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={busy !== null}
          >
            {busy === "form" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            {mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <div className="mt-7 border-t border-border pt-6">
          <p className="eyebrow">Contas demo</p>

          <div className="mt-3 grid gap-2">
            {(
              [
                ["candidato", "Entrar como candidato demo"],
                ["empresa", "Entrar como empresa demo"],
                ["especialista", "Entrar como especialista demo"],
              ] as [DemoRole, string][]
            ).map(([demoRole, label]) => (
              <Button
                key={demoRole}
                variant="outline"
                className="justify-start"
                disabled={busy !== null}
                onClick={() => void demoLogin(demoRole)}
              >
                {busy === demoRole ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {label}
              </Button>
            ))}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            As contas demo usam dados de demonstração e são compartilhadas.
          </p>
        </div>
      </div>
    </div>
  </div>
);
}
