import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, Loading, PageHeader, SectionTabs } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/empresa/contratacoes")({
  validateSearch: (search: Record<string, unknown>): { status?: string } =>
    typeof search['status'] === "string" ? { status: search['status'] } : {},
  component: HiringsPage,
});

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Aguardando conversa",
  em_diagnostico: "Diagnóstico em andamento",
  em_validacao: "Em validação",
  validada: "Ativa no matching",
};

const STATUS_FILTERS = [
  { value: "todas", label: "Todas" },
  { value: "rascunho", label: "Aguardando conversa" },
  { value: "em_diagnostico", label: "Em diagnóstico" },
  { value: "em_validacao", label: "Em validação" },
  { value: "validada", label: "Ativas" },
];

type JobRow = {
  id: string;
  title: string;
  area: string | null;
  modality: string | null;
  location: string | null;
  urgency: string | null;
  status: string;
};

function HiringsPage() {
  const { status } = Route.useSearch();
  const navigate = useNavigate();
  const { identity } = useAuth();
  const companyId = identity?.id ?? "";
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const activeStatus = status ?? "todas";

  const jobs = useQuery({
    queryKey: ["company-jobs", companyId],
    queryFn: () =>
      unwrap(
        supabase
          .from("jobs")
          .select("id, title, area, modality, location, urgency, status")
          .eq("company_id", companyId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
      ) as Promise<JobRow[]>,
    enabled: !!companyId,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("jobs")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .eq("company_id", companyId);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Vaga removida.");
      await queryClient.invalidateQueries({ queryKey: ["company-jobs", companyId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = (jobs.data ?? []).filter((job) => {
    const matchesStatus = activeStatus === "todas" || job.status === activeStatus;
    const haystack = [job.title, job.area, job.location, job.modality]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesStatus && haystack.includes(term.trim().toLowerCase());
  });

  return (
    <>
      <PageHeader
        eyebrow="Contratações"
        title="Suas contratações"
        subtitle="Cada posição passa por conversa, diagnóstico e validação antes do matching."
        action={
          <Button asChild>
            <Link to="/empresa/contratacao/nova">
              <Plus className="size-4" /> Nova contratação
            </Link>
          </Button>
        }
      />
      <SectionTabs
        items={[
          { to: "/empresa/contratacoes", label: "Contratações" },
          { to: "/empresa/desafios", label: "Desafios" },
          { to: "/empresa/contratacao/nova", label: "Nova contratação" },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() =>
                void navigate({
                  to: "/empresa/contratacoes",
                  search: filter.value === "todas" ? {} : { status: filter.value },
                })
              }
              className={cn(
                "rounded-full border border-border px-3 py-1.5 text-xs transition-colors",
                activeStatus === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Buscar por cargo, área ou local"
          className="sm:max-w-xs"
          aria-label="Buscar contratações"
        />
      </div>

      {jobs.isLoading ? <Loading /> : null}
      {jobs.isError ? <ErrorState message={jobs.error.message} /> : null}
      {jobs.data && filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma contratação encontrada"
          description="Ajuste os filtros ou comece uma nova contratação."
          action={
            <Button asChild>
              <Link to="/empresa/contratacao/nova">Nova contratação</Link>
            </Button>
          }
        />
      ) : null}

      <div className="grid gap-3">
        {filtered.map((job) => (
          <article key={job.id} className="surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg">{job.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {[job.area, job.modality, job.location].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                {STATUS_LABEL[job.status] ?? job.status}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/empresa/vaga/$jobId" params={{ jobId: job.id }}>
                  Abrir contratação
                </Link>
              </Button>
              {job.status !== "validada" ? (
                <Button asChild size="sm" variant="ghost">
                  <Link to="/empresa/agendar/$jobId" params={{ jobId: job.id }}>
                    Agendar conversa
                  </Link>
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => remove.mutate(job.id)}
                disabled={remove.isPending}
              >
                <Trash2 className="size-3.5" /> Excluir
              </Button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
