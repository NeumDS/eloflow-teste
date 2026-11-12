import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  ErrorState,
  Loading,
  MatchBadge,
  PageHeader,
} from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/data";
import { STAGE_LABEL, stageNumber } from "@/lib/stages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/especialista/vagas")({
  component: SpecialistJobs,
});

type JobRow = {
  id: string;
  title: string;
  status: string;
  seniority: string | null;
  modality: string | null;
  companies: { name: string } | null;
};

type ApplicationRow = {
  id: string;
  stage: string;
  match_score: number;
  candidates: { id: string; full_name: string; headline: string | null } | null;
};

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Aguardando conversa",
  em_diagnostico: "Em diagnóstico",
  em_validacao: "Em validação",
  validada: "Validada",
};

const FILTERS = [
  { value: "todos", label: "Todas" },
  { value: "rascunho", label: "Aguardando conversa" },
  { value: "em_diagnostico", label: "Em diagnóstico" },
  { value: "em_validacao", label: "Em validação" },
  { value: "validada", label: "Validadas" },
];

function JobCandidates({ jobId }: { jobId: string }) {
  const applications = useQuery({
    queryKey: ["job-applications", jobId],
    queryFn: () =>
      unwrap(
        supabase
          .from("applications")
          .select("id, stage, match_score, candidates(id, full_name, headline)")
          .eq("job_id", jobId)
          .order("match_score", { ascending: false }),
      ) as Promise<ApplicationRow[]>,
  });

  if (applications.isLoading) return <Loading />;
  if (applications.isError) return <ErrorState message={applications.error.message} />;
  if ((applications.data ?? []).length === 0)
    return (
      <p className="text-sm text-muted-foreground">Nenhum candidato nesta vaga ainda.</p>
    );

  return (
    <ul className="divide-y divide-border">
      {applications.data?.map((application) => (
        <li key={application.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <p className="text-sm font-medium">{application.candidates?.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {application.candidates?.headline} · Etapa {stageNumber(application.stage)} ·{" "}
              {STAGE_LABEL[application.stage] ?? application.stage}
            </p>
          </div>
          <MatchBadge score={application.match_score} />
        </li>
      ))}
    </ul>
  );
}

function SpecialistJobs() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("todos");
  const [term, setTerm] = useState("");
  const [openJob, setOpenJob] = useState<string | null>(null);

  const jobs = useQuery({
    queryKey: ["all-jobs"],
    queryFn: () =>
      unwrap(
        supabase
          .from("jobs")
          .select("id, title, status, seniority, modality, companies(name)")
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
      ) as Promise<JobRow[]>,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("jobs")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Vaga removida.");
      await queryClient.invalidateQueries({ queryKey: ["all-jobs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const query = term.trim().toLowerCase();
  const filtered = (jobs.data ?? []).filter((job) => {
    const matchStatus = status === "todos" || job.status === status;
    const matchTerm =
      !query ||
      job.title.toLowerCase().includes(query) ||
      (job.companies?.name ?? "").toLowerCase().includes(query);
    return matchStatus && matchTerm;
  });

  return (
    <>
      <PageHeader
        eyebrow="Vagas"
        title="Todas as oportunidades"
        subtitle="Do primeiro registro até a vaga validada para matching — com os candidatos de cada vaga."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Buscar por vaga ou empresa"
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                status === filter.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {jobs.isLoading ? <Loading /> : null}
      {jobs.isError ? <ErrorState message={jobs.error.message} /> : null}
      {jobs.data && filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma vaga encontrada"
          description="Ajuste a busca ou o filtro de status."
        />
      ) : null}

      <div className="grid gap-3">
        {filtered.map((job) => (
          <article key={job.id} className="surface-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg">{job.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {[job.companies?.name, job.seniority, job.modality].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                  {STATUS_LABEL[job.status] ?? job.status}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenJob(openJob === job.id ? null : job.id)}
                >
                  {openJob === job.id ? "Ocultar candidatos" : "Ver candidatos"}
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/especialista/validacao/$jobId" params={{ jobId: job.id }}>
                    Abrir
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => remove.mutate(job.id)}
                  disabled={remove.isPending}
                >
                  Excluir
                </Button>
              </div>
            </div>
            {openJob === job.id ? (
              <div className="mt-4 border-t border-border pt-3">
                <JobCandidates jobId={job.id} />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}
