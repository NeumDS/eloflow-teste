import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  Loading,
  MatchBadge,
  PageHeader,
  SectionTabs,
  Timeline,
} from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/especialista/processos")({
  component: SpecialistProcesses,
});

type ApplicationRow = {
  id: string;
  stage: string;
  status: string;
  match_score: number;
  candidate_id: string;
  job_id: string;
  candidates: { full_name: string } | null;
  jobs: {
    title: string;
    company_id: string;
    companies: { name: string; email: string } | null;
  } | null;
};

function SpecialistProcesses() {
  const queryClient = useQueryClient();

  const applications = useQuery({
    queryKey: ["all-applications"],
    queryFn: () =>
      unwrap(
        supabase
          .from("applications")
          .select(
            "id, stage, status, match_score, candidate_id, job_id, candidates(full_name), jobs(title, company_id, companies(name, email))",
          )
          .order("created_at", { ascending: false }),
      ) as Promise<ApplicationRow[]>,
  });

  const approve = useMutation({
    mutationFn: async (application: ApplicationRow) => {
      const candidateName = application.candidates?.full_name ?? "Candidato";
      const job = application.jobs;
      if (!job) throw new Error("Vaga não encontrada.");

      const [simulations, challenges, assessments] = await Promise.all([
        unwrap(
          supabase
            .from("simulation_attempts")
            .select("score, feedback, simulations!inner(job_id)")
            .eq("candidate_id", application.candidate_id)
            .eq("simulations.job_id", application.job_id),
        ) as Promise<{ score: number | null; feedback: string | null }[]>,
        unwrap(
          supabase
            .from("challenge_submissions")
            .select("score, feedback, challenges!inner(title, job_id)")
            .eq("candidate_id", application.candidate_id)
            .eq("challenges.job_id", application.job_id),
        ) as Promise<{ score: number | null; feedback: string | null; challenges: { title: string } | null }[]>,
        unwrap(
          supabase
            .from("assessments")
            .select("name, score")
            .eq("candidate_id", application.candidate_id),
        ) as Promise<{ name: string; score: number | null }[]>,
      ]);

      const simulationScore = simulations[0]?.score ?? null;
      const challengeScore = challenges[0]?.score ?? null;
      const assessmentScores = assessments
        .filter((a) => a.score != null)
        .map((a) => `${a.name}: ${a.score}`)
        .join(", ");

      const { error } = await supabase
        .from("applications")
        .update({ stage: "aprovado", status: "aprovado" })
        .eq("id", application.id);
      if (error) throw new Error(error.message);

      if (job.companies?.email) {
        const body = [
          `${candidateName} foi aprovado pelo especialista para ${job.title}.`,
          `Matching: ${application.match_score}%.`,
          simulationScore != null ? `Simulação: ${simulationScore}%.` : "",
          challengeScore != null ? `Desafio: ${challengeScore}%.` : "",
          assessmentScores ? `Avaliações: ${assessmentScores}.` : "",
        ]
          .filter(Boolean)
          .join(" ");

        await supabase.from("notifications").insert({
          recipient_email: job.companies.email,
          title: `Candidato aprovado para ${job.title}`,
          body,
        });
      }
    },
    onSuccess: async () => {
      toast.success("Candidato aprovado e empresa notificada.");
      await queryClient.invalidateQueries({ queryKey: ["all-applications"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Processos"
        title="Processos em andamento"
        subtitle="Onde cada pessoa está em cada contratação."
      />
      <SectionTabs
        items={[
          { to: "/especialista/validacoes", label: "Validações" },
          { to: "/especialista/processos", label: "Processos" },
        ]}
      />

      {applications.isLoading ? <Loading /> : null}
      {applications.isError ? <ErrorState message={applications.error.message} /> : null}
      {applications.data?.length === 0 ? (
        <EmptyState title="Nenhum processo" description="Nenhuma candidatura registrada ainda." />
      ) : null}

      <div className="grid gap-3">
        {applications.data?.map((application) => (
          <article key={application.id} className="surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg">{application.candidates?.full_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {application.jobs?.title} · {application.jobs?.companies?.name}
                </p>
              </div>
              <MatchBadge score={application.match_score} />
            </div>
            <div className="mt-5 max-w-sm">
              <Timeline stage={application.stage} />
            </div>
            {application.stage !== "aprovado" ? (
              <div className="mt-4">
                <Button
                  size="sm"
                  onClick={() => approve.mutate(application)}
                  disabled={approve.isPending}
                >
                  <CheckCircle className="size-3.5" /> Aprovar candidato
                </Button>
              </div>
            ) : (
              <p className="mt-4 text-sm font-medium text-primary">Aprovado · empresa notificada</p>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
