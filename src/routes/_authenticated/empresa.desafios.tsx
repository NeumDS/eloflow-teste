import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ErrorState, Loading, PageHeader, SectionTabs } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/empresa/desafios")({
  validateSearch: (search: Record<string, unknown>): { vaga?: string } =>
    typeof search['vaga'] === "string" ? { vaga: search['vaga'] } : {},
  component: CompanyChallenges,
});

type ChallengeRow = {
  id: string;
  job_id: string | null;
  title: string;
  problem: string;
  context: string | null;
  deadline: string | null;
  competencies: string[] | null;
  status: string;
  jobs: { title: string } | null;
};

type SubmissionRow = {
  id: string;
  challenge_id: string;
  answer: string | null;
  link: string | null;
  video_url: string | null;
  file_name: string | null;
  score: number | null;
  feedback: string | null;
  candidates: { id: string; full_name: string } | null;
};

function CompanyChallenges() {
  const { vaga } = Route.useSearch();
  const { identity } = useAuth();
  const companyId = identity?.id ?? "";
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(!!vaga);
  const [form, setForm] = useState({
    title: "",
    problem: "",
    context: "",
    deadline: "",
    competencies: "",
    job_id: vaga ?? "",
  });

  const jobs = useQuery({
    queryKey: ["company-jobs", companyId],
    queryFn: () =>
      unwrap(
        supabase.from("jobs").select("id, title, status").eq("company_id", companyId),
      ) as Promise<{ id: string; title: string; status: string }[]>,
    enabled: !!companyId,
  });

  const challenges = useQuery({
    queryKey: ["company-challenges", companyId],
    queryFn: () =>
      unwrap(
        supabase
          .from("challenges")
          .select("*, jobs(title)")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false }),
      ) as Promise<ChallengeRow[]>,
    enabled: !!companyId,
  });

  const submissions = useQuery({
    queryKey: ["company-submissions", challenges.data?.length],
    queryFn: async () => {
      const ids = (challenges.data ?? []).map((challenge) => challenge.id);
      if (ids.length === 0) return [];
      return unwrap(
        supabase
          .from("challenge_submissions")
          .select("*, candidates(id, full_name)")
          .in("challenge_id", ids),
      ) as Promise<SubmissionRow[]>;
    },
    enabled: !!challenges.data,
  });

  const publish = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.problem.trim())
        throw new Error("Descreva o título e o problema do desafio.");
      const { error } = await supabase.from("challenges").insert({
        company_id: companyId,
        job_id: form.job_id || null,
        title: form.title,
        problem: form.problem,
        context: form.context || null,
        deadline: form.deadline || null,
        competencies: form.competencies
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        status: "aberto",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Desafio publicado.");
      setOpen(false);
      setForm({ title: "", problem: "", context: "", deadline: "", competencies: "", job_id: "" });
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const visibleChallenges = (challenges.data ?? []).filter(
    (challenge) => !vaga || challenge.job_id === vaga,
  );

  return (
    <>
      <PageHeader
        eyebrow="Desafios"
        title="Queremos ver como os candidatos resolvem este problema."
        subtitle="Um problema real vale mais que uma entrevista sobre o passado."
        action={<Button onClick={() => setOpen((v) => !v)}>Novo desafio</Button>}
      />
      <SectionTabs
        items={[
          { to: "/empresa/contratacoes", label: "Contratações" },
          { to: "/empresa/desafios", label: "Desafios" },
          { to: "/empresa/contratacao/nova", label: "Nova contratação" },
        ]}
      />

      {open ? (
        <form
          className="surface-card space-y-5 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            publish.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job">Vaga relacionada</Label>
              <Select
                value={form.job_id}
                onValueChange={(value) => setForm({ ...form, job_id: value })}
              >
                <SelectTrigger id="job">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(jobs.data ?? []).map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Prazo</Label>
              <Input
                id="deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="competencies">Competências (vírgula)</Label>
              <Input
                id="competencies"
                value={form.competencies}
                onChange={(e) => setForm({ ...form, competencies: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="problem">Problema</Label>
            <Textarea
              id="problem"
              rows={3}
              value={form.problem}
              onChange={(e) => setForm({ ...form, problem: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="context">Contexto</Label>
            <Textarea
              id="context"
              rows={3}
              value={form.context}
              onChange={(e) => setForm({ ...form, context: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={publish.isPending}>
              {publish.isPending ? "Publicando…" : "Publicar desafio"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {vaga ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-accent px-3 py-1 text-xs text-primary">
            Filtrando pela vaga: {jobs.data?.find((job) => job.id === vaga)?.title ?? "selecionada"}
          </span>
          <Link to="/empresa/desafios" className="text-primary underline-offset-4 hover:underline">
            Ver todos os desafios
          </Link>
        </div>
      ) : null}

      {challenges.isLoading ? <Loading /> : null}
      {challenges.isError ? <ErrorState message={challenges.error.message} /> : null}
      {challenges.data && visibleChallenges.length === 0 && !open ? (
        <EmptyState
          title="Nenhum desafio publicado"
          description="Publique um problema real e veja como as pessoas pensam."
          action={<Button onClick={() => setOpen(true)}>Novo desafio</Button>}
        />
      ) : null}

      <div className="grid gap-3">
        {visibleChallenges.map((challenge) => {
          const answers = (submissions.data ?? []).filter((s) => s.challenge_id === challenge.id);
          return (
            <article key={challenge.id} className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">{challenge.jobs?.title ?? "Sem vaga vinculada"}</p>
                  <h2 className="mt-1 text-lg">{challenge.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{challenge.problem}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                  {answers.length} resposta(s)
                </span>
              </div>

              {answers.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {answers.map((answer) => (
                    <div key={answer.id} className="rounded-lg bg-secondary/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{answer.candidates?.full_name}</p>
                        <span className="text-xs text-primary">{answer.score}%</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{answer.answer}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        {answer.link ? (
                          <a href={answer.link} target="_blank" rel="noreferrer" className="text-primary">
                            Link
                          </a>
                        ) : null}
                        {answer.video_url ? (
                          <a
                            href={answer.video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary"
                          >
                            Vídeo
                          </a>
                        ) : null}
                        {answer.file_name ? <span>{answer.file_name}</span> : null}
                        {answer.candidates ? (
                          <Link
                            to="/empresa/candidato/$candidateId"
                            params={{ candidateId: answer.candidates.id }}
                            className="text-primary"
                          >
                            Ver candidato
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Aguardando respostas dos candidatos.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
