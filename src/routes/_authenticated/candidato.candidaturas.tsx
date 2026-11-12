import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  Loading,
  MatchBadge,
  PageHeader,
  Progress,
  Timeline,
} from "@/components/eloflow/ui";
import { fetchApplications, fetchCandidate, fetchCandidateProjects } from "@/lib/data";
import { evidenceForJob, fetchCandidateEvidence, improvementPoints } from "@/lib/evidence";
import { stageNumber } from "@/lib/stages";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/candidato/candidaturas")({
  component: ApplicationsPage,
});

type ApplicationRow = {
  id: string;
  stage: string;
  status: string;
  match_score: number;
  reasons: string[];
  jobs: { id: string; title: string; companies: { name: string } | null } | null;
};

function ApplicationsPage() {
  const { identity } = useAuth();
  const candidateId = identity?.id ?? "";
  const query = useQuery({
    queryKey: ["applications", candidateId],
    queryFn: () => fetchApplications(candidateId) as Promise<ApplicationRow[]>,
    enabled: !!candidateId,
  });
  const evidence = useQuery({
    queryKey: ["evidence", candidateId],
    queryFn: () => fetchCandidateEvidence(candidateId),
    enabled: !!candidateId,
  });
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

  const improvements = improvementPoints(evidence.data, {
    skills: candidate.data?.skills,
    github_username: candidate.data?.github_username,
    resume_name: candidate.data?.resume_name,
    projectCount: (projects.data ?? []).length,
  });

  return (
    <>
      <PageHeader
        eyebrow="Candidaturas"
        title="Onde você está em cada processo."
        subtitle="Acompanhe o andamento sem precisar perguntar."
      />

      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorState message={query.error.message} /> : null}
      {query.data?.length === 0 ? (
        <EmptyState
          title="Nenhuma candidatura ainda"
          description="Veja as oportunidades recomendadas para você."
          action={
            <Button asChild>
              <Link to="/candidato/oportunidades">Ver oportunidades</Link>
            </Button>
          }
        />
      ) : null}

      <div className="grid gap-3">
        {query.data?.map((application) => {
          const scores = application.jobs
            ? evidenceForJob(evidence.data, application.jobs.id)
            : [];
          return (
            <article key={application.id} className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg">{application.jobs?.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {application.jobs?.companies?.name} · Etapa {stageNumber(application.stage)}
                  </p>
                </div>
                <MatchBadge score={application.match_score} />
              </div>
              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                <Timeline stage={application.stage} />
                <div>
                  <p className="eyebrow">Motivos da recomendação</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {(application.reasons ?? []).map((reason) => (
                      <li key={reason}>• {reason}</li>
                    ))}
                  </ul>

                  <p className="eyebrow mt-5">Seus testes nesta vaga</p>
                  {scores.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Nenhum teste realizado para esta vaga ainda.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {scores.map((line) => (
                        <li key={line.id}>
                          <div className="flex items-baseline justify-between gap-2 text-sm">
                            <span>{line.label}</span>
                            <span className="font-semibold text-primary">
                              {line.score ?? "—"}%
                            </span>
                          </div>
                          <Progress value={line.score ?? 0} className="mt-1" />
                        </li>
                      ))}
                    </ul>
                  )}

                  {application.jobs ? (
                    <Button asChild size="sm" className="mt-5">
                      <Link to="/candidato/vaga/$jobId" params={{ jobId: application.jobs.id }}>
                        Ver oportunidade
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {(query.data?.length ?? 0) > 0 ? (
        <section className="surface-card p-6">
          <h2 className="text-display text-xl">O que você pode melhorar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Baseado nos testes e evidências que já temos de você.
          </p>
          {improvements.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Seus indicadores estão bons — siga acompanhando os processos.
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {improvements.map((point) => (
                <li key={point}>• {point}</li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </>
  );
}
