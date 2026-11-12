import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, Loading, MockNotice, PageHeader, SectionTabs } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { fetchCandidate, unwrap } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/candidato/github")({
  component: GithubPage,
});

type GithubProfile = {
  id: string;
  username: string;
  repos: number | null;
  stars: number | null;
  languages: Record<string, number> | null;
};

function GithubPage() {
  const { identity } = useAuth();
  const candidateId = identity?.id ?? "";
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");

  const candidate = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => fetchCandidate(candidateId),
    enabled: !!candidateId,
  });

  const profile = useQuery({
    queryKey: ["github", candidateId],
    queryFn: () =>
      unwrap(
        supabase.from("github_profiles").select("*").eq("candidate_id", candidateId).maybeSingle(),
      ) as Promise<GithubProfile | null>,
    enabled: !!candidateId,
  });

  const connect = useMutation({
    mutationFn: async () => {
      const handle = (username || candidate.data?.github_username || "").trim();
      if (!handle) throw new Error("Informe seu usuário do GitHub.");
      const languages = { TypeScript: 46, JavaScript: 28, SQL: 14, Outros: 12 };
      const { error } = await supabase.from("github_profiles").insert({
        candidate_id: candidateId,
        username: handle,
        repos: 18,
        stars: 74,
        languages,
        is_mock: true,
      });
      if (error) throw new Error(error.message);
      await supabase
        .from("candidates")
        .update({ github_username: handle })
        .eq("id", candidateId);
    },
    onSuccess: async () => {
      toast.success("GitHub conectado (demonstração).");
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      await supabase.from("github_profiles").delete().eq("candidate_id", candidateId);
      await supabase.from("candidates").update({ github_username: null }).eq("id", candidateId);
    },
    onSuccess: async () => {
      toast.success("GitHub desconectado.");
      await queryClient.invalidateQueries();
    },
  });

  if (profile.isLoading) return <Loading />;
  if (profile.isError) return <ErrorState message={profile.error.message} />;

  return (
    <>
      <PageHeader
        eyebrow="Evidências"
        title="Conecte seu GitHub."
        subtitle="Permita que a EloFlow encontre evidências das suas habilidades nos projetos que você desenvolveu."
      />
      <SectionTabs
        items={[
          { to: "/candidato/perfil", label: "Perfil" },
          { to: "/candidato/projetos", label: "Projetos" },
          { to: "/candidato/github", label: "GitHub" },
          { to: "/candidato/curriculo", label: "Currículo" },
        ]}
      />

      <MockNotice>
        Integração de demonstração: não há API do GitHub configurada neste MVP. Os dados abaixo são
        gerados localmente para demonstrar o fluxo.
      </MockNotice>

      {profile.data ? (
        <section className="surface-card space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Conectado como</p>
              <p className="text-display mt-1 text-xl">@{profile.data.username}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => disconnect.mutate()}>
              Desconectar
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-secondary/70 p-4">
              <p className="eyebrow">Repositórios</p>
              <p className="text-display mt-1 text-2xl text-primary">{profile.data.repos}</p>
            </div>
            <div className="rounded-lg bg-secondary/70 p-4">
              <p className="eyebrow">Stars</p>
              <p className="text-display mt-1 text-2xl text-primary">{profile.data.stars}</p>
            </div>
          </div>
          <div>
            <p className="eyebrow">Linguagens</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {Object.entries(profile.data.languages ?? {}).map(([lang, pct]) => (
                <li key={lang}>
                  • {lang} — {pct}%
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <section className="surface-card space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="github">Usuário do GitHub</Label>
            <Input
              id="github"
              placeholder="seu-usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <Button onClick={() => connect.mutate()} disabled={connect.isPending}>
            {connect.isPending ? "Conectando…" : "Conectar GitHub"}
          </Button>
        </section>
      )}
    </>
  );
}
