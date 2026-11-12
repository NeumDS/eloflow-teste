import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Progress,
  SectionTabs,
} from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/data";
import { STAGE_LABEL, stageNumber } from "@/lib/stages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/especialista/candidatos")({
  component: SpecialistCandidates,
});

type CandidateRow = {
  id: string;
  full_name: string;
  email: string;
  headline: string | null;
  location: string | null;
  seniority: string | null;
  bio: string | null;
  education: string | null;
  skills: string[] | null;
  profile_completion: number;
  github_username: string | null;
  projects: { id: string; name: string; technologies: string[] | null }[];
};

const SENIORITIES = ["todos", "Júnior", "Pleno", "Sênior"];

function CandidateDetail({ candidateId }: { candidateId: string }) {
  const detail = useQuery({
    queryKey: ["specialist-candidate-detail", candidateId],
    queryFn: async () => {
      const [applications, assessments, attempts] = await Promise.all([
        unwrap(
          supabase
            .from("applications")
            .select("id, stage, match_score, jobs(title, companies(name))")
            .eq("candidate_id", candidateId),
        ) as Promise<
          {
            id: string;
            stage: string;
            match_score: number;
            jobs: { title: string; companies: { name: string } | null } | null;
          }[]
        >,
        unwrap(
          supabase.from("assessments").select("id, name, score").eq("candidate_id", candidateId),
        ) as Promise<{ id: string; name: string; score: number | null }[]>,
        unwrap(
          supabase
            .from("simulation_attempts")
            .select("id, score, simulations(title)")
            .eq("candidate_id", candidateId),
        ) as Promise<{ id: string; score: number | null; simulations: { title: string } | null }[]>,
      ]);
      return { applications, assessments, attempts };
    },
  });

  if (detail.isLoading) return <Loading />;
  if (detail.isError) return <ErrorState message={detail.error.message} />;

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="eyebrow">Processos</p>
        {detail.data?.applications.length === 0 ? (
          <p className="mt-1 text-muted-foreground">Nenhuma candidatura.</p>
        ) : null}
        <ul className="mt-1 space-y-1 text-muted-foreground">
          {detail.data?.applications.map((application) => (
            <li key={application.id}>
              • {application.jobs?.title} · {application.jobs?.companies?.name} — etapa{" "}
              {stageNumber(application.stage)} ({STAGE_LABEL[application.stage] ?? application.stage}
              ) · {application.match_score}%
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="eyebrow">Avaliações</p>
        <ul className="mt-1 space-y-1 text-muted-foreground">
          {detail.data?.assessments.map((item) => (
            <li key={item.id}>
              • {item.name} — {item.score ?? "—"}
            </li>
          ))}
          {detail.data?.attempts.map((item) => (
            <li key={item.id}>
              • {item.simulations?.title ?? "Simulação"} — {item.score ?? "—"}%
            </li>
          ))}
          {detail.data && detail.data.assessments.length + detail.data.attempts.length === 0 ? (
            <li>Nenhuma avaliação registrada.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

function SpecialistCandidates() {
  const [term, setTerm] = useState("");
  const [seniority, setSeniority] = useState("todos");
  const [open, setOpen] = useState<string | null>(null);

  const candidates = useQuery({
    queryKey: ["all-candidates"],
    queryFn: () =>
      unwrap(
        supabase
          .from("candidates")
          .select(
            "id, full_name, email, headline, location, seniority, bio, education, skills, profile_completion, github_username, projects(id, name, technologies)",
          )
          .order("profile_completion", { ascending: false }),
      ) as Promise<CandidateRow[]>,
  });

  const query = term.trim().toLowerCase();
  const filtered = (candidates.data ?? []).filter((candidate) => {
    const matchSeniority = seniority === "todos" || candidate.seniority === seniority;
    const matchTerm =
      !query ||
      candidate.full_name.toLowerCase().includes(query) ||
      (candidate.headline ?? "").toLowerCase().includes(query) ||
      (candidate.skills ?? []).some((skill) => skill.toLowerCase().includes(query));
    return matchSeniority && matchTerm;
  });

  return (
    <>
      <PageHeader
        eyebrow="Candidatos"
        title="Talentos na base"
        subtitle="Capacidade demonstrada em projetos, GitHub e simulações."
      />
      <SectionTabs
        items={[
          { to: "/especialista/empresas", label: "Empresas" },
          { to: "/especialista/candidatos", label: "Candidatos" },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Buscar por nome, cargo ou skill"
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {SENIORITIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSeniority(item)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                seniority === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              {item === "todos" ? "Todas as senioridades" : item}
            </button>
          ))}
        </div>
      </div>

      {candidates.isLoading ? <Loading /> : null}
      {candidates.isError ? <ErrorState message={candidates.error.message} /> : null}
      {candidates.data && filtered.length === 0 ? (
        <EmptyState title="Nenhum candidato encontrado" description="Ajuste a busca ou o filtro." />
      ) : null}

      <div className="grid gap-3">
        {filtered.map((candidate) => (
          <article key={candidate.id} className="surface-card p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg">{candidate.full_name}</h2>
              <span className="text-sm text-primary">{candidate.profile_completion}%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {[candidate.headline, candidate.seniority, candidate.location]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <Progress value={candidate.profile_completion} className="mt-3" />
            <div className="mt-3 flex flex-wrap gap-2">
              {(candidate.skills ?? []).map((skill) => (
                <span key={skill} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                  {skill}
                </span>
              ))}
            </div>
            <p className="eyebrow mt-4">
              {candidate.projects.length} projeto(s) ·{" "}
              {candidate.github_username ? `@${candidate.github_username}` : "sem GitHub"} ·{" "}
              {candidate.email}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-3 -ml-2"
              onClick={() => setOpen(open === candidate.id ? null : candidate.id)}
            >
              {open === candidate.id ? "Ocultar perfil" : "Ver perfil completo"}
            </Button>
            {open === candidate.id ? (
              <div className="mt-3 space-y-4 border-t border-border pt-4">
                <div className="text-sm">
                  <p className="eyebrow">Resumo</p>
                  <p className="mt-1 text-muted-foreground">{candidate.bio ?? "—"}</p>
                  <p className="eyebrow mt-4">Formação</p>
                  <p className="mt-1 text-muted-foreground">{candidate.education ?? "—"}</p>
                  <p className="eyebrow mt-4">Projetos</p>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    {candidate.projects.map((project) => (
                      <li key={project.id}>
                        • {project.name}
                        {project.technologies?.length
                          ? ` — ${project.technologies.join(", ")}`
                          : ""}
                      </li>
                    ))}
                    {candidate.projects.length === 0 ? <li>Nenhum projeto cadastrado.</li> : null}
                  </ul>
                </div>
                <CandidateDetail candidateId={candidate.id} />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}
