import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  EmptyState,
  ErrorState,
  Loading,
  MatchBadge,
  PageHeader,
  SectionTabs,
} from "@/components/eloflow/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/empresa/candidatos")({
  component: CompanyCandidates,
});

type ApplicationRow = {
  id: string;
  match_score: number;
  reasons: string[];
  stage: string;
  candidates: { id: string; full_name: string; headline: string | null } | null;
  jobs: { id: string; title: string } | null;
};

type ShortlistRow = {
  id: string;
  candidates: { id: string; full_name: string; headline: string | null; skills: string[] | null } | null;
  jobs: { title: string } | null;
};

function CompanyCandidates() {
  const { identity } = useAuth();
  const companyId = identity?.id ?? "";

  const [jobFilter, setJobFilter] = useState("todas");

  const jobs = useQuery({
    queryKey: ["company-job-ids", companyId],
    queryFn: () =>
      unwrap(
        supabase.from("jobs").select("id, title").eq("company_id", companyId).is("deleted_at", null),
      ) as Promise<{ id: string; title: string }[]>,
    enabled: !!companyId,
  });

  const applications = useQuery({
    queryKey: ["company-applications-full", companyId, jobs.data?.length],
    queryFn: async () => {
      const ids = (jobs.data ?? []).map((job) => job.id);
      if (ids.length === 0) return [];
      return unwrap(
        supabase
          .from("applications")
          .select("id, match_score, reasons, stage, candidates(id, full_name, headline), jobs(id, title)")
          .in("job_id", ids)
          .order("match_score", { ascending: false }),
      ) as Promise<ApplicationRow[]>;
    },
    enabled: !!jobs.data,
  });

  const shortlist = useQuery({
    queryKey: ["company-shortlist-full", companyId],
    queryFn: () =>
      unwrap(
        supabase
          .from("shortlists")
          .select("id, candidates(id, full_name, headline, skills), jobs(title)")
          .eq("company_id", companyId),
      ) as Promise<ShortlistRow[]>,
    enabled: !!companyId,
  });

  return (
    <>
      <PageHeader
        eyebrow="Candidatos"
        title="Pessoas em processo com você."
        subtitle="Poucos perfis, com evidências do que já fizeram."
      />
      <SectionTabs
        items={[
          { to: "/empresa/candidatos", label: "Candidatos" },
          { to: "/empresa/validacao", label: "Validação" },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <p className="eyebrow">Filtrar por vaga</p>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as vagas</SelectItem>
            {(jobs.data ?? []).map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {applications.isLoading ? <Loading /> : null}
      {applications.isError ? <ErrorState message={applications.error.message} /> : null}

      <section className="space-y-3">
        <h2 className="text-display text-xl">Separamos os perfis mais aderentes.</h2>
        {shortlist.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum candidato na shortlist ainda. Adicione a partir do matching de uma vaga.
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {shortlist.data?.map((item) => (
            <article key={item.id} className="surface-card p-5">
              <p className="eyebrow">{item.jobs?.title}</p>
              <h3 className="mt-1 text-lg">{item.candidates?.full_name}</h3>
              <p className="text-sm text-muted-foreground">{item.candidates?.headline}</p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {(item.candidates?.skills ?? []).slice(0, 3).map((skill) => (
                  <li key={skill}>• {skill}</li>
                ))}
              </ul>
              {item.candidates ? (
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link
                    to="/empresa/candidato/$candidateId"
                    params={{ candidateId: item.candidates.id }}
                  >
                    Ver candidato
                  </Link>
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-display text-xl">Candidaturas recebidas</h2>
        {applications.data?.length === 0 ? (
          <EmptyState
            title="Nenhuma candidatura ainda"
            description="Depois de validar uma vaga, os candidatos compatíveis são convidados."
            action={
              <Button asChild>
                <Link to="/empresa/contratacoes">Ver contratações</Link>
              </Button>
            }
          />
        ) : null}
        <div className="grid gap-3">
          {(applications.data ?? [])
            .filter((application) => jobFilter === "todas" || application.jobs?.id === jobFilter)
            .map((application) => (
            <article key={application.id} className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg">{application.candidates?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {application.jobs?.title} · {application.stage.replace("_", " ")}
                  </p>
                </div>
                <MatchBadge score={application.match_score} />
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {(application.reasons ?? []).map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
              {application.candidates ? (
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link
                    to="/empresa/candidato/$candidateId"
                    params={{ candidateId: application.candidates.id }}
                  >
                    Ver perfil
                  </Link>
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
