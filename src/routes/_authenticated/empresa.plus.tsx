import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState, Loading, PageHeader } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, unwrap } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/empresa/plus")({
  component: PlusPage,
});

type PlusRow = {
  id: string;
  status: string;
  notes: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  location: string | null;
  created_at: string;
  candidates: { full_name: string } | null;
  jobs: { title: string } | null;
};

function PlusPage() {
  const { identity } = useAuth();
  const companyId = identity?.id ?? "";
  const queryClient = useQueryClient();
  const [candidateId, setCandidateId] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [location, setLocation] = useState("");

  const shortlist = useQuery({
    queryKey: ["company-shortlist-full", companyId],
    queryFn: () =>
      unwrap(
        supabase
          .from("shortlists")
          .select("candidate_id, job_id, candidates(full_name), jobs(title)")
          .eq("company_id", companyId),
      ) as Promise<
        {
          candidate_id: string;
          job_id: string;
          candidates: { full_name: string } | null;
          jobs: { title: string } | null;
        }[]
      >,
    enabled: !!companyId,
  });

  const experiences = useQuery({
    queryKey: ["plus", companyId],
    queryFn: () =>
      unwrap(
        supabase
          .from("plus_experiences")
          .select("*, candidates(full_name), jobs(title)")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false }),
      ) as Promise<PlusRow[]>,
    enabled: !!companyId,
  });

  const request = useMutation({
    mutationFn: async () => {
      const selected = shortlist.data?.find((item) => item.candidate_id === candidateId);
      if (!selected) throw new Error("Escolha um candidato da shortlist.");
      if (!date) throw new Error("Escolha a data da experiência presencial.");
      if (!location.trim()) throw new Error("Informe o local da experiência.");
      const conflict = (experiences.data ?? []).some(
        (item) =>
          item.status !== "cancelada" &&
          item.scheduled_date === date &&
          (item.scheduled_time ?? "").slice(0, 5) === time,
      );
      if (conflict) throw new Error("Já existe uma experiência Plus nesse dia e horário.");
      const { error } = await supabase.from("plus_experiences").insert({
        company_id: companyId,
        candidate_id: selected.candidate_id,
        job_id: selected.job_id,
        status: "solicitada",
        notes,
        scheduled_date: date,
        scheduled_time: time,
        location,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Solicitação enviada. Nosso especialista entra em contato.");
      setCandidateId("");
      setNotes("");
      setDate("");
      setLocation("");
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="EloFlow Plus"
        title="Quer conhecer o candidato além da tela?"
        subtitle="Com o EloFlow Plus, sua empresa pode realizar uma experiência presencial estruturada para validar a compatibilidade na prática."
      />

      <section className="surface-card space-y-5 p-6">
        <div className="space-y-1.5">
          <p className="eyebrow">Candidato da shortlist</p>
          <Select value={candidateId} onValueChange={setCandidateId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um candidato" />
            </SelectTrigger>
            <SelectContent>
              {(shortlist.data ?? []).map((item) => (
                <SelectItem key={item.candidate_id} value={item.candidate_id}>
                  {item.candidates?.full_name} — {item.jobs?.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="plus-date">Data</Label>
            <Input
              id="plus-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plus-time">Horário</Label>
            <Input
              id="plus-time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plus-location">Local</Label>
            <Input
              id="plus-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Escritório, endereço ou unidade"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="eyebrow">O que você quer validar presencialmente?</p>
          <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
        <Button onClick={() => request.mutate()} disabled={request.isPending}>
          {request.isPending ? "Enviando…" : "Solicitar experiência Plus"}
        </Button>
        <p className="text-xs text-muted-foreground">
          A experiência Plus é estruturada, remunerada e acompanhada por especialista. A EloFlow não
          intermedia trabalho gratuito: o escopo, a duração e as condições são formalizados antes do
          início, conforme as regras trabalhistas aplicáveis.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-display text-xl">Solicitações</h2>
        {experiences.isLoading ? <Loading /> : null}
        {experiences.isError ? <ErrorState message={experiences.error.message} /> : null}
        {experiences.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma experiência solicitada ainda.</p>
        ) : null}
        <div className="grid gap-3">
          {experiences.data?.map((experience) => (
            <article key={experience.id} className="surface-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg">{experience.candidates?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{experience.jobs?.title}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs capitalize">
                  {experience.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {[
                  experience.scheduled_date ? formatDate(experience.scheduled_date) : null,
                  experience.scheduled_time ? experience.scheduled_time.slice(0, 5) : null,
                  experience.location,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Agendamento a combinar"}
              </p>
              {experience.notes ? (
                <p className="mt-3 text-sm text-muted-foreground">{experience.notes}</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
