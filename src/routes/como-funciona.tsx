import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/eloflow/SiteHeader";
import { Differential, HowItWorks } from "./index";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como funciona a EloFlow — quatro etapas" },
      {
        name: "description",
        content: "Entendemos, estruturamos com IA, encontramos por evidências e conectamos empresa e candidato.",
      },
      { property: "og:title", content: "Como funciona a EloFlow" },
      {
        property: "og:description",
        content: "Quatro etapas: entendemos, estruturamos, encontramos, conectamos.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto w-full max-w-6xl px-5 pt-16 pb-4 sm:px-8 sm:pt-20">
        <p className="eyebrow">Processo</p>
        <h1 className="text-display mt-3 max-w-2xl text-4xl sm:text-5xl">
          Uma conversa humana. Um perfil estruturado. Uma decisão informada.
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          O processo da EloFlow existe para responder uma única pergunta: essa pessoa consegue fazer o trabalho?
        </p>
        <Button asChild className="mt-8">
          <Link to="/auth" search={{ perfil: "empresa" }}>
            Quero contratar
          </Link>
        </Button>
      </section>
      <HowItWorks />
      <Differential />
      <SiteFooter />
    </div>
  );
}
