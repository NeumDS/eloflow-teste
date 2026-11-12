import { supabase } from "@/integrations/supabase/client";
import { AIService, type JobDna } from "@/lib/ai";

export type Job = {
  id: string;
  company_id: string;
  title: string;
  area: string | null;
  modality: string | null;
  location: string | null;
  salary_range: string | null;
  urgency: string | null;
  seniority: string | null;
  description: string | null;
  status: string;
  diagnosis: unknown;
  dna: unknown;
  created_at: string;
  companies?: { name: string } | null;
};

export const asDna = (value: unknown): JobDna | null => (value ? (value as JobDna) : null);

export async function unwrap<T>(promise: PromiseLike<{ data: T | null; error: unknown }>) {
  const { data, error } = await promise;
  if (error) throw new Error((error as { message?: string }).message ?? "Erro no banco de dados");
  return data as T;
}

export type Candidate = {
  id: string;
  full_name: string;
  email: string;
  headline: string | null;
  location: string | null;
  seniority: string | null;
  bio: string | null;
  skills: string[] | null;
  education: string | null;
  portfolio_url: string | null;
  github_username: string | null;
  resume_name: string | null;
  resume_url: string | null;
  profile_completion: number;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  problem: string | null;
  solution: string | null;
  result: string | null;
  technologies: string[] | null;
  github_url: string | null;
  link: string | null;
};

export async function fetchCandidate(candidateId: string) {
  return unwrap(
    supabase.from("candidates").select("*").eq("id", candidateId).single(),
  ) as Promise<Candidate>;
}

export async function fetchValidatedJobs() {
  return unwrap(
    supabase
      .from("jobs")
      .select("*, companies(name)")
      .eq("status", "validada")
      .order("created_at", { ascending: false }),
  ) as Promise<Job[]>;
}

export async function fetchCandidateProjects(candidateId: string) {
  return unwrap(
    supabase
      .from("projects")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false }),
  ) as Promise<Project[]>;
}

export async function fetchApplications(candidateId: string) {
  return unwrap(
    supabase
      .from("applications")
      .select("*, jobs(id, title, companies(name))")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false }),
  );
}

/** Recomendações do candidato: score determinístico com base em skills e projetos. */
export async function fetchRecommendations(candidateId: string) {
  const [candidate, projects, jobs, applications] = await Promise.all([
    fetchCandidate(candidateId),
    fetchCandidateProjects(candidateId),
    fetchValidatedJobs(),
    unwrap(supabase.from("applications").select("job_id").eq("candidate_id", candidateId)),
  ]);
  const appliedIds = new Set((applications as { job_id: string }[]).map((a) => a.job_id));
  const projectTechs = (projects as { technologies: string[] | null }[]).flatMap(
    (p) => p.technologies ?? [],
  );

  return jobs
    .map((job) => {
      const dna = asDna(job.dna);
      const [scored] = AIService.matchCandidates(
        [
          {
            id: candidate.id,
            full_name: candidate.full_name,
            skills: candidate.skills,
            seniority: candidate.seniority,
            github_username: candidate.github_username,
            projectTechs,
          },
        ],
        { seniority: job.seniority, dna },
      );
      return {
        job,
        score: scored?.score ?? 0,
        reasons: scored?.reasons ?? [],
        applied: appliedIds.has(job.id),
      };
    })
    .sort((a, b) => b.score - a.score);
}

/** Matching da empresa: candidatos ordenados por evidências para uma vaga. */
export async function fetchMatchesForJob(jobId: string) {
  const job = (await unwrap(
    supabase.from("jobs").select("*, companies(name)").eq("id", jobId).single(),
  )) as Job;
  const candidates = await unwrap(supabase.from("candidates").select("*"));
  const projects = await unwrap(supabase.from("projects").select("candidate_id, technologies"));
  const techByCandidate = new Map<string, string[]>();
  for (const project of projects as { candidate_id: string; technologies: string[] | null }[]) {
    techByCandidate.set(project.candidate_id, [
      ...(techByCandidate.get(project.candidate_id) ?? []),
      ...(project.technologies ?? []),
    ]);
  }
  const enriched = (candidates as Awaited<ReturnType<typeof fetchCandidate>>[]).map((candidate) => ({
    ...candidate,
    projectTechs: techByCandidate.get(candidate.id) ?? [],
  }));
  return {
    job,
    matches: AIService.matchCandidates(enriched, {
      seniority: job.seniority,
      dna: asDna(job.dna),
    }),
  };
}

export function nextWeekdays(count = 14) {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) days.push(new Date(cursor));
  }
  return days;
}

export const toISODate = (date: Date) => date.toISOString().slice(0, 10);

export const formatDate = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    weekday: "short",
  });

/** Slots de 45 minutos derivados da disponibilidade, já removendo conflitos. */
export function buildSlots(
  availability: { day_of_week: number; start_time: string; end_time: string; active: boolean }[],
  date: Date,
  taken: string[],
) {
  const day = date.getDay();
  const windows = availability.filter((a) => a.active && a.day_of_week === day);
  const slots: string[] = [];
  for (const window of windows) {
    const [startHour = 0, startMinute = 0] = window.start_time.split(":").map(Number);
    const [endHour = 0, endMinute = 0] = window.end_time.split(":").map(Number);
    let minutes = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    while (minutes + 45 <= end) {
      const label = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
      if (!taken.includes(`${label}:00`) && !taken.includes(label)) slots.push(label);
      minutes += 45;
    }
  }
  return slots;
}

export const addMinutes = (time: string, minutes: number) => {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

export async function notify(email: string, title: string, body: string) {
  await supabase.from("notifications").insert({ recipient_email: email, title, body });
}
