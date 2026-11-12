import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, ErrorState, Loading, PageHeader, SectionTabs } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/especialista/empresas")({
  component: SpecialistCompanies,
});

type CompanyRow = {
  id: string;
  name: string;
  industry: string | null;
  size: string | null;
  about: string | null;
  jobs: { id: string; status: string }[];
};

function SpecialistCompanies() {
  const companies = useQuery({
    queryKey: ["all-companies"],
    queryFn: () =>
      unwrap(
        supabase.from("companies").select("*, jobs(id, status)").order("name"),
      ) as Promise<CompanyRow[]>,
  });

  return (
    <>
      <PageHeader
        eyebrow="Empresas"
        title="Quem está contratando"
        subtitle="Contexto do negócio antes do contexto da vaga."
      />
      <SectionTabs
        items={[
          { to: "/especialista/empresas", label: "Empresas" },
          { to: "/especialista/candidatos", label: "Candidatos" },
        ]}
      />

      {companies.isLoading ? <Loading /> : null}
      {companies.isError ? <ErrorState message={companies.error.message} /> : null}
      {companies.data?.length === 0 ? (
        <EmptyState title="Nenhuma empresa" description="Nenhuma empresa cadastrada ainda." />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {companies.data?.map((company) => (
          <article key={company.id} className="surface-card p-5">
            <h2 className="text-lg">{company.name}</h2>
            <p className="text-sm text-muted-foreground">
              {[company.industry, company.size].filter(Boolean).join(" · ")}
            </p>
            {company.about ? (
              <p className="mt-3 text-sm text-muted-foreground">{company.about}</p>
            ) : null}
            <p className="eyebrow mt-4">
              {company.jobs.length} contratação(ões) ·{" "}
              {company.jobs.filter((job) => job.status === "validada").length} ativa(s)
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
