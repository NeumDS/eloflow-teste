import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState, Loading, MockNotice, PageHeader } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, unwrap } from "@/lib/data";
import { AIService, type Diagnosis } from "@/lib/ai";

export const Route = createFileRoute("/_authenticated/especialista/call/$appointmentId")({
  component: CallRoom,
});

type Appointment = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  meeting_url: string | null;
  notes: string | null;
  job_id: string | null;
  companies: { name: string } | null;
  jobs: { id: string; title: string; area: string | null; seniority: string | null } | null;
};

type CallRow = {
  id: string;
  transcript: string | null;
  status: string;
  diagnosis: Diagnosis | null;
};

function CallRoom() {
  const { appointmentId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const appointment = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: () =>
      unwrap(
        supabase
          .from("appointments")
          .select("*, companies(name), jobs(id, title, area, seniority)")
          .eq("id", appointmentId)
          .single(),
      ) as Promise<Appointment>,
  });

  const call = useQuery({
    queryKey: ["call", appointmentId],
    queryFn: () =>
      unwrap(
        supabase.from("calls").select("*").eq("appointment_id", appointmentId).maybeSingle(),
      ) as Promise<CallRow | null>,
  });

  const finishCall = useMutation({
    mutationFn: async () => {
      const job = appointment.data?.jobs;
      const transcript = await AIService.transcribeCall({
        title: job?.title ?? "a posição",
        company: appointment.data?.companies?.name ?? "A empresa",
      });
      const { error } = await supabase.from("calls").insert({
        appointment_id: appointmentId,
        job_id: appointment.data?.job_id ?? null,
        transcript,
        status: "transcrita",
      });
      if (error) throw new Error(error.message);
      await supabase.from("appointments").update({ status: "concluida" }).eq("id", appointmentId);
    },
    onSuccess: async () => {
      toast.success("Call concluída e transcrita.");
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const generate = useMutation({
    mutationFn: async () => {
      const job = appointment.data?.jobs;
      if (!job) throw new Error("Esta conversa não está ligada a uma vaga.");
      const diagnosis = await AIService.analyzeCall({
        title: job.title,
        area: job.area,
        seniority: job.seniority,
      });
      await supabase
        .from("calls")
        .update({ diagnosis, status: "diagnosticada" })
        .eq("appointment_id", appointmentId);
      const { error } = await supabase
        .from("jobs")
        .update({ diagnosis, status: "em_validacao" })
        .eq("id", job.id);
      if (error) throw new Error(error.message);
      return job.id;
    },
    onSuccess: async (jobId) => {
      await queryClient.invalidateQueries();
      toast.success("Diagnóstico gerado. Revise antes de validar.");
      void navigate({ to: "/especialista/validacao/$jobId", params: { jobId } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (appointment.isLoading) return <Loading />;
  if (appointment.isError) return <ErrorState message={appointment.error.message} />;

  const data = appointment.data!;
  const diagnosis = call.data?.diagnosis;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link to="/especialista/calls">
          <ArrowLeft className="size-3.5" /> Calls
        </Link>
      </Button>

      <PageHeader
        eyebrow={`${formatDate(data.date)} · ${data.start_time.slice(0, 5)}`}
        title={data.jobs?.title ?? "Conversa inicial"}
        subtitle={data.companies?.name ?? undefined}
      />

      <MockNotice>
        Reunião e transcrição em modo demonstração: nenhuma API de vídeo ou de IA está conectada
        neste MVP.
      </MockNotice>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="surface-card flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
          <Video className="size-8 text-primary" aria-hidden />
          <p className="text-display text-xl">
            {data.status === "concluida" ? "Conversa concluída" : "Sala da conversa"}
          </p>
          {data.meeting_url ? (
            <a
              href={data.meeting_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              {data.meeting_url}
            </a>
          ) : null}
          {data.notes ? (
            <p className="max-w-md text-sm text-muted-foreground">“{data.notes}”</p>
          ) : null}
          {!call.data ? (
            <Button onClick={() => finishCall.mutate()} disabled={finishCall.isPending}>
              {finishCall.isPending ? "Transcrevendo…" : "Simular call concluída"}
            </Button>
          ) : null}
        </section>

        <aside className="surface-card p-6">
          <p className="eyebrow">Diagnóstico em construção</p>
          {diagnosis ? (
            <div className="mt-4 space-y-4 text-sm">
              {[
                ["Atividades", diagnosis.responsabilidades],
                ["Skills", diagnosis.skills],
                ["Problemas", diagnosis.problemas],
              ].map(([label, items]) => (
                <div key={label as string}>
                  <p className="eyebrow">{label as string}</p>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    {(items as string[]).slice(0, 4).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <div>
                <p className="eyebrow">Senioridade</p>
                <p className="mt-1 text-muted-foreground">{diagnosis.senioridade}</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              A IA preenche atividades, skills, problemas e senioridade a partir da conversa. Conclua
              a call para gerar a transcrição.
            </p>
          )}
        </aside>
      </div>

      {call.data?.transcript ? (
        <section className="surface-card space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-display text-xl">Transcrição da conversa</h2>
            {!diagnosis ? (
              <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
                {generate.isPending ? "Analisando…" : "Gerar diagnóstico"}
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link
                  to="/especialista/validacao/$jobId"
                  params={{ jobId: data.jobs?.id ?? "" }}
                >
                  Revisar diagnóstico
                </Link>
              </Button>
            )}
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            {call.data.transcript.split("\n\n").map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
