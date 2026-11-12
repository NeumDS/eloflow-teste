import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/hooks/useAuth";
import { useStage3Open } from "@/hooks/useCandidateStages";

export const Route = createFileRoute("/_authenticated/candidato/avaliacoes")({
  component: AssessmentsPage,
});

function AssessmentsPage() {
  const { identity } = useAuth();
  const candidateId = identity?.id ?? "";
  const stage3 = useStage3Open();

  const attempts = useQuery({
    queryKey: ["attempts", candidateId],
    queryFn: () =>
      unwrap(
        supabase
          .from("simulation_attempts")
          .select("*, simulations(title, jobs(title, companies(name)))")
          .eq("candidate_id", candidateId)
          .order("completed_at", { ascending: false }),
      ) as Promise<
        {
          id: string;
          score: number | null;
          feedback: string | null;
          simulations: { title: string } | null;
        }[]
      >,
    enabled: !!candidateId,
  });

  const pending = useQuery({
    queryKey: ["pending-simulations", candidateId],
    queryFn: async () => {
      const applications = (await unwrap(
        supabase.from("applications").select("job_id").eq("candidate_id", candidateId),
      )) as { job_id: string }[];
      if (applications.length === 0) return [];
      const simulations = (await unwrap(
        supabase
          .from("simulations")
          .select("id, title, jobs(title, companies(name))")
          .in(
            "job_id",
            applications.map((a) => a.job_id),
          ),
      )) as {
        id: string;
        title: string;
        jobs: { title: string; companies: { name: string } | null } | null;
      }[];
      const done = (await unwrap(
        supabase.from("simulation_attempts").select("simulation_id").eq("candidate_id", candidateId),
      )) as { simulation_id: string }[];
      const doneIds = new Set(done.map((d) => d.simulation_id));
      return simulations.filter((s) => !doneIds.has(s.id));
    },
    enabled: !!candidateId,
  });

  const tests = useQuery({
    queryKey: ["assessments", candidateId],
    queryFn: () =>
      unwrap(supabase.from("assessments").select("*").eq("candidate_id", candidateId)) as Promise<
        { id: string; name: string; score: number | null }[]
      >,
    enabled: !!candidateId,
  });

  return (
    <>
      <PageHeader
        eyebrow="Avaliações"
        title="Suas avaliações e simulações."
        subtitle="Cada avaliação nasce da rotina real da vaga."
      />
      <SectionTabs
        items={[
          { to: "/candidato/avaliacoes", label: "Avaliações" },
          ...(stage3.open
            ? [{ to: "/candidato/simulador", label: "Simulador de rotina" }]
            : []),
        ]}
      />

      {pending.isLoading || attempts.isLoading ? <Loading /> : null}
      {attempts.isError ? <ErrorState message={attempts.error.message} /> : null}

      <section className="space-y-3">
        <h2 className="text-display text-xl">Pendentes</h2>
        {pending.data?.length === 0 ? (
          <EmptyState
            title="Nenhuma avaliação pendente"
            description="Ao se candidatar, a simulação da vaga aparece aqui."
            action={
              <Button asChild variant="outline">
                <Link to="/candidato/oportunidades">Ver oportunidades</Link>
              </Button>
            }
          />
        ) : null}
        {pending.data?.map((simulation) => (
          <article key={simulation.id} className="surface-card surface-card-hover p-5">
            <h3 className="text-lg">{simulation.title}</h3>
            <p className="text-sm text-muted-foreground">
              {simulation.jobs?.title} · {simulation.jobs?.companies?.name}
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link to="/candidato/simulacao/$simulationId" params={{ simulationId: simulation.id }}>
                Iniciar simulação
              </Link>
            </Button>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-display text-xl">Concluídas</h2>
        {attempts.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma simulação concluída ainda.</p>
        ) : null}
        {attempts.data?.map((attempt) => (
          <article key={attempt.id} className="surface-card p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-lg">{attempt.simulations?.title}</h3>
              <p className="text-display text-2xl text-primary">{attempt.score}%</p>
            </div>
            <Progress value={attempt.score ?? 0} className="mt-3" />
            <p className="mt-3 text-sm text-muted-foreground">{attempt.feedback}</p>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-display text-xl">Testes</h2>
        {tests.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum teste registrado.</p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {tests.data?.map((test) => (
            <div key={test.id} className="surface-card p-5">
              <p className="eyebrow">{test.name}</p>
              <p className="text-display mt-1 text-2xl text-primary">{test.score}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
