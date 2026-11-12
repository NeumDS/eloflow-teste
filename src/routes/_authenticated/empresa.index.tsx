import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Loading, PageHeader, StatCard } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/empresa/")({
  component: CompanyHome,
});

type JobRow = { id: string; title: string; status: string; seniority: string | null };

function CompanyHome() {
  const { identity } = useAuth();
  const companyId = identity?.id ?? "";

  const jobs = useQuery({
    queryKey: ["company-jobs", companyId],
    queryFn: () =>
      unwrap(
        supabase
          .from("jobs")
          .select("id, title, status, seniority")
          .eq("company_id", companyId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
      ) as Promise<JobRow[]>,
    enabled: !!companyId,
  });

  const applications = useQuery({
    queryKey: ["company-applications", companyId, jobs.data?.length],
    queryFn: async () => {
      const ids = (jobs.data ?? []).map((job) => job.id);
      if (ids.length === 0) return [];
      return unwrap(
        supabase.from("applications").select("id, job_id, stage").in("job_id", ids),
      ) as Promise<{ id: string; stage: string }[]>;
    },
    enabled: !!jobs.data,
  });

  const shortlist = useQuery({
    queryKey: ["company-shortlist", companyId],
    queryFn: () =>
      unwrap(supabase.from("shortlists").select("id").eq("company_id", companyId)) as Promise<
        { id: string }[]
      >,
    enabled: !!companyId,
  });

  const active = (jobs.data ?? []).filter((job) => job.status === "validada");
  const pendingValidation = (applications.data ?? []).filter(
    (application) => application.stage === "avaliacao",
  );

  return (
    <>
      <PageHeader
        eyebrow={identity?.name}
        title="Encontre a pessoa certa para o trabalho."
        subtitle="Começamos pelo trabalho — não pelo currículo."
        action={
          <Button asChild>
            <Link to="/empresa/contratacao/nova">
              <Plus className="size-4" /> Nova contratação
            </Link>
          </Button>
        }
      />

      {jobs.isError ? <ErrorState message={jobs.error.message} /> : null}
      {jobs.isLoading ? <Loading /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Vagas ativas"
          value={active.length}
          hint="validadas para matching"
          to="/empresa/contratacoes"
          search={{ status: "validada" }}
        />
        <StatCard
          label="Candidatos"
          value={applications.data?.length ?? 0}
          hint="em processo"
          to="/empresa/candidatos"
        />
        <StatCard
          label="Shortlist"
          value={shortlist.data?.length ?? 0}
          hint="perfis separados"
          to="/empresa/candidatos"
        />
        <StatCard
          label="Aguardando validação"
          value={pendingValidation.length}
          hint="liberar etapa 3"
          to="/empresa/validacao"
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-display text-xl">Contratações em andamento</h2>
        {jobs.data?.length === 0 ? (
          <EmptyState
            title="Nenhuma contratação iniciada"
            description="Comece descrevendo a posição. Depois conversamos para entender o trabalho."
            action={
              <Button asChild>
                <Link to="/empresa/contratacao/nova">Nova contratação</Link>
              </Button>
            }
          />
        ) : null}
        <div className="grid gap-3">
          {jobs.data?.slice(0, 5).map((job) => (
            <Link
              key={job.id}
              to="/empresa/vaga/$jobId"
              params={{ jobId: job.id }}
              className="surface-card surface-card-hover flex flex-wrap items-center justify-between gap-3 p-5"
            >
              <div>
                <h3 className="text-lg">{job.title}</h3>
                <p className="text-sm text-muted-foreground">{job.seniority}</p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs capitalize">
                {job.status.replace("_", " ")}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
