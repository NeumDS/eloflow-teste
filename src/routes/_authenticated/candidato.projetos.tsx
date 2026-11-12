import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, Loading, PageHeader, SectionTabs } from "@/components/eloflow/ui";
import { supabase } from "@/integrations/supabase/client";
import { fetchCandidateProjects } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/candidato/projetos")({
  component: ProjectsPage,
});

const EMPTY = {
  name: "",
  description: "",
  problem: "",
  solution: "",
  technologies: "",
  github_url: "",
  link: "",
  result: "",
};

function ProjectsPage() {
  const { identity } = useAuth();
  const candidateId = identity?.id ?? "";
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const projects = useQuery({
    queryKey: ["projects", candidateId],
    queryFn: () => fetchCandidateProjects(candidateId),
    enabled: !!candidateId,
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Dê um nome ao projeto.");
      const { error } = await supabase.from("projects").insert({
        candidate_id: candidateId,
        ...form,
        technologies: form.technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Projeto adicionado.");
      setForm(EMPTY);
      setOpen(false);
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Projeto removido.");
      await queryClient.invalidateQueries({ queryKey: ["projects", candidateId] });
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Projetos"
        title="Mostre o que você sabe fazer."
        subtitle="Projetos ajudam empresas a enxergar sua capacidade além do currículo."
        action={
          <Button onClick={() => setOpen((v) => !v)}>
            <Plus className="size-4" /> Adicionar projeto
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

      {open ? (
        <form
          className="surface-card space-y-4 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["name", "Nome"],
                ["technologies", "Tecnologias (separadas por vírgula)"],
                ["github_url", "GitHub"],
                ["link", "Link"],
              ] as const
            ).map(([field, label]) => (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={field}>{label}</Label>
                <Input
                  id={field}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                />
              </div>
            ))}
          </div>
          {(
            [
              ["description", "Descrição"],
              ["problem", "Problema"],
              ["solution", "Solução"],
              ["result", "Resultado"],
            ] as const
          ).map(([field, label]) => (
            <div key={field} className="space-y-1.5">
              <Label htmlFor={field}>{label}</Label>
              <Textarea
                id={field}
                rows={2}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Salvando…" : "Salvar projeto"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {projects.isLoading ? <Loading /> : null}
      {projects.isError ? <ErrorState message={projects.error.message} /> : null}
      {projects.data?.length === 0 && !open ? (
        <EmptyState
          title="Nenhum projeto ainda"
          description="Comece com um projeto: problema, solução e resultado."
          action={<Button onClick={() => setOpen(true)}>Adicionar projeto</Button>}
        />
      ) : null}

      <div className="grid gap-3">
        {projects.data?.map((project) => (
          <article key={project.id} className="surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg">{project.name}</h2>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove.mutate(project.id)}>
                Remover
              </Button>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              {[
                ["Problema", project.problem],
                ["Solução", project.solution],
                ["Resultado", project.result],
              ].map(([label, value]) =>
                value ? (
                  <div key={label as string}>
                    <dt className="eyebrow">{label as string}</dt>
                    <dd className="mt-1 text-muted-foreground">{value as string}</dd>
                  </div>
                ) : null,
              )}
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(project.technologies ?? []).map((tech: string) => (
                <span key={tech} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                  {tech}
                </span>
              ))}
              {project.github_url ? (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  GitHub
                </a>
              ) : null}
              {project.link ? (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  Link
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
