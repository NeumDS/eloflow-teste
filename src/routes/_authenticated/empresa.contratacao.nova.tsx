import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
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
import { PageHeader, SectionTabs } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/empresa/contratacao/nova")({
  component: NewHiring,
});

function NewHiring() {
  const { identity } = useAuth();
  const companyId = identity?.id ?? "";
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [jobId, setJobId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    area: "",
    modality: "Remoto",
    location: "",
    salary_range: "",
    urgency: "Normal",
    description: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Informe o cargo.");
      const { data, error } = await supabase
        .from("jobs")
        .insert({ company_id: companyId, ...form, status: "rascunho" })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data.id as string;
    },
    onSuccess: (id) => {
      setJobId(id);
      setStep(2);
      toast.success("Posição registrada.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (step === 2 && jobId) {
    return (
      <>
        <PageHeader
          eyebrow="Etapa 2 de 2"
          title="Antes de criar a vaga, queremos entender o trabalho."
          subtitle="Uma conversa com nosso especialista ajuda a EloFlow a entender o que realmente importa nessa posição."
        />
        <SectionTabs
          items={[
            { to: "/empresa/contratacoes", label: "Contratações" },
            { to: "/empresa/desafios", label: "Desafios" },
            { to: "/empresa/contratacao/nova", label: "Nova contratação" },
          ]}
        />
        <section className="surface-card max-w-xl p-8">
          <p className="text-sm text-muted-foreground">
            São 45 minutos. Depois da conversa, a IA estrutura o perfil da oportunidade e você
            revisa antes de qualquer candidato ser procurado.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => void navigate({ to: "/empresa/agendar/$jobId", params: { jobId } })}>
              Agendar conversa
            </Button>
            <Button variant="ghost" onClick={() => void navigate({ to: "/empresa/contratacoes" })}>
              Agendar depois
            </Button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Etapa 1 de 2"
        title="Qual posição você precisa preencher?"
        subtitle="Só o essencial agora. O resto vem da conversa."
      />
      <SectionTabs
        items={[
          { to: "/empresa/contratacoes", label: "Contratações" },
          { to: "/empresa/desafios", label: "Desafios" },
          { to: "/empresa/contratacao/nova", label: "Nova contratação" },
        ]}
      />
      <form
        className="surface-card max-w-2xl space-y-5 p-8"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="title">Cargo</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex.: Pessoa Desenvolvedora Back-end"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="area">Área</Label>
            <Input
              id="area"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="modality">Modalidade</Label>
            <Select
              value={form.modality}
              onValueChange={(value) => setForm({ ...form, modality: value })}
            >
              <SelectTrigger id="modality">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Remoto", "Híbrido", "Presencial"].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salary">Salário</Label>
            <Input
              id="salary"
              value={form.salary_range}
              onChange={(e) => setForm({ ...form, salary_range: e.target.value })}
              placeholder="R$ 8.000 – R$ 11.000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="urgency">Urgência</Label>
            <Select
              value={form.urgency}
              onValueChange={(value) => setForm({ ...form, urgency: value })}
            >
              <SelectTrigger id="urgency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Baixa", "Normal", "Alta"].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              rows={6}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Cole aqui a descrição da vaga: responsabilidades, entregas esperadas, requisitos e contexto do time."
            />
            <p className="text-xs text-muted-foreground">
              Opcional agora — a conversa com o especialista complementa e estrutura o DNA da vaga.
            </p>
          </div>
        </div>
        <Button type="submit" size="lg" disabled={create.isPending}>
          {create.isPending ? "Salvando…" : "Continuar"}
        </Button>
      </form>
    </>
  );
}
