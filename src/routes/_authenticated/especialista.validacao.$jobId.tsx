import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState, Loading, MockNotice, PageHeader } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/data";
import { AIService, type Diagnosis } from "@/lib/ai";

export const Route = createFileRoute("/_authenticated/especialista/validacao/$jobId")({
  component: ValidationPage,
});

type Job = {
  id: string;
  title: string;
  area: string | null;
  seniority: string | null;
  status: string;
  diagnosis: Diagnosis | null;
  companies: { name: string; email: string } | null;
};

const FIELDS: { key: keyof Diagnosis; label: string }[] = [
  { key: "responsabilidades", label: "Responsabilidades" },
  { key: "skills", label: "Skills" },
  { key: "ferramentas", label: "Ferramentas" },
  { key: "problemas", label: "Problemas" },
  { key: "criterios", label: "Critérios de sucesso" },
  { key: "obrigatorios", label: "Requisitos obrigatórios" },
  { key: "desejaveis", label: "Requisitos desejáveis" },
];

function ValidationPage() {
  const { jobId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Diagnosis | null>(null);
  const [seniority, setSeniority] = useState("");
  const [newItem, setNewItem] = useState<Record<string, string>>({});

  const job = useQuery({
    queryKey: ["job-validation", jobId],
    queryFn: () =>
      unwrap(
        supabase.from("jobs").select("*, companies(name, email)").eq("id", jobId).single(),
      ) as Promise<Job>,
  });

  useEffect(() => {
    if (job.data?.diagnosis && !draft) {
      setDraft(job.data.diagnosis);
      setSeniority(job.data.diagnosis.senioridade ?? job.data.seniority ?? "");
    }
  }, [job.data, draft]);

  const generate = useMutation({
    mutationFn: async () => {
      const diagnosis = await AIService.generateJobProfile({
        title: job.data!.title,
        area: job.data!.area,
        seniority: job.data!.seniority,
      });
      const { error } = await supabase
        .from("jobs")
        .update({ diagnosis, status: "em_validacao" })
        .eq("id", jobId);
      if (error) throw new Error(error.message);
      return diagnosis;
    },
    onSuccess: async (diagnosis) => {
      setDraft(diagnosis);
      setSeniority(diagnosis.senioridade);
      await queryClient.invalidateQueries();
      toast.success("Diagnóstico gerado.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const validate = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error("Gere o diagnóstico primeiro.");
      const diagnosis: Diagnosis = { ...draft, senioridade: seniority };
      const dna = {
        fara: diagnosis.responsabilidades,
        precisa_saber: diagnosis.obrigatorios.length ? diagnosis.obrigatorios : diagnosis.skills,
        pode_aprender: diagnosis.desejaveis,
        problemas: diagnosis.problemas,
        avaliacao: diagnosis.criterios,
      };
      const { error } = await supabase
        .from("jobs")
        .update({ diagnosis, dna, seniority, status: "validada" })
        .eq("id", jobId);
      if (error) throw new Error(error.message);

      const existing = (await unwrap(
        supabase.from("simulations").select("id").eq("job_id", jobId).maybeSingle(),
      )) as { id: string } | null;
      if (!existing) {
        const simulation = await AIService.generateSimulation({ title: job.data!.title });
        await supabase.from("simulations").insert({ job_id: jobId, ...simulation });
      }
      if (job.data?.companies?.email) {
        await supabase.from("notifications").insert({
          recipient_email: job.data.companies.email,
          title: "Oportunidade validada",
          body: `${job.data.title} está pronta: já encontramos candidatos compatíveis.`,
        });
      }
    },
    onSuccess: async () => {
      toast.success("Vaga validada e liberada para matching.");
      await queryClient.invalidateQueries();
      void navigate({ to: "/especialista/vagas" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("jobs")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", jobId);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Vaga removida.");
      await queryClient.invalidateQueries();
      void navigate({ to: "/especialista/vagas" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (job.isLoading) return <Loading />;
  if (job.isError) return <ErrorState message={job.error.message} />;

  const update = (key: keyof Diagnosis, values: string[]) =>
    setDraft((current) => (current ? { ...current, [key]: values } : current));

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link to="/especialista/validacoes">
          <ArrowLeft className="size-3.5" /> Validações
        </Link>
      </Button>

      <PageHeader
        eyebrow={job.data?.companies?.name ?? undefined}
        title="Revise o perfil desta oportunidade."
        subtitle="A IA estrutura. Você decide o que entra."
        action={
          <div className="flex flex-wrap gap-2">
            {draft ? (
              <Button onClick={() => validate.mutate()} disabled={validate.isPending}>
                {validate.isPending ? "Validando…" : "Validar vaga"}
              </Button>
            ) : (
              <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
                {generate.isPending ? "Gerando…" : "Gerar diagnóstico"}
              </Button>
            )}
            <Button
              size="default"
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

      <MockNotice>Diagnóstico gerado pela IA de demonstração deste MVP.</MockNotice>

      {draft ? (
        <>
          {draft.confirmar?.length ? (
            <section className="surface-card border-primary/40 p-5">
              <p className="text-sm font-medium text-primary">
                Precisamos confirmar {draft.confirmar.length} informações.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {draft.confirmar.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="surface-card max-w-sm space-y-1.5 p-5">
            <p className="eyebrow">Senioridade</p>
            <Input value={seniority} onChange={(event) => setSeniority(event.target.value)} />
          </section>

          <div className="grid gap-3 lg:grid-cols-2">
            {FIELDS.map(({ key, label }) => {
              const values = (draft[key] as string[]) ?? [];
              return (
                <section key={key} className="surface-card space-y-3 p-5">
                  <p className="eyebrow">{label}</p>
                  <ul className="space-y-2">
                    {values.map((item, index) => (
                      <li key={item} className="flex items-start gap-2">
                        <Input
                          value={item}
                          onChange={(event) => {
                            const next = [...values];
                            next[index] = event.target.value;
                            update(key, next);
                          }}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Remover item"
                          onClick={() => update(key, values.filter((_, i) => i !== index))}
                        >
                          <X className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Adicionar item"
                      value={newItem[key] ?? ""}
                      onChange={(event) => setNewItem({ ...newItem, [key]: event.target.value })}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      aria-label="Adicionar item"
                      onClick={() => {
                        const value = (newItem[key] ?? "").trim();
                        if (!value) return;
                        update(key, [...values, value]);
                        setNewItem({ ...newItem, [key]: "" });
                      }}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </section>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhum diagnóstico ainda para esta oportunidade.
        </p>
      )}
    </>
  );
}
