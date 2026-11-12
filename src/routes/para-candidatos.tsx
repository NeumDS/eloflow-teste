import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/eloflow/SiteHeader";

export const Route = createFileRoute("/para-candidatos")({
  head: () => ({
    meta: [
      { title: "Para candidatos — mostre o que você sabe fazer | EloFlow" },
      {
        name: "description",
        content:
          "Projetos, GitHub, simulações e desafios mostram sua capacidade além do currículo.",
      },
      { property: "og:title", content: "Para candidatos — EloFlow" },
      {
        property: "og:description",
        content: "Seu currículo é uma parte do seu perfil. Seus projetos também contam.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="eyebrow">Para candidatos</p>
        <h1 className="text-display mt-3 max-w-2xl text-4xl sm:text-5xl">
          Mostre o que você sabe fazer.
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          Seu currículo é uma parte do seu perfil. Seus projetos, seu código e a forma como você
          decide também contam.
        </p>
        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          {[
            { title: "Projetos", text: "Problema, solução, tecnologias e resultado." },
            { title: "GitHub", text: "Evidências reais do que você constrói." },
            { title: "Simulações", text: "Situações da rotina da vaga, não pegadinhas." },
          ].map((item) => (
            <div key={item.title} className="surface-card surface-card-hover p-6">
              <h2 className="text-lg">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
        <Button asChild size="lg" className="mt-10">
          <Link to="/auth" search={{ perfil: "candidato" }}>
            Sou candidato
          </Link>
        </Button>
      </section>
      <SiteFooter />
    </div>
  );
}
