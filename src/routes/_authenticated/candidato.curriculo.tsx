import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Loading, PageHeader, SectionTabs } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { fetchCandidate } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/candidato/curriculo")({
  component: ResumePage,
});

function ResumePage() {
  const { identity } = useAuth();
  const candidateId = identity?.id ?? "";
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const candidate = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => fetchCandidate(candidateId),
    enabled: !!candidateId,
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const path = `${candidateId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("curriculos").upload(path, file, {
        upsert: true,
      });
      if (error) throw new Error(error.message);
      const { data } = await supabase.storage
        .from("curriculos")
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      const { error: updateError } = await supabase
        .from("candidates")
        .update({ resume_name: file.name, resume_url: data?.signedUrl ?? path })
        .eq("id", candidateId);
      if (updateError) throw new Error(updateError.message);
    },
    onSuccess: async () => {
      toast.success("Currículo enviado.");
      await queryClient.invalidateQueries({ queryKey: ["candidate", candidateId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("candidates")
        .update({ resume_name: null, resume_url: null })
        .eq("id", candidateId);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Currículo removido.");
      await queryClient.invalidateQueries({ queryKey: ["candidate", candidateId] });
    },
  });

  if (candidate.isLoading) return <Loading />;
  if (candidate.isError) return <ErrorState message={candidate.error.message} />;

  const resumeName = candidate.data?.resume_name;
  const resumeUrl = candidate.data?.resume_url;

  return (
    <>
      <PageHeader
        eyebrow="Documentos"
        title="Seu currículo"
        subtitle="Seu currículo é uma parte do seu perfil. Seus projetos também contam."
        action={
          <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? "Enviando…" : resumeName ? "Substituir" : "Enviar currículo"}
          </Button>
        }
      />
      <SectionTabs
        items={[
          { to: "/candidato/perfil", label: "Perfil" },
          { to: "/candidato/projetos", label: "Projetos" },
          { to: "/candidato/github", label: "GitHub" },
          { to: "/candidato/curriculo", label: "Currículo" },
        ]}
      />

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload.mutate(file);
          event.target.value = "";
        }}
      />

      {resumeName ? (
        <section className="surface-card flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-3">
            <FileText className="size-5 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-medium">{resumeName}</p>
              <p className="text-xs text-muted-foreground">Anexado ao seu perfil</p>
            </div>
          </div>
          <div className="flex gap-2">
            {resumeUrl?.startsWith("http") ? (
              <Button asChild variant="outline" size="sm">
                <a href={resumeUrl} target="_blank" rel="noreferrer">
                  Visualizar
                </a>
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => remove.mutate()}>
              Remover
            </Button>
          </div>
        </section>
      ) : (
        <EmptyState
          title="Nenhum currículo enviado"
          description="PDF ou DOC. Você também pode mostrar sua capacidade por projetos e desafios."
          action={<Button onClick={() => inputRef.current?.click()}>Enviar currículo</Button>}
        />
      )}
    </>
  );
}
