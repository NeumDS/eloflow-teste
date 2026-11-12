import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Loading, PageHeader, SectionTabs } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, unwrap } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/especialista/calls")({
  component: SpecialistCalls,
});

type Appointment = {
  id: string;
  date: string;
  start_time: string;
  status: string;
  notes: string | null;
  companies: { name: string } | null;
  jobs: { title: string } | null;
};

function SpecialistCalls() {
  const { identity } = useAuth();
  const specialistId = identity?.id ?? "";

  const appointments = useQuery({
    queryKey: ["specialist-appointments", specialistId],
    queryFn: () =>
      unwrap(
        supabase
          .from("appointments")
          .select("id, date, start_time, status, notes, companies(name), jobs(title)")
          .eq("specialist_id", specialistId)
          .order("date", { ascending: false }),
      ) as Promise<Appointment[]>,
    enabled: !!specialistId,
  });

  return (
    <>
      <PageHeader
        eyebrow="Calls"
        title="Conversas com empresas"
        subtitle="Cada conversa se transforma em diagnóstico e depois em oportunidade validada."
      />
      <SectionTabs
        items={[
          { to: "/especialista/agenda", label: "Agenda" },
          { to: "/especialista/calls", label: "Calls" },
        ]}
      />

      {appointments.isLoading ? <Loading /> : null}
      {appointments.isError ? <ErrorState message={appointments.error.message} /> : null}
      {appointments.data?.length === 0 ? (
        <EmptyState title="Nenhuma call ainda" description="Abra disponibilidade na sua agenda." />
      ) : null}

      <div className="grid gap-3">
        {appointments.data?.map((appointment) => (
          <article key={appointment.id} className="surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">
                  {formatDate(appointment.date)} · {appointment.start_time.slice(0, 5)}
                </p>
                <h2 className="mt-1 text-lg">{appointment.jobs?.title ?? "Conversa inicial"}</h2>
                <p className="text-sm text-muted-foreground">{appointment.companies?.name}</p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs capitalize">
                {appointment.status}
              </span>
            </div>
            {appointment.notes ? (
              <p className="mt-3 text-sm text-muted-foreground">“{appointment.notes}”</p>
            ) : null}
            <Button asChild size="sm" className="mt-4">
              <Link
                to="/especialista/call/$appointmentId"
                params={{ appointmentId: appointment.id }}
              >
                Abrir call
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}
