import { createServerFn } from "@tanstack/react-start";

export const DEMO_PASSWORD = "EloFlowDemo2026!";

const DEMO_ACCOUNTS = {
  candidato: { email: "candidato@eloflow.demo", name: "Ana Silva" },
  empresa: { email: "empresa@eloflow.demo", name: "Nortis Tecnologia" },
  especialista: { email: "especialista@eloflow.demo", name: "Marina Duarte" },
} as const;

export type DemoRole = keyof typeof DEMO_ACCOUNTS;

/** Garante que a conta demo exista no login (senha fixa, e-mail confirmado). */
export const ensureDemoAccount = createServerFn({ method: "POST" })
  .inputValidator((data: { role: DemoRole }) => {
    if (!data || !(data.role in DEMO_ACCOUNTS)) throw new Error("Perfil demo inválido");
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const account = DEMO_ACCOUNTS[data.role];

    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users.find((u) => u.email === account.email);

    if (existing) {
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
      });
    } else {
      const { error } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: account.name, role: data.role, demo: true },
      });
      if (error) throw new Error(error.message);
    }

    return { email: account.email, password: DEMO_PASSWORD };
  });
