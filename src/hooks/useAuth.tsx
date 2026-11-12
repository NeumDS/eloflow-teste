import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "candidato" | "empresa" | "especialista";

export type Identity = {
  role: Role;
  id: string;
  name: string;
  email: string;
};

type AuthState = {
  session: Session | null;
  identity: Identity | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function resolveIdentity(email: string): Promise<Identity | null> {
  const [candidate, company, specialist] = await Promise.all([
    supabase.from("candidates").select("id, full_name").eq("email", email).maybeSingle(),
    supabase.from("companies").select("id, name").eq("email", email).maybeSingle(),
    supabase.from("specialists").select("id, full_name").eq("email", email).maybeSingle(),
  ]);

  if (candidate.data)
    return { role: "candidato", id: candidate.data.id, name: candidate.data.full_name, email };
  if (company.data) return { role: "empresa", id: company.data.id, name: company.data.name, email };
  if (specialist.data)
    return { role: "especialista", id: specialist.data.id, name: specialist.data.full_name, email };
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (nextSession: Session | null) => {
    setSession(nextSession);
    if (nextSession?.user.email) {
      setIdentity(await resolveIdentity(nextSession.user.email));
    } else {
      setIdentity(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      if (event === "TOKEN_REFRESHED") {
        setSession(nextSession);
        return;
      }
      void load(nextSession);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (active) void load(data.session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      identity,
      loading,
      refresh: async () => {
        const { data } = await supabase.auth.getSession();
        await load(data.session);
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setIdentity(null);
        setSession(null);
      },
    }),
    [session, identity, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
