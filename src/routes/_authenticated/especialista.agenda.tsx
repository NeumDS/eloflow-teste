import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ErrorState, Loading, PageHeader, SectionTabs } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, unwrap } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/especialista/agenda")({
  component: SpecialistAgenda,
});

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const hhmm = (value?: string | null) => (value ? String(value).slice(0, 5) : "--:--");
const dayLabel = (day?: number | null) =>
  typeof day === "number" && DAYS[day] ? DAYS[day] : "Dia não definido";

type Availability = {
  id: string;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
  active: boolean | null;
};

type Appointment = {
  id: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  companies: { name: string } | null;
  jobs: { title: string } | null;
};

function SpecialistAgenda() {
  const { identity, loading } = useAuth();
  const specialistId = identity?.role === "especialista" ? identity.id : "";
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ day_of_week: "1", start_time: "09:00", end_time: "12:00" });

  const availability = useQuery({
    queryKey: ["availability-manage", specialistId],
    queryFn: () =>
      unwrap(
        supabase
          .from("specialist_availability")
          .select("id, day_of_week, start_time, end_time, active")
          .eq("specialist_id", specialistId)
          .order("day_of_week", { ascending: true }),
      ) as Promise<Availability[]>,
    enabled: !!specialistId,
  });

  const appointments = useQuery({
    queryKey: ["specialist-appointments", specialistId],
    queryFn: () =>
      unwrap(
        supabase
          .from("appointments")
          .select("id, date, start_time, end_time, status, companies(name), jobs(title)")
          .eq("specialist_id", specialistId)
          .order("date", { ascending: true }),
      ) as Promise<Appointment[]>,
    enabled: !!specialistId,
  });

  const addWindow = useMutation({
    mutationFn: async () => {
      if (!specialistId) throw new Error("Sessão de especialista não identificada.");
      if (form.end_time <= form.start_time)
        throw new Error("O horário final precisa ser depois do inicial.");
      const { error } = await supabase.from("specialist_availability").insert({
        specialist_id: specialistId,
        day_of_week: Number(form.day_of_week),
        start_time: `${form.start_time}:00`,
        end_time: `${form.end_time}:00`,
        active: true,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Disponibilidade criada.");
      await queryClient.invalidateQueries({ queryKey: ["availability-manage", specialistId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggle = useMutation({
    mutationFn: async (item: Availability) => {
      const { error } = await supabase
        .from("specialist_availability")
        .update({ active: !item.active })
        .eq("id", item.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["availability-manage", specialistId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeWindow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("specialist_availability").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Disponibilidade removida.");
      await queryClient.invalidateQueries({ queryKey: ["availability-manage", specialistId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Agenda atualizada.");
      await queryClient.invalidateQueries({ queryKey: ["specialist-appointments", specialistId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (loading) return <Loading />;

  if (!specialistId) {
    return (
      <>
        <PageHeader
          eyebrow="Agenda"
          title="Área do especialista."
          subtitle="Entre com uma conta de especialista para gerenciar disponibilidade e calls."
        />
        <EmptyState
          title="Sessão sem perfil de especialista"
          description="Sua conta atual não está vinculada a um especialista."
          action={
            <Button asChild variant="outline">
              <Link to="/auth" search={{ perfil: "candidato" }}>
                Trocar de conta
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Agenda"
        title="Sua disponibilidade e suas conversas."
        subtitle="Empresas só conseguem agendar dentro das janelas que você abrir."
      />
      <SectionTabs
        items={[
          { to: "/especialista/agenda", label: "Agenda" },
          { to: "/especialista/calls", label: "Calls" },
        ]}
      />

      <section className="surface-card space-y-5 p-6">
        <p className="eyebrow">Nova disponibilidade</p>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Dia</Label>
            <Select
              value={form.day_of_week}
              onValueChange={(value) => setForm({ ...form, day_of_week: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day, index) => (
                  <SelectItem key={day} value={String(index)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="start">Início</Label>
            <Input
              id="start"
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end">Fim</Label>
            <Input
              id="end"
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={() => addWindow.mutate()} disabled={addWindow.isPending}>
              {addWindow.isPending ? "Criando…" : "Criar"}
            </Button>
          </div>
        </div>

        {availability.isLoading ? <Loading /> : null}
        {availability.isError ? <ErrorState message={availability.error.message} /> : null}
        {availability.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma janela aberta. Crie a primeira acima.
          </p>
        ) : null}
        <div className="grid gap-2">
          {(availability.data ?? []).map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary/60 px-4 py-3"
            >
              <p className="text-sm">
                {dayLabel(item.day_of_week)} · {hhmm(item.start_time)} – {hhmm(item.end_time)}
                {item.active ? "" : " · bloqueada"}
              </p>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => toggle.mutate(item)}>
                  {item.active ? "Bloquear" : "Reativar"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => removeWindow.mutate(item.id)}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-display text-xl">Conversas</h2>
        {appointments.isLoading ? <Loading /> : null}
        {appointments.isError ? <ErrorState message={appointments.error.message} /> : null}
        {appointments.data?.length === 0 ? (
          <EmptyState
            title="Nenhuma conversa agendada"
            description="Assim que uma empresa agendar, ela aparece aqui."
          />
        ) : null}
        <div className="grid gap-3">
          {(appointments.data ?? []).map((appointment) => (
            <article key={appointment.id} className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">
                    {appointment.date ? formatDate(appointment.date) : "Data a definir"} ·{" "}
                    {hhmm(appointment.start_time)} – {hhmm(appointment.end_time)}
                  </p>
                  <h3 className="mt-1 text-lg">{appointment.jobs?.title ?? "Conversa inicial"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {appointment.companies?.name ?? "Empresa"}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs capitalize">
                  {appointment.status ?? "agendada"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link
                    to="/especialista/call/$appointmentId"
                    params={{ appointmentId: appointment.id }}
                  >
                    Abrir call
                  </Link>
                </Button>
                {appointment.status === "agendada" ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        updateStatus.mutate({ id: appointment.id, status: "reagendar" })
                      }
                    >
                      Pedir reagendamento
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        updateStatus.mutate({ id: appointment.id, status: "cancelada" })
                      }
                    >
                      Cancelar
                    </Button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
