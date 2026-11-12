import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/data";

export type Attempt = {
  id: string;
  score: number | null;
  feedback: string | null;
  simulations: { id: string; title: string; job_id: string } | null;
};

export type Submission = {
  id: string;
  score: number | null;
  feedback: string | null;
  challenges: { id: string; title: string; job_id: string | null } | null;
};

export type Assessment = { id: string; name: string; score: number | null };

export type Evidence = {
  attempts: Attempt[];
  submissions: Submission[];
  assessments: Assessment[];
};

export async function fetchCandidateEvidence(candidateId: string): Promise<Evidence> {
  const [attempts, submissions, assessments] = await Promise.all([
    unwrap(
      supabase
        .from("simulation_attempts")
        .select("id, score, feedback, simulations(id, title, job_id)")
        .eq("candidate_id", candidateId),
    ) as Promise<Attempt[]>,
    unwrap(
      supabase
        .from("challenge_submissions")
        .select("id, score, feedback, challenges(id, title, job_id)")
        .eq("candidate_id", candidateId),
    ) as Promise<Submission[]>,
    unwrap(
      supabase.from("assessments").select("id, name, score").eq("candidate_id", candidateId),
    ) as Promise<Assessment[]>,
  ]);
  return { attempts, submissions, assessments };
}

export type ScoreLine = { id: string; label: string; score: number | null; feedback: string | null };

/** Notas do candidato relacionadas a uma vaga específica. */
export function evidenceForJob(evidence: Evidence | undefined, jobId: string): ScoreLine[] {
  if (!evidence) return [];
  return [
    ...evidence.attempts
      .filter((a) => a.simulations?.job_id === jobId)
      .map((a) => ({
        id: a.id,
        label: `Simulação · ${a.simulations?.title ?? "Situações reais"}`,
        score: a.score,
        feedback: a.feedback,
      })),
    ...evidence.submissions
      .filter((s) => s.challenges?.job_id === jobId)
      .map((s) => ({
        id: s.id,
        label: `Desafio · ${s.challenges?.title ?? "Desafio prático"}`,
        score: s.score,
        feedback: s.feedback,
      })),
  ];
}

/** Pontos de melhoria derivados das notas e do preenchimento do perfil. */
export function improvementPoints(
  evidence: Evidence | undefined,
  profile?: {
    skills?: string[] | null | undefined;
    github_username?: string | null | undefined;
    resume_name?: string | null | undefined;
    projectCount?: number | undefined;
  },
): string[] {
  const points: string[] = [];
  if (!evidence) return points;

  const lows = [
    ...evidence.attempts.map((a) => ({
      score: a.score,
      label: `simulação "${a.simulations?.title ?? "rotina"}"`,
    })),
    ...evidence.submissions.map((s) => ({
      score: s.score,
      label: `desafio "${s.challenges?.title ?? "prático"}"`,
    })),
    ...evidence.assessments.map((t) => ({ score: t.score, label: `teste "${t.name}"` })),
  ].filter((item) => typeof item.score === "number" && (item.score ?? 0) < 70);

  for (const item of lows) {
    points.push(`Sua nota na ${item.label} foi ${item.score}% — revise os fundamentos e refaça quando liberado.`);
  }

  if (evidence.attempts.length === 0) {
    points.push("Você ainda não concluiu nenhuma simulação — é o dado que mais pesa no matching.");
  }
  if (evidence.submissions.length === 0) {
    points.push("Resolver um desafio prático mostra como você trabalha, não só o que já fez.");
  }
  if (profile) {
    if ((profile.projectCount ?? 0) === 0) {
      points.push("Cadastre pelo menos um projeto com problema, solução e resultado.");
    }
    if (!profile.github_username) points.push("Conecte seu GitHub para comprovar prática em código.");
    if (!profile.resume_name) points.push("Envie seu currículo para completar o perfil.");
    if ((profile.skills ?? []).length < 5) {
      points.push("Liste mais habilidades técnicas para ampliar sua compatibilidade.");
    }
  }
  return Array.from(new Set(points)).slice(0, 6);
}
