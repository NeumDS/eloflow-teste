import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorState, Loading, MatchBadge, PageHeader, Progress } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { fetchCandidate, fetchCandidateProjects, unwrap } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { STAGE_LABEL, stageNumber } from "@/lib/stages";

export const Route = createFileRoute("/_authenticated/empresa/candidato/$candidateId")({
  component: CandidateForCompany,
});

type CandidateApplication = {
  id: string;
  stage: string;
  match_score: number;
  jobs: { id: string; title: string } | null;
};

function CandidateForCompany() {
  const { candidateId } = Route.useParams();
  const { identity } = useAuth();
  const companyId = identity?.id ?? "";
  const queryClient = useQueryClient();

  const applications = useQuery({
    queryKey: ["candidate-applications", candidateId, companyId],
    queryFn: async () => {
      const jobs = (await unwrap(
        supabase.from("jobs").select("id").eq("company_id", companyId).is("deleted_at", null),
      )) as { id: string }[];
      const ids = jobs.map((job) => job.id);
      if (ids.length === 0) return [];
      return (await unwrap(
        supabase
          .from("applications")
          .select("id, stage, match_score, jobs(id, title)")
          .eq("candidate_id", candidateId)
          .in("job_id", ids)
          .order("match_score", { ascending: false }),
      )) as CandidateApplication[];
    },
    enabled: !!companyId,
  });

  const advance = useMutation({
    mutationFn: async (application: CandidateApplication) => {
      const { error } = await supabase
        .from("applications")
        .update({ stage: "entrevista" })
        .eq("id", application.id);
      if (error) throw new Error(error.message);
      const { data: person } = await supabase
        .from("candidates")
        .select("email")
        .eq("id", candidateId)
        .maybeSingle();
      if (person?.email) {
        await supabase.from("notifications").insert({
          recipient_email: person.email,
          title: "Etapa 3 liberada",
          body: `Você avançou para a etapa 3 em ${application.jobs?.title ?? "uma vaga"}. O simulador de rotina já está disponível.`,
        });
      }
    },
    onSuccess: async () => {
      toast.success("Etapa 3 liberada para o candidato.");
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });


  const candidate = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => fetchCandidate(candidateId),
  });
  const projects = useQuery({
    queryKey: ["projects", candidateId],
    queryFn: () => fetchCandidateProjects(candidateId),
  });
  const github = useQuery({
    queryKey: ["github", candidateId],
    queryFn: () =>
      unwrap(
        supabase.from("github_profiles").select("*").eq("candidate_id", candidateId).maybeSingle(),
      ) as Promise<{ username: string; repos: number | null; stars: number | null } | null>,
  });
  const portfolios = useQuery({
    queryKey: ["portfolios", candidateId],
    queryFn: () =>
      unwrap(supabase.from("portfolios").select("*").eq("candidate_id", candidateId)) as Promise<
        { id: string; title: string; url: string; kind: string | null }[]
      >,
  });
  const assessments = useQuery({
    queryKey: ["assessments", candidateId],
    queryFn: () =>
      unwrap(supabase.from("assessments").select("*").eq("candidate_id", candidateId)) as Promise<
        { id: string; name: string; score: number | null }[]
      >,
  });
  const attempts = useQuery({
    queryKey: ["attempts", candidateId],
    queryFn: () =>
      unwrap(
        supabase
          .from("simulation_attempts")
          .select("id, score, feedback, simulations(title)")
          .eq("candidate_id", candidateId),
      ) as Promise<
        { id: string; score: number | null; feedback: string | null; simulations: { title: string } | null }[]
      >,
  });

  if (candidate.isLoading) return <Loading />;
  if (candidate.isError) return <ErrorState message={candidate.error.message} />;

  const person = candidate.data!;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link to="/empresa/candidatos">
          <ArrowLeft className="size-3.5" /> Candidatos
        </Link>
      </Button>

      <PageHeader
        eyebrow={person.seniority ?? undefined}
        title={person.full_name}
        subtitle={[person.headline, person.location].filter(Boolean).join(" · ")}
      />

      <section className="surface-card space-y-3 p-6">
        <p className="eyebrow">Etapas do processo</p>
        {applications.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este candidato ainda não tem candidatura nas suas vagas.
          </p>
        ) : null}
        {applications.data?.map((application) => {
          const stage = stageNumber(application.stage);
          return (
            <div
              key={application.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
            >
              <div>
                <p className="text-sm font-medium">{application.jobs?.title}</p>
                <p className="text-xs text-muted-foreground">
                  Etapa {stage} · {STAGE_LABEL[application.stage] ?? application.stage}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <MatchBadge score={application.match_score} />
                {stage === 2 ? (
                  <Button
                    size="sm"
                    onClick={() => advance.mutate(application)}
                    disabled={advance.isPending}
                  >
                    Liberar etapa 3
                  </Button>
                ) : (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                    {stage >= 3 ? "Etapa 3 liberada" : "Aguardando etapa 2"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <section className="surface-card p-6">
        <p className="eyebrow">Por que recomendamos este candidato?</p>
        <p className="mt-2 text-sm text-muted-foreground">
          A EloFlow cruzou as competências exigidas pelo DNA da oportunidade com evidências reais:
          {projects.data?.length
            ? ` ${projects.data.length} projeto(s) documentado(s) com problema, solução e resultado;`
            : ""}
          {github.data ? ` histórico público no GitHub (@${github.data.username});` : ""}
          {attempts.data?.length ? " simulação concluída com decisões alinhadas ao contexto da vaga;" : ""}
          {` perfil ${person.profile_completion}% completo.`}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Explicação gerada pela IA de demonstração deste MVP.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface-card p-5">
          <p className="eyebrow">Perfil</p>
          <p className="text-display mt-1 text-2xl text-primary">{person.profile_completion}%</p>
          <Progress value={person.profile_completion} className="mt-3" />
        </div>
        <div className="surface-card p-5">
          <p className="eyebrow">GitHub</p>
          <p className="mt-1 text-sm">
            {github.data ? `@${github.data.username} · ${github.data.repos} repos` : "não conectado"}
          </p>
        </div>
        <div className="surface-card p-5">
          <p className="eyebrow">Portfólio</p>
          <p className="mt-1 text-sm">
            {person.portfolio_url ? (
              <a
                href={person.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                Abrir portfólio
              </a>
            ) : (
              "não informado"
            )}
          </p>
        </div>
      </div>

      <section className="surface-card p-6">
        <p className="eyebrow">Skills</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(person.skills ?? []).map((skill) => (
            <span key={skill} className="rounded-full bg-secondary px-3 py-1 text-xs">
              {skill}
            </span>
          ))}
        </div>
        <p className="eyebrow mt-6">Formação</p>
        <p className="mt-1 text-sm text-muted-foreground">{person.education ?? "—"}</p>
        <p className="eyebrow mt-6">Resumo</p>
        <p className="mt-1 text-sm text-muted-foreground">{person.bio ?? "—"}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-display text-xl">Projetos</h2>
        <div className="grid gap-3">
          {projects.data?.map((project) => (
            <article key={project.id} className="surface-card p-5">
              <h3 className="text-lg">{project.name}</h3>
              <p className="text-sm text-muted-foreground">{project.description}</p>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                {[
                  ["Problema", project.problem],
                  ["Solução", project.solution],
                  ["Resultado", project.result],
                ].map(([label, value]) =>
                  value ? (
                    <div key={label as string}>
                      <dt className="eyebrow">{label as string}</dt>
                      <dd className="mt-1 text-muted-foreground">{value as string}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                {(project.technologies ?? []).map((tech) => (
                  <span key={tech} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                    {tech}
                  </span>
                ))}
              </div>
            </article>
          ))}
          {projects.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum projeto cadastrado.</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="surface-card p-5">
          <p className="eyebrow">Testes</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {assessments.data?.map((test) => (
              <li key={test.id}>
                • {test.name} — {test.score}
              </li>
            ))}
            {assessments.data?.length === 0 ? <li>Nenhum teste registrado.</li> : null}
          </ul>
        </div>
        <div className="surface-card p-5">
          <p className="eyebrow">Simulação</p>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            {attempts.data?.map((attempt) => (
              <li key={attempt.id}>
                • {attempt.simulations?.title} — {attempt.score}%
                <span className="block text-xs">{attempt.feedback}</span>
              </li>
            ))}
            {attempts.data?.length === 0 ? <li>Nenhuma simulação concluída.</li> : null}
          </ul>
        </div>
      </section>

      {portfolios.data?.length ? (
        <section className="surface-card p-5">
          <p className="eyebrow">Portfólio</p>
          <ul className="mt-2 space-y-1 text-sm">
            {portfolios.data.map((item) => (
              <li key={item.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
