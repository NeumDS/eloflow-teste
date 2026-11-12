import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  Loading,
  MatchBadge,
  PageHeader,
  SectionTabs,
} from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { STAGE_LABEL, stageNumber } from "@/lib/stages";

export const Route = createFileRoute("/_authenticated/empresa/validacao")({
  component: CompanyValidation,
});

type ApplicationRow = {
  id: string;
  match_score: number;
  reasons: string[] | null;
  stage: string;
  candidates: { id: string; full_name: string; headline: string | null } | null;
  jobs: { id: string; title: string } | null;
};

function CompanyValidation() {
  const { identity } = useAuth();
  const companyId = identity?.id ?? "";

  const jobs = useQuery({
    queryKey: ["company-job-ids", companyId],
    queryFn: () =>
      unwrap(
        supabase.from("jobs").select("id").eq("company_id", companyId).is("deleted_at", null),
      ) as Promise<{ id: string }[]>,
    enabled: !!companyId,
  });

  const applications = useQuery({
    queryKey: ["company-validation", companyId, jobs.data?.length],
    queryFn: async () => {
      const ids = (jobs.data ?? []).map((job) => job.id);
      if (ids.length === 0) return [];
      return unwrap(
        supabase
          .from("applications")
          .select(
            "id, match_score, reasons, stage, candidates(id, full_name, headline), jobs(id, title)",
          )
          .in("job_id", ids)
          .order("match_score", { ascending: false }),
      ) as Promise<ApplicationRow[]>;
    },
    enabled: !!jobs.data,
  });

  const pending = (applications.data ?? []).filter((item) => stageNumber(item.stage) === 2);
  const released = (applications.data ?? []).filter((item) => stageNumber(item.stage) === 3);

  return (
    <>
      <PageHeader
        eyebrow="Validação"
        title="Quem avança para a etapa 3?"
        subtitle="Na etapa 3 o candidato entra no simulador de rotina da vaga e na entrevista."
      />
      <SectionTabs
        items={[
          { to: "/empresa/candidatos", label: "Candidatos" },
          { to: "/empresa/validacao", label: "Validação" },
        ]}
      />

      {applications.isLoading ? <Loading /> : null}
      {applications.isError ? <ErrorState message={applications.error.message} /> : null}

      <section className="space-y-3">
        <h2 className="text-display text-xl">Aguardando sua validação</h2>
        {applications.data && pending.length === 0 ? (
          <EmptyState
            title="Nada para validar agora"
            description="Quando um candidato concluir a etapa 2, ele aparece aqui para você liberar a etapa 3."
            action={
              <Button asChild>
                <Link to="/empresa/candidatos">Ver candidatos</Link>
              </Button>
            }
          />
        ) : null}
        <div className="grid gap-3">
          {pending.map((application) => (
            <article key={application.id} className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">{application.jobs?.title}</p>
                  <h3 className="mt-1 text-lg">{application.candidates?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {application.candidates?.headline} · Etapa atual:{" "}
                    {STAGE_LABEL[application.stage] ?? application.stage}
                  </p>
                </div>
                <MatchBadge score={application.match_score} />
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {(application.reasons ?? []).map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                {application.candidates ? (
                  <Button asChild size="sm">
                    <Link
                      to="/empresa/candidato/$candidateId"
                      params={{ candidateId: application.candidates.id }}
                    >
                      Abrir perfil e liberar etapa 3
                    </Link>
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-display text-xl">Etapa 3 liberada</h2>
        {released.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum candidato na etapa 3 ainda.</p>
        ) : null}
        <div className="grid gap-3">
          {released.map((application) => (
            <article
              key={application.id}
              className="surface-card flex flex-wrap items-center justify-between gap-3 p-5"
            >
              <div>
                <p className="eyebrow">{application.jobs?.title}</p>
                <h3 className="mt-1 text-lg">{application.candidates?.full_name}</h3>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                {STAGE_LABEL[application.stage] ?? application.stage}
              </span>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
