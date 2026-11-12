import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BackButton, ErrorState, Loading, PageHeader, Progress } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/data";
import { AIService } from "@/lib/ai";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/candidato/simulacao/$simulationId")({
  component: SimulationRunner,
});

type Question = { situation: string; options: string[] };

type Simulation = {
  id: string;
  job_id: string | null;
  title: string;
  intro: string | null;
  questions: Question[] | null;
};

function SimulationRunner() {
  const { simulationId } = Route.useParams();
  const { identity } = useAuth();
  const candidateId = identity?.id ?? "";
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [choice, setChoice] = useState<number | null>(null);
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);

  const simulation = useQuery({
    queryKey: ["simulation-detail", simulationId],
    queryFn: () =>
      unwrap(
        supabase.from("simulations").select("*").eq("id", simulationId).single(),
      ) as Promise<Simulation>,
  });

  const finish = useMutation({
    mutationFn: async (allAnswers: number[]) => {
      const evaluation = AIService.evaluateSimulation(allAnswers);
      const { error } = await supabase.from("simulation_attempts").insert({
        simulation_id: simulationId,
        candidate_id: candidateId,
        answers: allAnswers,
        score: evaluation.score,
        feedback: evaluation.feedback,
        completed_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      const jobId = simulation.data?.job_id;
      if (jobId) {
        await supabase
          .from("applications")
          .update({ stage: "avaliacao" })
          .eq("candidate_id", candidateId)
          .eq("job_id", jobId);
      }
      return evaluation;
    },
    onSuccess: async (evaluation) => {
      setResult(evaluation);
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (simulation.isLoading) return <Loading />;
  if (simulation.isError) return <ErrorState message={simulation.error.message} />;

  const questions = simulation.data?.questions ?? [];

  if (result) {
    return (
      <>
        <BackButton to="/candidato/avaliacoes" label="Avaliações" />
        <PageHeader
          eyebrow="Simulação"
          title="Simulação concluída."
          subtitle="Sua forma de decidir já está disponível para a empresa."
        />
        <section className="surface-card p-8 text-center">
          <p className="eyebrow">Resultado</p>
          <p className="text-display mt-2 text-5xl text-primary">{result.score}%</p>
          <Progress value={result.score} className="mx-auto mt-5 max-w-sm" />
          <p className="mx-auto mt-5 max-w-lg text-sm text-muted-foreground">{result.feedback}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link to="/candidato/candidaturas">Ver minhas candidaturas</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/candidato/avaliacoes">Avaliações</Link>
            </Button>
          </div>
        </section>
      </>
    );
  }

  const question = questions[step];

  return (
    <>
      <BackButton to="/candidato/avaliacoes" label="Avaliações" />
      <PageHeader
        eyebrow={simulation.data?.title}
        title="Vamos colocar você no trabalho."
        subtitle={simulation.data?.intro ?? undefined}
      />

      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Situação {step + 1} de {questions.length}
          </span>
          <span>{Math.round(((step + 1) / Math.max(questions.length, 1)) * 100)}%</span>
        </div>
        <Progress value={((step + 1) / Math.max(questions.length, 1)) * 100} />

        <section className="surface-card space-y-5 p-8">
          <p className="text-display text-xl leading-snug">{question?.situation}</p>
          <div className="space-y-2">
            {(question?.options ?? []).map((option, index) => (
              <button
                key={option}
                type="button"
                onClick={() => setChoice(index)}
                className={cn(
                  "w-full rounded-lg border p-4 text-left text-sm transition-colors",
                  choice === index
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border hover:bg-secondary/60",
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <Button
            size="lg"
            disabled={choice === null || finish.isPending}
            onClick={() => {
              if (choice === null) return;
              const next = [...answers, choice];
              setAnswers(next);
              setChoice(null);
              if (step + 1 < questions.length) setStep(step + 1);
              else finish.mutate(next);
            }}
          >
            {finish.isPending
              ? "Avaliando…"
              : step + 1 < questions.length
                ? "Continuar"
                : "Concluir simulação"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Avaliação gerada por IA de demonstração neste MVP.
          </p>
        </section>
      </div>
    </>
  );
}
