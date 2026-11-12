import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState, Loading, MatchBadge, PageHeader, Progress } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { asDna, fetchRecommendations, notify, unwrap } from "@/lib/data";
import { evidenceForJob, fetchCandidateEvidence } from "@/lib/evidence";
import { isStage2Open, isStage3Open, MIN_APPLY_SCORE, stageNumber } from "@/lib/stages";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/candidato/vaga/$jobId")({
  component: JobDetail,
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const { identity } = useAuth();
  const candidateId = identity?.id ?? "";
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const job = useQuery({
    queryKey: ["job", jobId],
    queryFn: () =>
      unwrap(
        supabase.from("jobs").select("*, companies(name, email)").eq("id", jobId).single(),
      ) as Promise<{
        id: string;
        title: string;
        modality: string | null;
        location: string | null;
        salary_range: string | null;
        seniority: string | null;
        dna: unknown;
        companies: { name: string; email: string } | null;
      }>,
  });

  const recommendation = useQuery({
    queryKey: ["recommendations", candidateId],
    queryFn: () => fetchRecommendations(candidateId),
    enabled: !!candidateId,
  });
  const match = recommendation.data?.find((item) => item.job.id === jobId);

  const application = useQuery({
    queryKey: ["application", jobId, candidateId],
    queryFn: () =>
      unwrap(
        supabase
          .from("applications")
          .select("*")
          .eq("job_id", jobId)
          .eq("candidate_id", candidateId)
          .maybeSingle(),
      ) as Promise<{ id: string; stage: string } | null>,
    enabled: !!candidateId,
  });

  const evidence = useQuery({
    queryKey: ["evidence", candidateId],
    queryFn: () => fetchCandidateEvidence(candidateId),
    enabled: !!candidateId,
  });

  const simulation = useQuery({
    queryKey: ["simulation", jobId],
    queryFn: () =>
      unwrap(
        supabase.from("simulations").select("id, title").eq("job_id", jobId).maybeSingle(),
      ) as Promise<{ id: string; title: string } | null>,
  });

  const challenge = useQuery({
    queryKey: ["job-challenge", jobId],
    queryFn: () =>
      unwrap(
        supabase.from("challenges").select("id, title").eq("job_id", jobId).maybeSingle(),
      ) as Promise<{ id: string; title: string } | null>,
  });

  const apply = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("applications").insert({
        job_id: jobId,
        candidate_id: candidateId,
        match_score: match?.score ?? 80,
        reasons: match?.reasons ?? [],
        stage: "perfil_analisado",
      });
      if (error) throw new Error(error.message);
      if (job.data?.companies?.email) {
        await notify(
          job.data.companies.email,
          "Nova candidatura",
          `${identity?.name} se candidatou para ${job.data.title}.`,
        );
      }
    },
    onSuccess: async () => {
      toast.success("Seu perfil foi enviado.");
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (job.isLoading) return <Loading />;
  if (job.isError) return <ErrorState message={job.error.message} />;
  if (!job.data) return <ErrorState message="Oportunidade não encontrada." />;

  const dna = asDna(job.data.dna);
  const applied = !!application.data;
  const stage = application.data?.stage ?? "candidatura_enviada";
  const stage2 = applied && isStage2Open(stage);
  const stage3 = applied && isStage3Open(stage);
  const score = match?.score ?? 0;
  const canApply = score >= MIN_APPLY_SCORE;
  const scores = evidenceForJob(evidence.data, jobId);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link to="/candidato/oportunidades">
          <ArrowLeft className="size-3.5" /> Oportunidades
        </Link>
      </Button>

      <PageHeader
        eyebrow={job.data.companies?.name ?? undefined}
        title={job.data.title}
        subtitle={[job.data.modality, job.data.location, job.data.salary_range]
          .filter(Boolean)
          .join(" · ")}
        action={match ? <MatchBadge score={match.score} /> : undefined}
      />

      {dna ? (
        <section className="grid gap-3 sm:grid-cols-2">
          {[
            ["O que fará", dna.fara],
            ["O que precisa saber", dna.precisa_saber],
            ["O que pode aprender", dna.pode_aprender],
            ["Problemas que resolverá", dna.problemas],
            ["Como será avaliado", dna.avaliacao],
          ].map(([title, items]) => (
            <div key={title as string} className="surface-card p-5">
              <p className="eyebrow">{title as string}</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {(items as string[]).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      {applied ? (
        <>
          <section className="surface-card p-6">
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <Check className="size-4" /> Seu perfil foi enviado — etapa {stageNumber(stage)}.
            </p>

            <p className="eyebrow mt-6">Avaliações desta vaga</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {challenge.data ? (
                stage2 ? (
                  <Button asChild size="sm">
                    <Link to="/candidato/desafios">Desafio em código</Link>
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                    <Lock className="size-3.5" aria-hidden /> Desafio em código — etapa 2 ainda não liberada
                  </span>
                )
              ) : null}
              {simulation.data ? (
                stage2 ? (
                  <Button asChild size="sm" variant="outline">
                    <Link
                      to="/candidato/simulacao/$simulationId"
                      params={{ simulationId: simulation.data.id }}
                    >
                      Simulação de situações reais
                    </Link>
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                    <Lock className="size-3.5" aria-hidden /> Simulação de situações reais — etapa 2 ainda não liberada
                  </span>
                )
              ) : null}
              {stage3 ? (
                <Button asChild size="sm" variant="outline">
                  <Link to="/candidato/simulador">Simulador de rotina</Link>
                </Button>
              ) : null}
              <Button asChild size="sm" variant="ghost">
                <Link to="/candidato/candidaturas">Acompanhar status</Link>
              </Button>
            </div>
          </section>

          <section className="surface-card p-6">
            <p className="eyebrow">Testes que você realizou para esta vaga</p>
            {scores.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Nenhum teste concluído para esta vaga ainda.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {scores.map((line) => (
                  <li key={line.id}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span>{line.label}</span>
                      <span className="text-display text-xl text-primary">
                        {line.score ?? "—"}%
                      </span>
                    </div>
                    <Progress value={line.score ?? 0} className="mt-2" />
                    {line.feedback ? (
                      <p className="mt-2 text-sm text-muted-foreground">{line.feedback}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            disabled={apply.isPending || !candidateId || !canApply}
            onClick={() => apply.mutate()}
          >
            {apply.isPending ? "Enviando…" : "Candidatar-se"}
          </Button>
          <Button variant="ghost" onClick={() => void navigate({ to: "/candidato/perfil" })}>
            Revisar meu perfil
          </Button>
          {!canApply ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5" aria-hidden />
              Você precisa de pelo menos {MIN_APPLY_SCORE}% de compatibilidade para se candidatar.
            </p>
          ) : null}
        </div>
      )}
    </>
  );
}
