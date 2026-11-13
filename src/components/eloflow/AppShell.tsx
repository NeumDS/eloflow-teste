
import { Link, useRouter } from "@tanstack/react-router";
import { LogOut, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth, type Role } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export type NavItem = { to: string; label: string; routes: string[] };

const NAV: Record<Role, NavItem[]> = {
  candidato: [
    { to: "/candidato", label: "Início", routes: ["/candidato"] },
    { to: "/candidato/feed", label: "Feed", routes: ["/candidato/feed"] },
    {
      to: "/candidato/perfil",
      label: "Meu perfil",
      routes: ["/candidato/perfil", "/candidato/projetos", "/candidato/github", "/candidato/curriculo"],
    },
    {
      to: "/candidato/oportunidades",
      label: "Oportunidades",
      routes: ["/candidato/oportunidades", "/candidato/vaga"],
    },
    { to: "/candidato/candidaturas", label: "Candidaturas", routes: ["/candidato/candidaturas"] },
    { to: "/candidato/avaliacoes", label: "Avaliações", routes: ["/candidato/avaliacoes", "/candidato/simulacao"] },
  ],
  empresa: [
    { to: "/empresa", label: "Início", routes: ["/empresa"] },
    { to: "/empresa/feed", label: "Feed", routes: ["/empresa/feed"] },
    {
      to: "/empresa/contratacoes",
      label: "Contratações",
      routes: [
        "/empresa/contratacoes",
        "/empresa/contratacao/nova",
        "/empresa/desafios",
        "/empresa/vaga",
        "/empresa/agendar",
      ],
    },
    {
      to: "/empresa/candidatos",
      label: "Candidatos",
      routes: ["/empresa/candidatos", "/empresa/candidato", "/empresa/validacao"],
    },
    {
      to: "/empresa/agenda",
      label: "Agenda",
      routes: ["/empresa/agenda", "/empresa/agendar"],
    },
    {
      to: "/empresa/plus",
      label: "EloFlow Plus",
      routes: ["/empresa/plus"],
    },
    {
      to: "/empresa/configuracoes",
      label: "Configurações",
      routes: ["/empresa/configuracoes"],
    },
  ],
  especialista: [
    { to: "/especialista", label: "Início", routes: ["/especialista"] },
    {
      to: "/especialista/agenda",
      label: "Agenda",
      routes: ["/especialista/agenda", "/especialista/calls", "/especialista/call"],
    },
    {
      to: "/especialista/validacoes",
      label: "Avaliações",
      routes: ["/especialista/validacoes", "/especialista/validacao", "/especialista/processos"],
    },
    {
      to: "/especialista/vagas",
      label: "Vagas",
      routes: ["/especialista/vagas"],
    },
    {
      to: "/especialista/empresas",
      label: "Empresas e candidatos",
      routes: ["/especialista/empresas", "/especialista/candidatos"],
    },
  ],
};

const AREA_LABEL: Record<Role, string> = {
  candidato: "Área do candidato",
  empresa: "Área da empresa",
  especialista: "Área do especialista",
};

function isGroupActive(pathname: string, routes: string[]) {
  return routes.some((route) => {
    if (pathname === route) return true;
    const prefix = route.endsWith("/") ? route : `${route}/`;
    return pathname.startsWith(prefix);
  });
}

export function AppShell({ children }: { children: ReactNode }) {
  const { identity, signOut } = useAuth();
  const navigate = useRouter().navigate;
  const pathname = useRouter().state.location.pathname;
  const [open, setOpen] = useState(false);
  const role: Role = identity?.role ?? "candidato";
  const items = NAV[role];

  return (
    <div className="min-h-screen bg-sand-light">
      <div className="mx-auto flex w-full max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sand-light px-5 py-6 lg:flex">
          <Link to="/">
            <Logo />
          </Link>

          <p className="eyebrow mt-8">{AREA_LABEL[role]}</p>

          <nav className="mt-3 flex flex-col gap-0.5">
            {items.map((item) => {
              const active = isGroupActive(pathname, item.routes);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary hover:text-foreground",
                    active
                      ? "bg-secondary font-medium text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-border pt-4">
            <p className="truncate text-sm font-medium">
              {identity?.name ?? "—"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {identity?.email}
            </p>

            <Button
              variant="ghost"
              size="sm"
              className="mt-2 -ml-2 text-muted-foreground"
              onClick={async () => {
                await signOut();
                void navigate({ to: "/" });
              }}
            >
              <LogOut className="size-3.5" /> Sair
            </Button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-border bg-background/80 px-5 py-3 backdrop-blur lg:hidden">
            <Logo size={32} />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen((v) => !v)}
            >
              <Menu className="size-4" />
              <span className="sr-only">Menu</span>
            </Button>
          </header>

          {open ? (
            <nav className="flex flex-col gap-0.5 border-b border-border bg-sand px-4 py-3 lg:hidden">
              {items.map((item) => {
                const active = isGroupActive(pathname, item.routes);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <Button
                variant="ghost"
                size="sm"
                className="mt-1 justify-start"
                onClick={async () => {
                  await signOut();
                  void navigate({ to: "/" });
                }}
              >
                <LogOut className="size-3.5" /> Sair
              </Button>
            </nav>
          ) : null}

          <main
            className={cn(
              "mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12",
              "flex flex-col gap-8",
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
