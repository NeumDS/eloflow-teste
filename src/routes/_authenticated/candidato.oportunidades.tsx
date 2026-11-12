import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Loading, MatchBadge, PageHeader } from "@/components/eloflow/ui";
import { fetchCandidate, fetchRecommendations, notify } from "@/lib/data";
import { AUTO_APPLY_SCORE, MIN_APPLY_SCORE } from "@/lib/stages";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/candidato/oportunidades")({
  component: Opportunities,
});


function Opportunities() {
  const { identity } = useAuth();
  const candidateId = identity?.id ?? "";
  const queryClient = useQueryClient();
  const autoRan = useRef(false);

  const query = useQuery({
    queryKey: ["recommendations", candidateId],
    queryFn: () => fetchRecommendations(candidateId),
    enabled: !!candidateId,
  });
  const candidate = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => fetchCandidate(candidateId),
    enabled: !!candidateId,
  });

  const autoApply = (candidate.data as { auto_apply?: boolean } | undefined)?.auto_apply ?? false;

  useEffect(() => {
    if (autoRan.current || !autoApply || !query.data || !candidateId) return;
    const targets = query.data.filter((item) => !item.applied && item.score >= AUTO_APPLY_SCORE);
    if (targets.length === 0) return;
    autoRan.current = true;
    void (async () => {
      for (const target of targets) {
        const { error } = await supabase.from("applications").insert({
          job_id: target.job.id,
          candidate_id: candidateId,
          match_score: target.score,
          reasons: target.reasons,
          stage: "perfil_analisado",
        });
        if (error) continue;
        const email = (target.job.companies as { email?: string } | null)?.email;
        if (email) {
          await notify(
            email,
            "Nova candidatura",
            `${identity?.name} foi indicado automaticamente para ${target.job.title}.`,
          );
        }
      }
      toast.success(
        `Candidatura automática enviada para ${targets.length} vaga(s) com 90%+ de compatibilidade.`,
      );
      await queryClient.invalidateQueries();
    })();
  }, [autoApply, query.data, candidateId, identity?.name, queryClient]);

  const all = query.data ?? [];
  const compatible = all.filter((item) => item.score >= MIN_APPLY_SCORE);

  const renderCard = (
    { job, score, reasons, applied }: (typeof all)[number],
    locked: boolean,
  ) => (
    <article key={job.id} className="surface-card surface-card-hover p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg">{job.title}</h3>
          <p className="text-sm text-muted-foreground">
            {job.companies?.name} · {job.modality} · {job.location}
          </p>
        </div>
        <MatchBadge score={score} />
      </div>
      {reasons.length > 0 ? (
        <>
          <p className="eyebrow mt-4">Principais motivos</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {reasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        </>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {locked ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            Candidatura liberada a partir de {MIN_APPLY_SCORE}% de compatibilidade
          </span>
        ) : (
          <Button asChild size="sm">
            <Link to="/candidato/vaga/$jobId" params={{ jobId: job.id }}>
              Ver oportunidade
            </Link>
          </Button>
        )}
        {applied ? <span className="text-xs text-muted-foreground">Você já se candidatou</span> : null}
      </div>
    </article>
  );

  return (
    <>
      <PageHeader
        eyebrow="Oportunidades"
        title="Oportunidades para você."
        subtitle="Poucas vagas, escolhidas por evidências — não por palavras-chave."
      />

      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorState message={query.error.message} /> : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-display text-xl">Vagas compatíveis com você</h2>
          <p className="text-sm text-muted-foreground">
            A partir de {MIN_APPLY_SCORE}% de compatibilidade você pode se candidatar.
          </p>
        </div>
        {!query.isLoading && compatible.length === 0 ? (
          <EmptyState
            title="Nenhuma vaga compatível agora"
            description="Complete seu perfil e resolva avaliações para aumentar sua compatibilidade."
            action={
              <Button asChild variant="outline">
                <Link to="/candidato/perfil">Completar perfil</Link>
              </Button>
            }
          />
        ) : null}
        <div className="grid gap-3">{compatible.map((item) => renderCard(item, false))}</div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-display text-xl">Vagas totais</h2>
          <p className="text-sm text-muted-foreground">
            Todas as vagas validadas na EloFlow, inclusive as que ainda não combinam com você.
          </p>
        </div>
        {!query.isLoading && all.length === 0 ? (
          <EmptyState
            title="Nada disponível agora"
            description="Assim que uma vaga for validada por um especialista, ela aparece aqui."
          />
        ) : null}
        <div className="grid gap-3">
          {all.map((item) => renderCard(item, item.score < MIN_APPLY_SCORE))}
        </div>
      </section>
    </>
  );
}
