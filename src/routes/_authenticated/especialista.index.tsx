import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Loading, PageHeader, StatCard } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, unwrap } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/especialista/")({
  component: SpecialistHome,
});

type Appointment = {
  id: string;
  date: string;
  start_time: string;
  status: string;
  companies: { name: string } | null;
  jobs: { title: string } | null;
};

function SpecialistHome() {
  const { identity } = useAuth();
  const specialistId = identity?.id ?? "";

  const appointments = useQuery({
    queryKey: ["specialist-appointments", specialistId],
    queryFn: () =>
      unwrap(
        supabase
          .from("appointments")
          .select("id, date, start_time, status, companies(name), jobs(title)")
          .eq("specialist_id", specialistId)
          .order("date", { ascending: true }),
      ) as Promise<Appointment[]>,
    enabled: !!specialistId,
  });

  const pending = useQuery({
    queryKey: ["jobs-pending-validation"],
    queryFn: () =>
      unwrap(
        supabase
          .from("jobs")
          .select("id, title, status, companies(name)")
          .in("status", ["em_diagnostico", "em_validacao"]),
      ) as Promise<{ id: string; title: string; status: string; companies: { name: string } | null }[]>,
  });

  const counters = useQuery({
    queryKey: ["specialist-counters"],
    queryFn: async () => {
      const [jobs, candidates, companies] = await Promise.all([
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null),
        supabase.from("candidates").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
      ]);
      return {
        jobs: jobs.count ?? 0,
        candidates: candidates.count ?? 0,
        companies: companies.count ?? 0,
      };
    },
  });

  const upcoming = (appointments.data ?? []).filter((item) => item.status === "agendada");

  return (
    <>
      <PageHeader
        eyebrow={identity?.name}
        title="Entendemos o trabalho antes de procurar pessoas."
        subtitle="Suas conversas, diagnósticos e validações em um só lugar."
      />

      {appointments.isLoading ? <Loading /> : null}
      {appointments.isError ? <ErrorState message={appointments.error.message} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Vagas"
          value={counters.data?.jobs ?? 0}
          hint="ver todas as oportunidades"
          to="/especialista/vagas"
        />
        <StatCard
          label="Candidatos"
          value={counters.data?.candidates ?? 0}
          hint="talentos na base"
          to="/especialista/candidatos"
        />
        <StatCard
          label="Avaliações"
          value={(pending.data ?? []).length}
          hint="diagnósticos aguardando você"
          to="/especialista/validacoes"
        />
        <StatCard
          label="Calls agendadas"
          value={upcoming.length}
          hint="próximas conversas"
          to="/especialista/agenda"
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-display text-xl">Próximas conversas</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title="Nenhuma conversa agendada"
            description="Abra sua disponibilidade para que as empresas possam agendar."
            action={
              <Button asChild>
                <Link to="/especialista/agenda">Gerenciar agenda</Link>
              </Button>
            }
          />
        ) : null}
        <div className="grid gap-3">
          {upcoming.slice(0, 4).map((appointment) => (
            <Link
              key={appointment.id}
              to="/especialista/call/$appointmentId"
              params={{ appointmentId: appointment.id }}
              className="surface-card surface-card-hover flex flex-wrap items-center justify-between gap-3 p-5"
            >
              <div>
                <p className="eyebrow">{formatDate(appointment.date)} · {appointment.start_time.slice(0, 5)}</p>
                <h3 className="mt-1 text-lg">{appointment.jobs?.title ?? "Conversa inicial"}</h3>
                <p className="text-sm text-muted-foreground">{appointment.companies?.name}</p>
              </div>
              <span className="text-sm text-primary">Abrir call</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-display text-xl">Aguardando validação</h2>
        {pending.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nada pendente por aqui.</p>
        ) : null}
        <div className="grid gap-3">
          {pending.data?.map((job) => (
            <Link
              key={job.id}
              to="/especialista/validacao/$jobId"
              params={{ jobId: job.id }}
              className="surface-card surface-card-hover flex flex-wrap items-center justify-between gap-3 p-5"
            >
              <div>
                <h3 className="text-lg">{job.title}</h3>
                <p className="text-sm text-muted-foreground">{job.companies?.name}</p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                {job.status === "em_validacao" ? "Revisar" : "Gerar diagnóstico"}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
