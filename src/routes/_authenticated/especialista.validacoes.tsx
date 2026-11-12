import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Loading, PageHeader, SectionTabs } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/especialista/validacoes")({
  component: ValidationsPage,
});

type JobRow = {
  id: string;
  title: string;
  status: string;
  seniority: string | null;
  companies: { name: string } | null;
};

function ValidationsPage() {
  const jobs = useQuery({
    queryKey: ["jobs-validation-list"],
    queryFn: () =>
      unwrap(
        supabase
          .from("jobs")
          .select("id, title, status, seniority, companies(name)")
          .in("status", ["em_diagnostico", "em_validacao"])
          .order("created_at", { ascending: false }),
      ) as Promise<JobRow[]>,
  });

  return (
    <>
      <PageHeader
        eyebrow="Validações"
        title="Nada entra no matching sem revisão humana."
        subtitle="Revise o perfil da oportunidade antes de procurar pessoas."
      />
      <SectionTabs
        items={[
          { to: "/especialista/validacoes", label: "Validações" },
          { to: "/especialista/processos", label: "Processos" },
        ]}
      />

      {jobs.isLoading ? <Loading /> : null}
      {jobs.isError ? <ErrorState message={jobs.error.message} /> : null}
      {jobs.data?.length === 0 ? (
        <EmptyState
          title="Nada aguardando validação"
          description="Diagnósticos gerados a partir das calls aparecem aqui."
        />
      ) : null}

      <div className="grid gap-3">
        {jobs.data?.map((job) => (
          <article
            key={job.id}
            className="surface-card flex flex-wrap items-center justify-between gap-3 p-5"
          >
            <div>
              <h2 className="text-lg">{job.title}</h2>
              <p className="text-sm text-muted-foreground">
                {job.companies?.name} · {job.seniority}
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/especialista/validacao/$jobId" params={{ jobId: job.id }}>
                {job.status === "em_validacao" ? "Revisar" : "Gerar diagnóstico"}
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}
