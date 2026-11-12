import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/eloflow/AppShell";
import { Loading } from "@/components/eloflow/ui";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, identity, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth", search: { perfil: "candidato" } });
  }, [loading, session, navigate]);

  if (loading || !session || !identity) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6">
        <Loading label="Preparando sua área…" />
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
