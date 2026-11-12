import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/eloflow/SiteHeader";
import { ConnectionGraphic } from "@/components/eloflow/ConnectionGraphic";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EloFlow — Encontre quem consegue fazer" },
      {
        name: "description",
        content:
          "Uma nova forma de conectar empresas e talentos baseada em competências, projetos e capacidade demonstrada.",
      },
      { property: "og:taitle", content: "EloFlow — Encontre quem consegue fazer" },
      {
        property: "og:description",
        content: "Entendemos o trabalho. Encontramos o talento. Você decide.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    n: "01",
    title: "Entendemos",
    text: "Conversamos com a empresa para descobrir o que a vaga realmente precisa.",
  },
  {
    n: "02",
    title: "Estruturamos",
    text: "A IA transforma essa conversa em um perfil inteligente da oportunidade.",
  },
  {
    n: "03",
    title: "Encontramos",
    text: "Buscamos candidatos compatíveis com base em evidências.",
  },
  {
    n: "04",
    title: "Conectamos",
    text: "O candidato demonstra sua capacidade e a empresa decide.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-border bg-sand-light py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">Como funciona</p>
        <h2 className="mt-3 max-w-xl text-display text-3xl sm:text-4xl">Quatro etapas. Nenhuma etapa decorativa.</h2>
        <div className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
          <div className="absolute top-3 right-0 left-0 hidden h-px bg-primary/25 md:block" aria-hidden />
          {STEPS.map((step) => (
            <div key={step.n} className="relative">
              <span className="relative z-10 block size-2 rounded-full bg-primary" aria-hidden />
              <p className="text-display mt-5 text-sm text-primary">{step.n}</p>
              <h3 className="mt-1 text-lg">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Differential() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm text-muted-foreground">Não começamos pelo currículo.</p>
          <h2 className="text-display mt-2 text-4xl leading-[1.05] sm:text-5xl">Começamos pelo trabalho.</h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Antes de procurar candidatos, a EloFlow entende o que aquela pessoa realmente fará dentro da empresa.
          </p>
        </div>
        <div className="grid gap-3">
          {[
            { title: "Trabalho real", text: "O que a pessoa fará na primeira semana." },
            { title: "Competências", text: "O que precisa saber e o que pode aprender." },
            { title: "Evidências", text: "Projetos, GitHub, simulações e desafios." },
          ].map((item) => (
            <div key={item.title} className="surface-card surface-card-hover p-5">
              <p className="eyebrow">{item.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 pt-16 pb-20 sm:px-8 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="eyebrow">Recrutamento por capacidade</p>
          <h1 className="text-display mt-4 text-[2.6rem] leading-[1.02] sm:text-[3.5rem]">
            Encontre quem consegue fazer.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Uma nova forma de conectar empresas e talentos baseada em competências, projetos e capacidade demonstrada.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ perfil: "empresa" }}>
                Quero contratar
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth" search={{ perfil: "candidato" }}>
                Sou candidato
              </Link>
            </Button>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Entendemos o trabalho. Encontramos o talento. Você decide.
          </p>
        </div>
        <ConnectionGraphic className="w-full" />
      </section>

      <HowItWorks />
      <Differential />
      <SiteFooter />
    </div>
  );
}
