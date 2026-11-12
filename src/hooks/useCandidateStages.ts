import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/data";
import { isStage3Open } from "@/lib/stages";
import { useAuth } from "@/hooks/useAuth";

/** Indica se alguma candidatura do candidato já liberou a etapa 3 (simulador de rotina). */
export function useStage3Open() {
  const { identity } = useAuth();
  const candidateId = identity?.id ?? "";
  const query = useQuery({
    queryKey: ["stages", candidateId],
    queryFn: () =>
      unwrap(
        supabase.from("applications").select("stage").eq("candidate_id", candidateId),
      ) as Promise<{ stage: string }[]>,
    enabled: !!candidateId,
  });
  return {
    isLoading: query.isLoading,
    open: (query.data ?? []).some((row) => isStage3Open(row.stage)),
  };
}
