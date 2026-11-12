import type { ReactNode } from "react";
import { AlertCircle, ArrowLeft, Inbox, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string | undefined;
  title: string;
  subtitle?: string | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h1 className="text-display text-3xl text-foreground sm:text-[2.1rem]">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function BackButton({
  to,
  label,
  params,
}: {
  to: string;
  label: string;
  params?: Record<string, string>;
}) {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
      <Link to={to} {...(params ? { params } : {})}>
        <ArrowLeft className="size-3.5" aria-hidden /> {label}
      </Link>
    </Button>
  );
}

export function StatCard({
  label,
  value,
  hint,
  to,
  search,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  to?: string;
  search?: Record<string, string>;
}) {
  const body = (
    <>
      <p className="eyebrow">{label}</p>
      <p className="text-display mt-2 text-3xl text-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </>
  );
  if (to) {
    return (
      <Link
        to={to}
        {...(search ? { search } : {})}
        className="surface-card surface-card-hover block p-5"
      >
        {body}
      </Link>
    );
  }
  return <div className="surface-card p-5">{body}</div>;
}

export function Loading({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <Inbox className="size-5 text-muted-foreground" aria-hidden />
      <p className="text-display text-lg">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="surface-card flex items-start gap-3 border-destructive/30 p-5 text-sm">
      <AlertCircle className="mt-0.5 size-4 text-destructive" aria-hidden />
      <div>
        <p className="font-medium">Não foi possível carregar estas informações.</p>
        <p className="mt-1 text-muted-foreground">{message ?? "Tente novamente em instantes."}</p>
      </div>
    </div>
  );
}

export function MatchBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
      <span className="size-1.5 rounded-full bg-primary" aria-hidden />
      {score}% compatível
    </span>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-700"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function MockNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
      {children}
    </p>
  );
}

export function SectionTabs({ items }: { items: { to: string; label: string }[] }) {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-border pb-4" aria-label="Seções">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: true }}
          className="shrink-0 rounded-full px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

const STAGES = [
  { key: "candidatura_enviada", label: "Candidatura enviada" },
  { key: "perfil_analisado", label: "Perfil analisado" },
  { key: "avaliacao", label: "Avaliação" },
  { key: "entrevista", label: "Entrevista" },
  { key: "decisao", label: "Decisão" },
  { key: "aprovado", label: "Aprovado" },
];

export function Timeline({ stage }: { stage: string }) {
  const current = Math.max(
    0,
    STAGES.findIndex((s) => s.key === stage),
  );
  return (
    <ol className="space-y-3">
      {STAGES.map((item, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={item.key} className="flex items-center gap-3 text-sm">
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full border text-[10px]",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary text-primary",
                !done && !active && "border-border text-muted-foreground",
              )}
              aria-hidden
            >
              {done ? "✓" : active ? "●" : "○"}
            </span>
            <span className={cn(done || active ? "text-foreground" : "text-muted-foreground")}>
              {item.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
