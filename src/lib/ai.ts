/**
 * AIService — MOCK funcional.
 *
 * Nenhuma API de IA está configurada neste MVP. As funções abaixo produzem
 * resultados realistas e determinísticos a partir dos dados reais do banco,
 * e a interface sempre indica que se trata de uma demonstração.
 */

export const AI_IS_MOCK = true;

export type Diagnosis = {
  responsabilidades: string[];
  skills: string[];
  senioridade: string;
  ferramentas: string[];
  problemas: string[];
  criterios: string[];
  obrigatorios: string[];
  desejaveis: string[];
  confirmar?: string[];
};

export type JobDna = {
  fara: string[];
  precisa_saber: string[];
  pode_aprender: string[];
  problemas: string[];
  avaliacao: string[];
};

const delay = (ms = 900) => new Promise((resolve) => setTimeout(resolve, ms));

export const AIService = {
  async transcribeCall(input: { title: string; company: string }): Promise<string> {
    await delay(1200);
    return [
      `Especialista EloFlow: Antes de criar a vaga de ${input.title}, queria entender o trabalho de verdade. O que essa pessoa vai fazer na primeira semana?`,
      `${input.company}: Ela entra direto no time que cuida do nosso maior gargalo. Hoje o processo é manual e leva dias.`,
      "Especialista EloFlow: Quais problemas mais doem hoje?",
      `${input.company}: Retrabalho, falta de visibilidade e dependência de uma única pessoa.`,
      "Especialista EloFlow: E como vocês vão saber que a contratação deu certo em 90 dias?",
      `${input.company}: Se o processo cair para menos da metade do tempo e o time conseguir operar sem depender de nós.`,
      "Especialista EloFlow: Que ferramentas fazem parte do dia a dia?",
      `${input.company}: Nosso stack principal, versionamento no GitHub e acompanhamento de métricas.`,
      "Especialista EloFlow: Perfeito. Vou estruturar isso em um perfil de oportunidade e devolvo para validação.",
    ].join("\n\n");
  },

  async analyzeCall(input: { title: string; area?: string | null; seniority?: string | null }) {
    await delay(1400);
    return this.generateJobProfile(input);
  },

  async generateJobProfile(input: {
    title: string;
    area?: string | null;
    seniority?: string | null;
  }): Promise<Diagnosis> {
    await delay(400);
    const base = input.title.toLowerCase();
    const tech = /dev|engenh|full|back|front|dados|dev ?ops|qa/.test(base);
    return {
      responsabilidades: [
        `Assumir o principal gargalo relacionado a ${input.area ?? "operação"}`,
        "Reduzir retrabalho manual do time",
        "Documentar decisões e deixar o processo replicável",
      ],
      skills: tech
        ? ["Resolução de problemas", "Modelagem", "Versionamento", "Comunicação técnica"]
        : ["Discovery", "Métricas", "Comunicação", "Priorização"],
      senioridade: input.seniority ?? "Pleno",
      ferramentas: tech ? ["GitHub", "Observabilidade", "SQL"] : ["Planilhas", "Analytics", "Figma"],
      problemas: [
        "Processo manual e demorado",
        "Dependência de uma única pessoa",
        "Falta de visibilidade dos indicadores",
      ],
      criterios: [
        "Reduzir o tempo do processo em pelo menos 50% em 90 dias",
        "Time operando sem dependência de liderança",
      ],
      obrigatorios: tech ? ["Experiência prática no stack principal"] : ["Experiência com dados"],
      desejaveis: ["Experiência no setor", "Autonomia em ambiente de mudança"],
      confirmar: [
        "A pessoa terá autonomia para alterar o processo?",
        "Existe orçamento para ferramentas?",
        "A senioridade indicada está correta?",
      ],
    };
  },

  toDna(diagnosis: Diagnosis): JobDna {
    return {
      fara: diagnosis.responsabilidades,
      precisa_saber: [...diagnosis.obrigatorios, ...diagnosis.skills].slice(0, 5),
      pode_aprender: diagnosis.desejaveis,
      problemas: diagnosis.problemas,
      avaliacao: ["Simulação baseada na rotina real", "Desafio prático da empresa"],
    };
  },

  /** Score determinístico a partir de skills, projetos e evidências reais. */
  matchCandidates<
    T extends {
      id: string;
      full_name: string;
      skills: string[] | null;
      seniority: string | null;
      github_username: string | null;
      projectTechs?: string[];
    },
  >(candidates: T[], job: { seniority?: string | null; dna?: JobDna | null; skills?: string[] }) {
    const target = (job.skills ?? job.dna?.precisa_saber ?? []).map((s) => s.toLowerCase());
    return candidates
      .map((candidate) => {
        const skills = (candidate.skills ?? []).map((s) => s.toLowerCase());
        const techs = (candidate.projectTechs ?? []).map((s) => s.toLowerCase());
        const reasons: string[] = [];
        let score = 58;
        const skillHits = target.filter((t) => skills.some((s) => s.includes(t) || t.includes(s)));
        if (skillHits.length) {
          score += Math.min(22, skillHits.length * 8);
          reasons.push(`Skill compatível: ${skillHits.slice(0, 2).join(", ")}`);
        }
        const techHits = target.filter((t) => techs.some((s) => s.includes(t) || t.includes(s)));
        if (techHits.length) {
          score += Math.min(14, techHits.length * 6);
          reasons.push("Projeto semelhante no portfólio");
        }
        if (candidate.github_username) {
          score += 5;
          reasons.push("Evidências no GitHub");
        }
        if (job.seniority && candidate.seniority === job.seniority) {
          score += 6;
          reasons.push("Senioridade alinhada");
        }
        if (reasons.length === 0) reasons.push("Perfil adjacente com potencial de aprendizado");
        return { ...candidate, score: Math.min(97, score), reasons: reasons.slice(0, 3) };
      })
      .sort((a, b) => b.score - a.score);
  },

  async generateSimulation(job: { title: string }) {
    await delay(900);
    return {
      title: `Rotina real — ${job.title}`,
      intro: "Esta simulação foi criada a partir das necessidades reais da vaga.",
      questions: [
        {
          situation:
            "Um cliente encontrou um erro crítico no sistema. Você possui três tarefas pendentes. Como priorizaria?",
          options: [
            "Resolver o erro crítico e comunicar o impacto das demais entregas",
            "Finalizar as tarefas pendentes antes de olhar o erro",
            "Delegar o erro sem contexto",
          ],
        },
        {
          situation: "A liderança pede uma entrega que compromete a qualidade. Como conduz?",
          options: [
            "Apresentar trade-offs com dados e propor um recorte menor",
            "Aceitar sem discutir",
            "Recusar sem alternativa",
          ],
        },
      ],
    };
  },

  evaluateSimulation(answers: number[]) {
    const correct = answers.filter((a) => a === 0).length;
    const score = Math.round((correct / Math.max(1, answers.length)) * 100);
    const feedback =
      score >= 80
        ? "Priorização consistente: você trata impacto no cliente como critério e comunica trade-offs."
        : score >= 50
          ? "Boa base de decisão. Pode ganhar clareza ao comunicar impacto antes de executar."
          : "As escolhas priorizaram execução sobre impacto. Vale explicitar critérios antes de agir.";
    return { score, feedback };
  },

  evaluateChallenge(answer: string) {
    const words = answer.trim().split(/\s+/).filter(Boolean).length;
    const score = Math.max(45, Math.min(96, 45 + words));
    return {
      score,
      feedback:
        words < 40
          ? "Resposta enviada. Descrever contexto, decisão e resultado esperado aumenta a leitura da sua capacidade."
          : "Resposta enviada com bom detalhamento de problema, decisão e critério de sucesso.",
    };
  },
};
