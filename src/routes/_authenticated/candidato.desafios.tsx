import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, Loading, PageHeader } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/data";
import { AIService } from "@/lib/ai";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/candidato/desafios")({
  component: ChallengesPage,
});

type Challenge = {
  id: string;
  title: string;
  problem: string;
  context: string | null;
  deadline: string | null;
  competencies: string[] | null;
  companies: { name: string } | null;
};

type Submission = {
  id: string;
  challenge_id: string;
  score: number | null;
  feedback: string | null;
};

function ChallengesPage() {
  const { identity } = useAuth();
  const candidateId = identity?.id ?? "";
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({ content: "", link: "", file_name: "", video_url: "" });

  const challenges = useQuery({
    queryKey: ["challenges"],
    queryFn: () =>
      unwrap(
        supabase
          .from("challenges")
          .select("*, companies(name)")
          .eq("status", "aberto")
          .order("created_at", { ascending: false }),
      ) as Promise<Challenge[]>,
  });

  const submissions = useQuery({
    queryKey: ["submissions", candidateId],
    queryFn: () =>
      unwrap(
        supabase.from("challenge_submissions").select("*").eq("candidate_id", candidateId),
      ) as Promise<Submission[]>,
    enabled: !!candidateId,
  });

  const submit = useMutation({
    mutationFn: async (challengeId: string) => {
      if (form.content.trim().length < 20) throw new Error("Descreva sua solução com mais detalhe.");
      const evaluation = AIService.evaluateChallenge(form.content);
      const { error } = await supabase.from("challenge_submissions").insert({
        challenge_id: challengeId,
        candidate_id: candidateId,
        answer: form.content,
        link: form.link || null,
        file_name: form.file_name || null,
        video_url: form.video_url || null,
        score: evaluation.score,
        feedback: evaluation.feedback,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Resposta enviada. A empresa foi notificada.");
      setForm({ content: "", link: "", file_name: "", video_url: "" });
      setOpenId(null);
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Desafios"
        title="Desafios"
        subtitle="Resolva um problema real e mostre sua capacidade em prática."
      />

      {challenges.isLoading ? <Loading /> : null}
      {challenges.isError ? <ErrorState message={challenges.error.message} /> : null}
      {challenges.data?.length === 0 ? (
        <EmptyState
          title="Nenhum desafio aberto"
          description="As empresas publicam desafios ligados às vagas em andamento."
        />
      ) : null}

      <div className="grid gap-3">
        {challenges.data?.map((challenge) => {
          const submission = submissions.data?.find((s) => s.challenge_id === challenge.id);
          return (
            <article key={challenge.id} className="surface-card p-5">
              <p className="eyebrow">{challenge.companies?.name}</p>
              <h2 className="mt-1 text-lg">{challenge.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{challenge.problem}</p>
              {challenge.context ? (
                <p className="mt-2 text-sm text-muted-foreground">{challenge.context}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {(challenge.competencies ?? []).map((competency) => (
                  <span key={competency} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                    {competency}
                  </span>
                ))}
                {challenge.deadline ? (
                  <span className="text-xs text-muted-foreground">
                    Prazo: {new Date(challenge.deadline).toLocaleDateString("pt-BR")}
                  </span>
                ) : null}
              </div>

              {submission ? (
                <div className="mt-5 rounded-lg bg-secondary/70 p-4">
                  <p className="text-sm font-medium text-primary">Resposta enviada</p>
                  <p className="mt-1 text-sm text-muted-foreground">{submission.feedback}</p>
                </div>
              ) : openId === challenge.id ? (
                <form
                  className="mt-5 space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submit.mutate(challenge.id);
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor={`content-${challenge.id}`}>Sua solução (texto ou código)</Label>
                    <Textarea
                      id={`content-${challenge.id}`}
                      rows={6}
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`link-${challenge.id}`}>Link</Label>
                      <Input
                        id={`link-${challenge.id}`}
                        placeholder="https://"
                        value={form.link}
                        onChange={(e) => setForm({ ...form, link: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`video-${challenge.id}`}>Vídeo</Label>
                      <Input
                        id={`video-${challenge.id}`}
                        placeholder="https://"
                        value={form.video_url}
                        onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`file-${challenge.id}`}>Arquivo</Label>
                      <Input
                        id={`file-${challenge.id}`}
                        type="file"
                        onChange={(e) =>
                          setForm({ ...form, file_name: e.target.files?.[0]?.name ?? "" })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submit.isPending}>
                      {submit.isPending ? "Enviando…" : "Enviar resposta"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setOpenId(null)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <Button size="sm" className="mt-5" onClick={() => setOpenId(challenge.id)}>
                  Resolver desafio
                </Button>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
