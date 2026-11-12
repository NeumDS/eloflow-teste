import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/eloflow/SiteHeader";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos EloFlow — Flow e Plus" },
      {
        name: "description",
        content:
          "Do diagnóstico da vaga ao matching por evidências e à experiência presencial estruturada do EloFlow Plus.",
      },
      { property: "og:title", content: "Planos EloFlow" },
      {
        property: "og:description",
        content: "Flow e Plus: escolha o nível de acompanhamento da sua contratação.",
      },
    ],
  }),
  component: Page,
});

const PLANS = [
  {
    name: "Flow",
    items: [
      "Atendimento humanizado on-line",
      "Descrição personalizada da vaga",
      "Desafio baseado na rotina real",
      "Filtro de candidatos",
      "Shortlist dos mais compatíveis",
    ],
    featured: true,
  },
  {
    name: "Plus",
    price: "Sob consulta",
    items: ["Tudo do Flow", "Consultoria presencial", "Diagnóstico aprofundado da empresa"],
  },
];

function Page() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="eyebrow">Planos</p>
        <h1 className="text-display mt-3 text-4xl sm:text-5xl">Escolha o nível de profundidade.</h1>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.featured ? "surface-card border-primary/40 p-6 ring-1 ring-primary/15" : "surface-card p-6"
              }
            >
              <h2 className="text-xl">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{plan.price}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {plan.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant={plan.featured ? "default" : "outline"}>
                <Link to="/auth" search={{ perfil: "empresa" }}>
                  Quero contratar
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
