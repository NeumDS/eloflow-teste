import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  Loading,
  MatchBadge,
  PageHeader,
} from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { asDna, fetchMatchesForJob, unwrap } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/empresa/vaga/$jobId")({
  component: CompanyJob,
});

function CompanyJob() {
  const { jobId } = Route.useParams();
  const { identity } = useAuth();
  const companyId = identity?.id ?? "";
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const data = useQuery({
    queryKey: ["job-matches", jobId],
    queryFn: () => fetchMatchesForJob(jobId),
  });

  const challenges = useQuery({
    queryKey: ["job-challenges", jobId],
    queryFn: () =>
      unwrap(
        supabase
          .from("challenges")
          .select("id, title, problem, status, deadline")
          .eq("job_id", jobId)
          .order("created_at", { ascending: false }),
      ) as Promise<
        { id: string; title: string; problem: string; status: string; deadline: string | null }[]
      >,
  });

  const shortlist = useQuery({
    queryKey: ["shortlist", jobId],
    queryFn: () =>
      unwrap(
        supabase.from("shortlists").select("candidate_id").eq("job_id", jobId),
      ) as Promise<{ candidate_id: string }[]>,
  });

  const addToShortlist = useMutation({
    mutationFn: async (candidateId: string) => {
      const { error } = await supabase.from("shortlists").insert({
        company_id: companyId,
        job_id: jobId,
        candidate_id: candidateId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Adicionado à shortlist.");
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("jobs")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", jobId)
        .eq("company_id", companyId);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Vaga removida.");
      await queryClient.invalidateQueries();
      void navigate({ to: "/empresa/contratacoes" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (data.isLoading) return <Loading />;
  if (data.isError) return <ErrorState message={data.error.message} />;

  const job = data.data!.job;
  const dna = asDna(job.dna);
  const inShortlist = new Set((shortlist.data ?? []).map((item) => item.candidate_id));
  const validated = job.status === "validada";

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link to="/empresa/contratacoes">
          <ArrowLeft className="size-3.5" /> Contratações
        </Link>
      </Button>

      <PageHeader
        eyebrow={job.seniority ?? undefined}
        title={job.title}
        subtitle={[job.modality, job.location, job.salary_range].filter(Boolean).join(" · ")}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/empresa/desafios" search={{ vaga: jobId }}>
                Criar desafio
              </Link>
            </Button>
            {!validated ? (
              <Button asChild size="sm">
                <Link to="/empresa/agendar/$jobId" params={{ jobId }}>
                  Agendar conversa
                </Link>
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
            >
              <Trash2 className="size-3.5" /> Excluir
            </Button>
          </div>
        }
      />

      {job.description ? (
        <section className="space-y-3">
          <h2 className="text-display text-xl">Job Description</h2>
          <p className="surface-card whitespace-pre-line p-5 text-sm text-muted-foreground">
            {job.description}
          </p>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-display text-xl">Desafios desta vaga</h2>
          <Button asChild size="sm" variant="outline">
            <Link to="/empresa/desafios" search={{ vaga: jobId }}>
              Novo desafio
            </Link>
          </Button>
        </div>
        {challenges.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum desafio vinculado. Um problema real mostra como a pessoa pensa.
          </p>
        ) : null}
        <div className="grid gap-3">
          {challenges.data?.map((challenge) => (
            <Link
              key={challenge.id}
              to="/empresa/desafios"
              search={{ vaga: jobId }}
              className="surface-card surface-card-hover flex flex-wrap items-start justify-between gap-3 p-5"
            >
              <div>
                <h3 className="text-lg">{challenge.title}</h3>
                <p className="text-sm text-muted-foreground">{challenge.problem}</p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs capitalize">
                {challenge.status}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {dna ? (
        <section className="space-y-3">
          <h2 className="text-display text-xl">DNA da oportunidade</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["O que fará", dna.fara],
              ["O que precisa saber", dna.precisa_saber],
              ["O que pode aprender", dna.pode_aprender],
              ["Problemas que resolverá", dna.problemas],
              ["Como será avaliado", dna.avaliacao],
            ].map(([title, items]) => (
              <div key={title as string} className="surface-card p-5">
                <p className="eyebrow">{title as string}</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {(items as string[]).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          title="Esta oportunidade ainda não tem DNA"
          description="O DNA nasce da conversa com o especialista e da validação humana do diagnóstico."
          action={
            <Button asChild>
              <Link to="/empresa/agendar/$jobId" params={{ jobId }}>
                Agendar conversa
              </Link>
            </Button>
          }
        />
      )}

      {validated ? (
        <section className="space-y-3">
          <h2 className="text-display text-xl">Encontramos pessoas que fazem sentido.</h2>
          <div className="grid gap-3">
            {data.data!.matches.slice(0, 6).map((match) => (
              <article key={match.id} className="surface-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg">{match.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{match.headline}</p>
                  </div>
                  <MatchBadge score={match.score} />
                </div>
                <p className="eyebrow mt-4">Evidências</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {match.reasons.map((reason) => (
                    <li key={reason}>• {reason}</li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/empresa/candidato/$candidateId" params={{ candidateId: match.id }}>
                      Ver perfil
                    </Link>
                  </Button>
                  {inShortlist.has(match.id) ? (
                    <span className="self-center text-xs text-primary">Na shortlist</span>
                  ) : (
                    <Button
                      size="sm"
                      disabled={addToShortlist.isPending}
                      onClick={() => addToShortlist.mutate(match.id)}
                    >
                      Adicionar à shortlist
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
