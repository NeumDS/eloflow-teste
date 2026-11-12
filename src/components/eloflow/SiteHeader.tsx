import { Link } from "@tanstack/react-router";
import { LogoLink } from "./Logo";
import { Button } from "@/components/ui/button";

const LINKS = [
  { to: "/como-funciona", label: "Como funciona" },
  { to: "/para-empresas", label: "Para empresas" },
  { to: "/para-candidatos", label: "Para candidatos" },
  { to: "/planos", label: "Planos" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <LogoLink />
        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-muted-foreground transition-colors hover:text-primary data-[status=active]:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm">
          <Link to="/auth" search={{ perfil: "empresa" }}>
            Acessar Conta
          </Link>
        </Button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-sand">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-end md:justify-between">
        <div>
          <LogoLink />
          <p className="text-display mt-4 text-xl text-primary">&ldquo;Encontre quem consegue fazer.&rdquo;</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Humano entende. IA estrutura. Candidato demonstra. Empresa decide.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm text-muted-foreground hover:text-primary">
              {link.label}
            </Link>
          ))}
          <Link
            to="/auth"
            search={{ perfil: "candidato" }}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </footer>
  );
}
