import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  BackButton,
  EmptyState,
  ErrorState,
  Loading,
  MockNotice,
  PageHeader,
  Progress,
} from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { asDna, unwrap } from "@/lib/data";
import { buildRoutineDay, evaluateRoutine, type RoutineAnswers } from "@/lib/routine";
import { useAuth } from "@/hooks/useAuth";
import { useStage3Open } from "@/hooks/useCandidateStages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/candidato/simulador")({
  component: RoutineSimulator,
});

type JobRow = {
  id: string;
  title: string;
  area: string | null;
  seniority: string | null;
  dna: unknown;
  companies: { name: string } | null;
};

function RoutineSimulator() {
  const { identity } = useAuth();
  const candidateId = identity?.id ?? "";
  const queryClient = useQueryClient();
  const stage3 = useStage3Open();

  const [jobId, setJobId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [order, setOrder] = useState<string[]>([]);
  const [choices, setChoices] = useState<Record<number, number>>({});
  const [note, setNote] = useState("");
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);

  const [proctorOn, setProctorOn] = useState(false);
  const [proctorError, setProctorError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const startProctoring = async () => {
    setStarting(true);
    setProctorError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setProctorOn(true);
    } catch {
      setProctorError(
        "Não conseguimos acessar sua câmera. Autorize o acesso no navegador para iniciar a rotina monitorada.",
      );
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    if (proctorOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [proctorOn, jobId, step, result]);


  const jobs = useQuery({
    queryKey: ["routine-jobs", candidateId],
    queryFn: async () => {
      const applications = (await unwrap(
        supabase.from("applications").select("job_id").eq("candidate_id", candidateId),
      )) as { job_id: string }[];
      const ids = applications.map((a) => a.job_id);
      if (ids.length === 0) return [];
      return (await unwrap(
        supabase
          .from("jobs")
          .select("id, title, area, seniority, dna, companies(name)")
          .in("id", ids),
      )) as JobRow[];
    },
    enabled: !!candidateId,
  });

  const job = jobs.data?.find((j) => j.id === jobId) ?? null;

  const day = useMemo(
    () =>
      job
        ? buildRoutineDay({
            title: job.title,
            area: job.area,
            seniority: job.seniority,
            dna: asDna(job.dna),
            companyName: job.companies?.name ?? null,
          })
        : null,
    [job],
  );

  const finish = useMutation({
    mutationFn: async (answers: RoutineAnswers) => {
      if (!day || !job) throw new Error("Rotina indisponível.");
      const evaluation = evaluateRoutine(day, answers);

      const existing = (await unwrap(
        supabase.from("simulations").select("id").eq("job_id", job.id).limit(1),
      )) as { id: string }[];

      let simulationId = existing[0]?.id;
      if (!simulationId) {
        const created = (await unwrap(
          supabase
            .from("simulations")
            .insert({
              job_id: job.id,
              title: day.title,
              intro: day.intro,
              questions: day.tasks as never,
            })
            .select("id")
            .single(),
        )) as { id: string };
        simulationId = created.id;
      }

      const { error } = await supabase.from("simulation_attempts").insert({
        simulation_id: simulationId,
        candidate_id: candidateId,
        answers: answers as never,
        score: evaluation.score,
        feedback: evaluation.feedback,
        completed_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);

      await supabase
        .from("applications")
        .update({ stage: "avaliacao" })
        .eq("candidate_id", candidateId)
        .eq("job_id", job.id);

      return evaluation;
    },
    onSuccess: async (evaluation) => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setResult(evaluation);
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reset = () => {
    setJobId(null);
    setStep(0);
    setOrder([]);
    setChoices({});
    setNote("");
    setResult(null);
  };

  if (jobs.isLoading || stage3.isLoading) return <Loading />;
  if (jobs.isError) return <ErrorState message={jobs.error.message} />;

  if (!stage3.open) {
    return (
      <>
        <BackButton to="/candidato/avaliacoes" label="Avaliações" />
        <PageHeader
          eyebrow="Simulador de rotina"
          title="Etapa 3 ainda não liberada."
          subtitle="O simulador de rotina do cliente abre quando uma empresa avança sua candidatura para a etapa 3."
        />
        <EmptyState
          title="Nada por aqui ainda"
          description="Conclua os testes da etapa 2 e acompanhe suas candidaturas."
          action={
            <Button asChild variant="outline">
              <Link to="/candidato/candidaturas">Ver candidaturas</Link>
            </Button>
          }
        />
      </>
    );
  }

  if (!proctorOn) {
    return (
      <>
        <BackButton to="/candidato/avaliacoes" label="Avaliações" />
        <PageHeader
          eyebrow="Ambiente monitorado"
          title="Antes de começar: esta rotina é gravada."
          subtitle="O simulador de rotina funciona como uma prova online supervisionada. Precisamos garantir que as decisões são suas."
        />
        <section className="surface-card space-y-5 p-8">
          <ul className="space-y-4 text-sm">
            <li className="flex gap-3">
              <MonitorSmartphone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                <strong className="font-medium">Sua tela está sendo gravada</strong> durante toda a
                rotina, incluindo mudanças de aba e janelas abertas.
              </span>
            </li>
            <li className="flex gap-3">
              <Camera className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                <strong className="font-medium">Monitoramos você pela câmera</strong> do início ao
                fim, para evitar erros de identificação ou burla no resultado.
              </span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                Não use consulta externa, IA ou ajuda de terceiros. Qualquer inconsistência é
                sinalizada para a empresa e a tentativa pode ser invalidada.
              </span>
            </li>
          </ul>
          {proctorError ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {proctorError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button size="lg" onClick={() => void startProctoring()} disabled={starting}>
              {starting ? "Ativando câmera…" : "Aceito e quero começar"}
            </Button>
            <Button asChild variant="ghost">
              <Link to="/candidato/avaliacoes">Agora não</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ao continuar você concorda com a gravação de tela e o monitoramento por câmera para fins
            de avaliação desta candidatura.
          </p>
        </section>
        <MockNotice>
          Nesta demonstração a captura é ativada no seu navegador e nada é enviado para servidores.
        </MockNotice>
      </>
    );
  }


  const proctorOverlay = (
    <div className="fixed bottom-4 right-4 z-50 w-40 overflow-hidden rounded-xl border border-border bg-foreground/90 shadow-lg">
      <video ref={videoRef} muted playsInline className="h-28 w-full object-cover" />
      <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] uppercase tracking-wide text-background">
        <span className="size-2 animate-pulse rounded-full bg-destructive" aria-hidden />
        Gravando tela e câmera
      </div>
    </div>
  );

  if (result) {
    return (
      <>
        <BackButton to="/candidato/avaliacoes" label="Avaliações" />
        <PageHeader
          eyebrow="Simulador de rotina"
          title="Rotina concluída."
          subtitle="A empresa passa a ver como você decide no dia a dia da vaga."
        />
        <section className="surface-card p-8 text-center">
          <p className="eyebrow">Resultado</p>
          <p className="text-display mt-2 text-5xl text-primary">{result.score}%</p>
          <Progress value={result.score} className="mx-auto mt-5 max-w-sm" />
          <p className="mx-auto mt-5 max-w-xl text-sm text-muted-foreground">{result.feedback}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>Simular outra vaga</Button>
            <Button asChild variant="ghost">
              <Link to="/candidato/avaliacoes">Ver avaliações</Link>
            </Button>
          </div>
        </section>
      </>
    );
  }

  if (!job || !day) {
    return (
      <>
        <BackButton to="/candidato/avaliacoes" label="Avaliações" />
        <PageHeader
          eyebrow="Simulador de rotina"
          title="Viva um dia real da vaga."
          subtitle="Escolha uma vaga em que você se candidatou: montamos a fila do dia, as decisões e a entrega escrita a partir do DNA da vaga."
        />
        {jobs.data?.length === 0 ? (
          <EmptyState
            title="Nenhuma vaga para simular"
            description="Candidate-se a uma oportunidade para liberar a rotina simulada."
            action={
              <Button asChild variant="outline">
                <Link to="/candidato/oportunidades">Ver oportunidades</Link>
              </Button>
            }
          />
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {jobs.data?.map((item) => (
            <article key={item.id} className="surface-card surface-card-hover p-5">
              <p className="eyebrow">{item.companies?.name}</p>
              <h3 className="mt-1 text-lg">{item.title}</h3>
              <p className="text-sm text-muted-foreground">
                {item.area ?? "Operação"} · {item.seniority ?? "Pleno"}
              </p>
              <Button size="sm" className="mt-4" onClick={() => setJobId(item.id)}>
                Começar o dia
              </Button>
            </article>
          ))}
        </div>
        <MockNotice>
          Rotina e avaliação geradas por IA de demonstração a partir dos dados reais da vaga.
        </MockNotice>
        {proctorOverlay}
      </>
    );
  }

  const task = day.tasks[step];
  if (!task) return <Loading />;
  const isLast = step === day.tasks.length - 1;
  const canAdvance =
    task.kind === "priority"
      ? order.length === task.items.length
      : task.kind === "choice"
        ? typeof choices[step] === "number"
        : note.trim().length > 0;

  return (
    <>
      <BackButton to="/candidato/avaliacoes" label="Avaliações" />
      <PageHeader eyebrow={day.title} title="Sua rotina começa agora." subtitle={day.intro} />

      <section className="surface-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <p className="eyebrow">Rotina diária típica</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Esta é a agenda da vaga. As tarefas abaixo seguem esses horários.
          </p>
        </div>
        <ul className="divide-y divide-border">
          {day.schedule.map((item) => (
            <li key={`${item.time}-${item.activity}`} className="flex gap-4 px-5 py-3 text-sm">
              <span className="w-14 shrink-0 font-medium text-primary">{item.time}</span>
              <span>
                <span className="font-medium">{item.activity}</span>
                <span className="block text-xs text-muted-foreground">{item.focus}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Tarefa {step + 1} de {day.tasks.length} · {task.time}
          </span>
          <span>{Math.round(((step + 1) / day.tasks.length) * 100)}%</span>
        </div>
        <Progress value={((step + 1) / day.tasks.length) * 100} />

        <section className="surface-card space-y-5 p-8">
          <div>
            <p className="eyebrow">{task.time}</p>
            <h2 className="text-display mt-1 text-xl leading-snug">{task.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{task.context}</p>
          </div>

          {task.kind === "choice" && task.code ? (
            <pre className="overflow-x-auto rounded-lg bg-foreground/95 p-4 text-xs leading-relaxed text-background">
              <code>{task.code}</code>
            </pre>
          ) : null}

          {task.kind === "priority" ? (
            <div className="space-y-2">
              {task.items.map((item) => {
                const position = order.indexOf(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setOrder((prev) =>
                        prev.includes(item.id)
                          ? prev.filter((id) => id !== item.id)
                          : [...prev, item.id],
                      )
                    }
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-4 text-left text-sm transition-colors",
                      position >= 0
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-secondary/60",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                        position >= 0
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {position >= 0 ? position + 1 : "–"}
                    </span>
                    {item.label}
                  </button>
                );
              })}
              <p className="text-xs text-muted-foreground">
                Toque na ordem em que faria cada coisa. Toque novamente para remover.
              </p>
            </div>
          ) : null}

          {task.kind === "choice" ? (
            <div className="space-y-2">
              {task.options.map((option, index) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setChoices((prev) => ({ ...prev, [step]: index }))}
                  className={cn(
                    "w-full rounded-lg border p-4 text-left text-sm transition-colors",
                    choices[step] === index
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border hover:bg-secondary/60",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}

          {task.kind === "text" ? (
            <div className="space-y-2">
              <Textarea
                rows={7}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={task.hint}
              />
              <p className="text-xs text-muted-foreground">{task.hint}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              disabled={!canAdvance || finish.isPending}
              onClick={() => {
                if (!isLast) {
                  setStep(step + 1);
                  return;
                }
                finish.mutate({ order, choices, note });
              }}
            >
              {finish.isPending ? "Avaliando…" : isLast ? "Encerrar o dia" : "Próxima tarefa"}
            </Button>
            <Button variant="ghost" onClick={reset}>
              Sair da rotina
            </Button>
          </div>
        </section>
      </div>
      {proctorOverlay}
    </>
  );
}
