import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BackButton, EmptyState, ErrorState, Loading, PageHeader } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import {
  addMinutes,
  buildSlots,
  formatDate,
  nextWeekdays,
  notify,
  toISODate,
  unwrap,
} from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/empresa/agendar/$jobId")({
  component: SchedulePage,
});

type Availability = {
  specialist_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
};

function SchedulePage() {
  const { jobId } = Route.useParams();
  const { identity } = useAuth();
  const companyId = identity?.id ?? "";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const days = nextWeekdays(10);
  const [date, setDate] = useState<Date>(days[0] ?? new Date());
  const [slot, setSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState<{ date: string; time: string } | null>(null);

  const specialist = useQuery({
    queryKey: ["specialist-first"],
    queryFn: () =>
      unwrap(
        supabase.from("specialists").select("id, full_name, email, focus").limit(1).single(),
      ) as Promise<{ id: string; full_name: string; email: string; focus: string | null }>,
  });

  const availability = useQuery({
    queryKey: ["availability", specialist.data?.id],
    queryFn: () =>
      unwrap(
        supabase
          .from("specialist_availability")
          .select("*")
          .eq("specialist_id", specialist.data!.id),
      ) as Promise<Availability[]>,
    enabled: !!specialist.data?.id,
  });

  const taken = useQuery({
    queryKey: ["appointments-day", specialist.data?.id, toISODate(date)],
    queryFn: () =>
      unwrap(
        supabase
          .from("appointments")
          .select("start_time, status")
          .eq("specialist_id", specialist.data!.id)
          .eq("date", toISODate(date))
          .neq("status", "cancelada"),
      ) as Promise<{ start_time: string }[]>,
    enabled: !!specialist.data?.id,
  });

  const book = useMutation({
    mutationFn: async () => {
      if (!slot || !specialist.data) throw new Error("Escolha um horário.");
      const conflicts = (await unwrap(
        supabase
          .from("appointments")
          .select("id")
          .eq("specialist_id", specialist.data.id)
          .eq("date", toISODate(date))
          .eq("start_time", `${slot}:00`)
          .neq("status", "cancelada"),
      )) as { id: string }[];
      if (conflicts.length > 0) throw new Error("Esse horário acabou de ser ocupado.");

      const { error } = await supabase.from("appointments").insert({
        company_id: companyId,
        specialist_id: specialist.data.id,
        job_id: jobId,
        date: toISODate(date),
        start_time: `${slot}:00`,
        end_time: `${addMinutes(slot, 45)}:00`,
        status: "agendada",
        meeting_url: `https://meet.eloflow.app/${jobId.slice(0, 8)}`,
        notes,
      });
      if (error) throw new Error(error.message);
      await supabase.from("jobs").update({ status: "em_diagnostico" }).eq("id", jobId);
      await notify(
        specialist.data.email,
        "Nova conversa agendada",
        `${identity?.name} agendou uma conversa em ${formatDate(toISODate(date))} às ${slot}.`,
      );
      return { date: toISODate(date), time: slot };
    },
    onSuccess: async (value) => {
      setConfirmed(value);
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (specialist.isLoading) return <Loading />;
  if (specialist.isError) return <ErrorState message={specialist.error.message} />;

  if (confirmed) {
    return (
      <>
        <BackButton to="/empresa/contratacoes" label="Contratações" />
        <PageHeader
          eyebrow="Conversa agendada"
          title="Está confirmado."
          subtitle="Você recebe o link da reunião na sua agenda."
        />
        <section className="surface-card max-w-xl p-8">
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <Check className="size-4" /> {formatDate(confirmed.date)} às {confirmed.time}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Com {specialist.data?.full_name} — {specialist.data?.focus}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/empresa/agenda">Ver agenda</Link>
            </Button>
            <Button variant="ghost" onClick={() => void navigate({ to: "/empresa/contratacoes" })}>
              Voltar às contratações
            </Button>
          </div>
        </section>
      </>
    );
  }

  const slots = buildSlots(
    availability.data ?? [],
    date,
    (taken.data ?? []).map((item) => item.start_time),
  );

  return (
    <>
      <BackButton to="/empresa/vaga/$jobId" label="Vaga" params={{ jobId }} />
      <PageHeader
        eyebrow="Conversa com especialista"
        title="Escolha o melhor horário."
        subtitle={`45 minutos com ${specialist.data?.full_name}. Sem formulário longo, só uma boa conversa.`}
      />

      <section className="surface-card space-y-6 p-6">
        <div>
          <p className="eyebrow">Data</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {days.map((day) => {
              const iso = toISODate(day);
              const selected = iso === toISODate(date);
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    setDate(day);
                    setSlot(null);
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-secondary/60",
                  )}
                >
                  {formatDate(iso)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="eyebrow">Horário</p>
          {availability.isLoading || taken.isLoading ? <Loading label="Buscando horários…" /> : null}
          {slots.length === 0 && !availability.isLoading ? (
            <EmptyState
              title="Sem horários neste dia"
              description="Escolha outra data — a agenda do especialista muda por dia da semana."
            />
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {slots.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSlot(time)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm transition-colors",
                    slot === time
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-secondary/60",
                  )}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="eyebrow">O que é urgente nessa posição? (opcional)</p>
          <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>

        <Button size="lg" disabled={!slot || book.isPending} onClick={() => book.mutate()}>
          {book.isPending ? "Confirmando…" : "Confirmar conversa"}
        </Button>
      </section>
    </>
  );
}
