import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Loading, PageHeader } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, unwrap } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/empresa/agenda")({
  component: CompanyAgenda,
});

type Appointment = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  meeting_url: string | null;
  jobs: { id: string; title: string } | null;
  specialists: { full_name: string } | null;
};

const STATUS_RANK: Record<string, number> = {
  agendada: 0,
  realizada: 1,
  cancelada: 2,
};

function CompanyAgenda() {
  const { identity } = useAuth();
  const companyId = identity?.id ?? "";
  const queryClient = useQueryClient();

  const appointments = useQuery({
    queryKey: ["company-appointments", companyId],
    queryFn: () =>
      unwrap(
        supabase
          .from("appointments")
          .select("*, jobs(id, title), specialists(full_name)")
          .eq("company_id", companyId)
          .order("date", { ascending: true }),
      ) as Promise<Appointment[]>,
    enabled: !!companyId,
  });

  const ordered = [...(appointments.data ?? [])].sort((a, b) => {
    const rank = (status: string) => STATUS_RANK[status] ?? 99;
    if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
    return `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`);
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelada" })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Conversa cancelada.");
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Agenda"
        title="Suas conversas"
        subtitle="Ordenadas por status: agendadas primeiro, depois realizadas e canceladas."
      />

      {appointments.isLoading ? <Loading /> : null}
      {appointments.isError ? <ErrorState message={appointments.error.message} /> : null}
      {appointments.data?.length === 0 ? (
        <EmptyState
          title="Nenhuma conversa agendada"
          description="Inicie uma contratação e agende a conversa com o especialista."
          action={
            <Button asChild>
              <Link to="/empresa/contratacao/nova">Nova contratação</Link>
            </Button>
          }
        />
      ) : null}

      <div className="grid gap-3">
        {ordered.map((appointment) => (
          <article key={appointment.id} className="surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">{formatDate(appointment.date)}</p>
                <h2 className="mt-1 text-lg">{appointment.jobs?.title ?? "Conversa inicial"}</h2>
                <p className="text-sm text-muted-foreground">
                  {appointment.start_time.slice(0, 5)} – {appointment.end_time.slice(0, 5)} ·{" "}
                  {appointment.specialists?.full_name}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs capitalize">
                {appointment.status}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {appointment.jobs ? (
                <Button asChild size="sm" variant="outline">
                  <Link to="/empresa/vaga/$jobId" params={{ jobId: appointment.jobs.id }}>
                    Ver contratação
                  </Link>
                </Button>
              ) : null}
              {appointment.status === "agendada" ? (
                <>
                  {appointment.meeting_url ? (
                    <Button asChild size="sm" variant="ghost">
                      <a href={appointment.meeting_url} target="_blank" rel="noreferrer">
                        Link da reunião
                      </a>
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => cancel.mutate(appointment.id)}>
                    Cancelar
                  </Button>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
