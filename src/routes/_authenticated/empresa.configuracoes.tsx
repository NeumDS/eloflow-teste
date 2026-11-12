import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, Loading, PageHeader } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/empresa/configuracoes")({
  component: CompanySettings,
});

type Company = {
  id: string;
  name: string;
  email: string;
  industry: string | null;
  size: string | null;
  about: string | null;
};

function CompanySettings() {
  const { identity } = useAuth();
  const companyId = identity?.id ?? "";
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", industry: "", size: "", about: "" });

  const company = useQuery({
    queryKey: ["company", companyId],
    queryFn: () =>
      unwrap(
        supabase.from("companies").select("*").eq("id", companyId).single(),
      ) as Promise<Company>,
    enabled: !!companyId,
  });

  useEffect(() => {
    if (company.data) {
      setForm({
        name: company.data.name ?? "",
        industry: company.data.industry ?? "",
        size: company.data.size ?? "",
        about: company.data.about ?? "",
      });
    }
  }, [company.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("companies").update(form).eq("id", companyId);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Dados atualizados.");
      await queryClient.invalidateQueries({ queryKey: ["company", companyId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (company.isLoading) return <Loading />;
  if (company.isError) return <ErrorState message={company.error.message} />;

  return (
    <>
      <PageHeader
        eyebrow="Configurações"
        title="Dados da empresa"
        subtitle="Essas informações contextualizam a oportunidade para os candidatos."
        action={
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Salvando…" : "Salvar"}
          </Button>
        }
      />

      <section className="surface-card max-w-2xl space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={company.data?.email ?? ""} readOnly disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="industry">Setor</Label>
            <Input
              id="industry"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="size">Tamanho</Label>
            <Input
              id="size"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="about">Sobre a empresa</Label>
          <Textarea
            id="about"
            rows={4}
            value={form.about}
            onChange={(e) => setForm({ ...form, about: e.target.value })}
          />
        </div>
      </section>
    </>
  );
}
