import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, Loading, PageHeader, Progress, SectionTabs } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { fetchCandidate, fetchCandidateProjects } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/candidato/perfil")({
  component: CandidateProfile,
});

function completion(input: {
  headline?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  education?: string | null;
  portfolio_url?: string | null;
  github_username?: string | null | undefined;
  resume_name?: string | null | undefined;
  projects: number;
}) {
  const checks = [
    !!input.headline,
    !!input.bio,
    (input.skills ?? []).length > 0,
    !!input.education,
    !!input.portfolio_url,
    !!input.github_username,
    !!input.resume_name,
    input.projects > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function PendingLabel({
  htmlFor,
  children,
  pending,
}: {
  htmlFor: string;
  children: React.ReactNode;
  pending: boolean;
}) {
  return (
    <Label htmlFor={htmlFor} className={cn(pending && "text-destructive")}>
      {children}
      {pending ? <span className="ml-1.5 text-xs font-normal">· pendente</span> : null}
    </Label>
  );
}

function CandidateProfile() {
  const { identity } = useAuth();
  const candidateId = identity?.id ?? "";
  const queryClient = useQueryClient();

  const candidate = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => fetchCandidate(candidateId),
    enabled: !!candidateId,
  });
  const projects = useQuery({
    queryKey: ["projects", candidateId],
    queryFn: () => fetchCandidateProjects(candidateId),
    enabled: !!candidateId,
  });

  const [form, setForm] = useState({
    headline: "",
    location: "",
    seniority: "",
    bio: "",
    skills: "",
    education: "",
    portfolio_url: "",
  });

  useEffect(() => {
    if (candidate.data) {
      setForm({
        headline: candidate.data.headline ?? "",
        location: candidate.data.location ?? "",
        seniority: candidate.data.seniority ?? "",
        bio: candidate.data.bio ?? "",
        skills: (candidate.data.skills ?? []).join(", "),
        education: candidate.data.education ?? "",
        portfolio_url: candidate.data.portfolio_url ?? "",
      });
    }
  }, [candidate.data]);

  const autoApply =
    (candidate.data as { auto_apply?: boolean } | undefined)?.auto_apply ?? false;

  const toggleAutoApply = useMutation({
    mutationFn: async (value: boolean) => {
      const { error } = await supabase
        .from("candidates")
        .update({ auto_apply: value })
        .eq("id", candidateId);
      if (error) throw new Error(error.message);
      return value;
    },
    onSuccess: async (value) => {
      toast.success(
        value
          ? "Candidatura automática ativada para vagas acima de 90%."
          : "Candidatura automática desativada.",
      );
      await queryClient.invalidateQueries({ queryKey: ["candidate", candidateId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const save = useMutation({
    mutationFn: async () => {
      const skills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const profile_completion = completion({
        headline: form.headline,
        bio: form.bio,
        skills,
        education: form.education,
        portfolio_url: form.portfolio_url,
        github_username: candidate.data?.github_username,
        resume_name: candidate.data?.resume_name,
        projects: (projects.data ?? []).length,
      });
      const { error } = await supabase
        .from("candidates")
        .update({ ...form, skills, profile_completion })
        .eq("id", candidateId);
      if (error) throw new Error(error.message);
      return profile_completion;
    },
    onSuccess: async (value) => {
      toast.success(`Perfil salvo — ${value}% completo.`);
      await queryClient.invalidateQueries({ queryKey: ["candidate", candidateId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (candidate.isLoading) return <Loading />;
  if (candidate.isError) return <ErrorState message={candidate.error.message} />;

  return (
    <>
      <PageHeader
        eyebrow="Meu perfil"
        title="Seu perfil"
        subtitle="Mostre o que você sabe fazer."
        action={
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Salvando…" : "Completar perfil"}
          </Button>
        }
      />
      <SectionTabs
        items={[
          { to: "/candidato/perfil", label: "Perfil" },
          { to: "/candidato/projetos", label: "Projetos" },
          { to: "/candidato/github", label: "GitHub" },
          { to: "/candidato/curriculo", label: "Currículo" },
        ]}
      />

      <div className="surface-card p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium">
            Perfil {candidate.data?.profile_completion ?? 0}% completo
          </p>
          <p className="text-xs text-muted-foreground">
            {(projects.data ?? []).length} projeto(s) cadastrado(s)
          </p>
        </div>
        <Progress value={candidate.data?.profile_completion ?? 0} className="mt-3" />
      </div>

      <section className="surface-card space-y-4 p-6">
        <p className="eyebrow">Experiência</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <PendingLabel htmlFor="headline" pending={!form.headline.trim()}>
              Título profissional
            </PendingLabel>
            <Input
              id="headline"
              className={cn(!form.headline.trim() && "border-destructive")}
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <PendingLabel htmlFor="seniority" pending={!form.seniority.trim()}>
              Senioridade
            </PendingLabel>
            <Input
              id="seniority"
              className={cn(!form.seniority.trim() && "border-destructive")}
              placeholder="Júnior, Pleno, Sênior"
              value={form.seniority}
              onChange={(e) => setForm({ ...form, seniority: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <PendingLabel htmlFor="location" pending={!form.location.trim()}>
              Localização
            </PendingLabel>
            <Input
              id="location"
              className={cn(!form.location.trim() && "border-destructive")}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <PendingLabel htmlFor="education" pending={!form.education.trim()}>
              Formação
            </PendingLabel>
            <Input
              id="education"
              className={cn(!form.education.trim() && "border-destructive")}
              value={form.education}
              onChange={(e) => setForm({ ...form, education: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <PendingLabel htmlFor="bio" pending={!form.bio.trim()}>
            Resumo
          </PendingLabel>
          <Textarea
            id="bio"
            rows={4}
            className={cn(!form.bio.trim() && "border-destructive")}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>
      </section>

      <section className="surface-card space-y-4 p-6">
        <p className="eyebrow">Habilidades</p>
        <div className="space-y-1.5">
          <PendingLabel htmlFor="skills" pending={!form.skills.trim()}>
            Separe por vírgula
          </PendingLabel>
          <Input
            id="skills"
            className={cn(!form.skills.trim() && "border-destructive")}
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(candidate.data?.skills ?? []).map((skill) => (
            <span key={skill} className="rounded-full bg-secondary px-3 py-1 text-xs">
              {skill}
            </span>
          ))}
        </div>
      </section>

      <section className="surface-card space-y-4 p-6">
        <p className="eyebrow">Portfólio</p>
        <div className="space-y-1.5">
          <PendingLabel htmlFor="portfolio" pending={!form.portfolio_url.trim()}>
            Link do portfólio
          </PendingLabel>
          <Input
            id="portfolio"
            className={cn(!form.portfolio_url.trim() && "border-destructive")}
            placeholder="https://"
            value={form.portfolio_url}
            onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
          />
        </div>
      </section>

      <section className="surface-card flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="max-w-lg">
          <p className="eyebrow">Candidatura automática</p>
          <p className="mt-2 text-sm">
            Quero ser candidatado automaticamente em vagas com mais de 90% de compatibilidade com
            meu perfil.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Você continua vendo todas as candidaturas na aba Candidaturas.
          </p>
        </div>
        <Switch
          checked={autoApply}
          disabled={toggleAutoApply.isPending}
          onCheckedChange={(value) => toggleAutoApply.mutate(value)}
          aria-label="Candidatura automática acima de 90%"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            to: "/candidato/projetos",
            title: "Projetos",
            value: `${(projects.data ?? []).length}`,
            pending: (projects.data ?? []).length === 0,
          },
          {
            to: "/candidato/github",
            title: "GitHub",
            value: candidate.data?.github_username ? "conectado" : "não conectado",
            pending: !candidate.data?.github_username,
          },
          {
            to: "/candidato/curriculo",
            title: "Currículo",
            value: candidate.data?.resume_name ? "enviado" : "pendente",
            pending: !candidate.data?.resume_name,
          },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "surface-card surface-card-hover block p-5",
              item.pending && "border-destructive",
            )}
          >
            <p className={cn("eyebrow", item.pending && "text-destructive")}>{item.title}</p>
            <p className={cn("mt-2 text-sm", item.pending ? "text-destructive" : "text-primary")}>
              {item.value}
            </p>
          </Link>
        ))}
      </section>
    </>
  );
}
