import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/eloflow/SiteHeader";

export const Route = createFileRoute("/para-empresas")({
  head: () => ({
    meta: [
      { title: "Para empresas — contrate por capacidade | EloFlow" },
      {
        name: "description",
        content:
          "A EloFlow entende o trabalho antes de abrir a vaga e entrega candidatos com evidências de capacidade.",
      },
      { property: "og:title", content: "Para empresas — EloFlow" },
      {
        property: "og:description",
        content: "Diagnóstico da vaga, matching por evidências, desafios práticos e shortlist.",
      },
    ],
  }),
  component: Page,
});

const BLOCKS = [
  {
    title: "Conversa com especialista",
    text: "Antes de criar a vaga, entendemos a rotina, os problemas e o critério de sucesso.",
  },
  {
    title: "DNA da oportunidade",
    text: "Um perfil estruturado com o que a pessoa fará, precisa saber e pode aprender.",
  },
  {
    title: "Matching por evidências",
    text: "Projetos, GitHub, simulações e desafios sustentam cada recomendação.",
  },
  {
    title: "Shortlist enxuta",
    text: "Poucos perfis, com os três principais motivos de aderência.",
  },
];

function Page() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="eyebrow">Para empresas</p>
        <h1 className="text-display mt-3 max-w-2xl text-4xl sm:text-5xl">
          Contrate pela capacidade de resolver o seu problema.
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          Você descreve o trabalho. A EloFlow estrutura, encontra e demonstra. A decisão continua sendo sua.
        </p>
        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {BLOCKS.map((block) => (
            <div key={block.title} className="surface-card surface-card-hover p-6">
              <h2 className="text-lg">{block.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{block.text}</p>
            </div>
          ))}
        </div>
        <Button asChild size="lg" className="mt-10">
          <Link to="/auth" search={{ perfil: "empresa" }}>
            Quero contratar
          </Link>
        </Button>
      </section>
      <SiteFooter />
    </div>
  );
}
