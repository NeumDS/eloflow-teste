import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Progress,
  StatCard,
} from "@/components/eloflow/ui";
import { fetchApplications, fetchCandidate, fetchRecommendations, unwrap } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { fetchCandidateEvidence } from "@/lib/evidence";
import { isStage2Open, isStage3Open } from "@/lib/stages";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/candidato/")({
  component: CandidateHome,
});

type ApplicationRow = {
  id: string;
  stage: string;
  jobs: { id: string; title: string; companies: { name: string } | null } | null;
};

function CandidateHome() {
  const { identity } = useAuth();
  const candidateId = identity?.id ?? "";

  const candidate = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => fetchCandidate(candidateId),
    enabled: !!candidateId,
  });
  const recommendations = useQuery({
    queryKey: ["recommendations", candidateId],
    queryFn: () => fetchRecommendations(candidateId),
    enabled: !!candidateId,
  });
  const applications = useQuery({
    queryKey: ["applications", candidateId],
    queryFn: () => fetchApplications(candidateId) as Promise<ApplicationRow[]>,
    enabled: !!candidateId,
  });
  const evidence = useQuery({
    queryKey: ["evidence", candidateId],
    queryFn: () => fetchCandidateEvidence(candidateId),
    enabled: !!candidateId,
  });

  const jobIds = (applications.data ?? []).map((a) => a.jobs?.id).filter(Boolean) as string[];

  const tasks = useQuery({
    queryKey: ["pending-tests", candidateId, jobIds.join(",")],
    enabled: !!candidateId && !!applications.data && !!evidence.data,
    queryFn: async () => {
      if (jobIds.length === 0) return [];
      const [simulations, challenges] = await Promise.all([
        unwrap(
          supabase.from("simulations").select("id, title, job_id").in("job_id", jobIds),
        ) as Promise<{ id: string; title: string; job_id: string }[]>,
        unwrap(
          supabase
            .from("challenges")
            .select("id, title, job_id")
            .in("job_id", jobIds)
            .eq("status", "aberto"),
        ) as Promise<{ id: string; title: string; job_id: string | null }[]>,
      ]);
      const doneSimulations = new Set(
        (evidence.data?.attempts ?? []).map((a) => a.simulations?.id).filter(Boolean),
      );
      const doneChallenges = new Set(
        (evidence.data?.submissions ?? []).map((s) => s.challenges?.id).filter(Boolean),
      );

      const items: {
        key: string;
        etapa: 2 | 3;
        title: string;
        context: string;
        to: string;
        params?: Record<string, string>;
      }[] = [];

      for (const application of applications.data ?? []) {
        const job = application.jobs;
        if (!job) continue;
        const context = `${job.title} · ${job.companies?.name ?? ""}`;

        if (isStage2Open(application.stage)) {
          for (const challenge of challenges.filter((c) => c.job_id === job.id)) {
            if (doneChallenges.has(challenge.id)) continue;
            items.push({
              key: `c-${challenge.id}`,
              etapa: 2,
              title: `Desafio prático · ${challenge.title}`,
              context,
              to: "/candidato/desafios",
            });
          }
          for (const simulation of simulations.filter((s) => s.job_id === job.id)) {
            if (doneSimulations.has(simulation.id)) continue;
            items.push({
              key: `s-${simulation.id}`,
              etapa: 2,
              title: `Simulação de situações reais · ${simulation.title}`,
              context,
              to: "/candidato/simulacao/$simulationId",
              params: { simulationId: simulation.id },
            });
          }
        }

        if (isStage3Open(application.stage)) {
          items.push({
            key: `r-${job.id}`,
            etapa: 3,
            title: "Simulador de rotina do cliente",
            context,
            to: "/candidato/simulador",
          });
        }
      }
      return items;
    },
  });

  const firstName = (identity?.name ?? "").split(" ")[0];
  const completion = candidate.data?.profile_completion ?? 0;

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName || "tudo bem"}.`}
        subtitle="Vamos encontrar onde suas habilidades fazem sentido."
      />

      {candidate.isError ? <ErrorState message={candidate.error.message} /> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/candidato/perfil" className="surface-card surface-card-hover block p-5">
          <p className="eyebrow">Perfil</p>
          <p className="text-display mt-2 text-3xl text-primary">{completion}%</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {completion < 100 ? "toque para concluir o que falta" : "completo"}
          </p>
          <Progress value={completion} className="mt-3" />
        </Link>
        <StatCard
          to="/candidato/oportunidades"
          label="Oportunidades"
          value={recommendations.data?.filter((item) => !item.applied).length ?? "—"}
          hint="compatíveis com você"
        />
        <StatCard
          to="/candidato/candidaturas"
          label="Candidaturas"
          value={applications.data?.length ?? "—"}
          hint="vagas em que você se cadastrou"
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-display text-xl">Testes pendentes</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/candidato/avaliacoes">Ver avaliações</Link>
          </Button>
        </div>

        {tasks.isLoading || applications.isLoading ? <Loading /> : null}
        {tasks.isError ? <ErrorState message={tasks.error.message} /> : null}
        {tasks.data?.length === 0 ? (
          <EmptyState
            title="Nenhum teste pendente"
            description="Quando uma empresa liberar a etapa 2 ou 3, o teste aparece aqui."
            action={
              <Button asChild>
                <Link to="/candidato/oportunidades">Ver oportunidades</Link>
              </Button>
            }
          />
        ) : null}

        <div className="grid gap-3">
          {tasks.data?.map((task) => (
            <article
              key={task.key}
              className="surface-card surface-card-hover flex flex-wrap items-center justify-between gap-3 p-5"
            >
              <div>
                <p className="eyebrow">Etapa {task.etapa}</p>
                <h3 className="mt-1 text-lg">{task.title}</h3>
                <p className="text-sm text-muted-foreground">{task.context}</p>
              </div>
              <Button asChild size="sm">
                <Link to={task.to} {...(task.params ? { params: task.params } : {})}>
                  Começar
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
