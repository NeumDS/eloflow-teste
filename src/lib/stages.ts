/** Etapas do processo seletivo compartilhadas entre as áreas. */
export const STAGE_ORDER = [
  "candidatura_enviada",
  "perfil_analisado",
  "avaliacao",
  "entrevista",
  "decisao",
  "aprovado",
] as const;

export type Stage = (typeof STAGE_ORDER)[number];

export const stageIndex = (stage: string) => {
  const index = STAGE_ORDER.indexOf(stage as Stage);
  return index < 0 ? 0 : index;
};

/** Etapa 1 = cadastro/perfil, Etapa 2 = testes técnicos, Etapa 3 = simulador de rotina. */
export const stageNumber = (stage: string) => {
  const index = stageIndex(stage);
  if (index >= 3) return 3;
  if (index >= 1) return 2;
  return 1;
};

export const isStage2Open = (stage: string) => stageNumber(stage) >= 2;
export const isStage3Open = (stage: string) => stageNumber(stage) >= 3;

export const STAGE_LABEL: Record<string, string> = {
  candidatura_enviada: "Candidatura enviada",
  perfil_analisado: "Perfil analisado",
  avaliacao: "Avaliação",
  entrevista: "Entrevista",
  decisao: "Decisão",
  aprovado: "Aprovado",
};

/** Compatibilidade mínima para o candidato poder se candidatar. */
export const MIN_APPLY_SCORE = 50;
/** Compatibilidade mínima para candidatura automática. */
export const AUTO_APPLY_SCORE = 90;
