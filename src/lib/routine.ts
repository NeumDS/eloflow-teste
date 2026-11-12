/**
 * Simulador de rotina — gera um "dia de trabalho" determinístico a partir dos
 * dados reais da vaga (título, área, senioridade e DNA validado).
 * Demonstração funcional de IA: mesma vaga = mesma rotina.
 */
import type { JobDna } from "@/lib/ai";

export type RoutineOption = { label: string; weight: number; why: string };

export type RoutineTask =
  | {
      kind: "choice";
      time: string;
      title: string;
      context: string;
      code?: string;
      options: RoutineOption[];
    }
  | {
      kind: "priority";
      time: string;
      title: string;
      context: string;
      items: { id: string; label: string; rank: number }[];
    }
  | {
      kind: "text";
      time: string;
      title: string;
      context: string;
      hint: string;
    };

export type RoutineScheduleItem = { time: string; activity: string; focus: string };

export type RoutineDay = {
  title: string;
  intro: string;
  schedule: RoutineScheduleItem[];
  tasks: RoutineTask[];
};

export type JobLike = {
  title: string;
  area?: string | null;
  seniority?: string | null;
  dna?: JobDna | null;
  companyName?: string | null;
};

const firstOr = (list: string[] | undefined, fallback: string): string =>
  list && list.length > 0 && list[0] ? list[0] : fallback;

const GENERIC_SCHEDULE: RoutineScheduleItem[] = [
  { time: "09:00", activity: "Alinhamento do time", focus: "Prioridades do dia e bloqueios." },
  { time: "09:30", activity: "Fila da manhã", focus: "Triagem do que é urgente e do que espera." },
  { time: "10:30", activity: "Execução principal", focus: "Trabalho profundo na entrega da semana." },
  { time: "13:00", activity: "Almoço", focus: "Pausa para descanso." },
  { time: "14:00", activity: "Resolução de problemas", focus: "Investigar e corrigir o que travou." },
  { time: "16:00", activity: "Integração com outras áreas", focus: "Conectar sua entrega ao resto." },
  { time: "17:30", activity: "Fechamento", focus: "Comunicar decisões e organizar pendências." },
];

const DEV_SCHEDULE: RoutineScheduleItem[] = [
  {
    time: "09:00",
    activity: "Daily Meeting (Stand-up)",
    focus:
      "Reunião de 15 minutos com a equipe: o que foi feito ontem, o que será feito hoje e bloqueios técnicos.",
  },
  {
    time: "09:30",
    activity: "Code Review",
    focus: "Revisar o código de outros devs antes de integrar ao projeto principal.",
  },
  {
    time: "10:30",
    activity: "Desenvolvimento de features",
    focus: "Transformar as telas do Figma em componentes, formulários e interações funcionais.",
  },
  { time: "13:00", activity: "Almoço", focus: "Pausa para descanso." },
  {
    time: "14:00",
    activity: "Correção de bugs",
    focus: "Investigar problemas relatados por usuários e QA (mobile, ações que não disparam).",
  },
  {
    time: "16:00",
    activity: "Integração com back-end",
    focus: "Conectar a interface às APIs e garantir que os dados apareçam corretamente.",
  },
  {
    time: "17:30",
    activity: "Testes e Pull Request",
    focus: "Rodar testes automatizados e abrir o PR para produção.",
  },
  { time: "18:00", activity: "Fim do expediente", focus: "Organizar pendências para o dia seguinte." },
];

const BUGGY_CODE = `import { useState } from 'react';

function ListaDeCompras() {
  const [itens, setItens] = useState(['Maçã', 'Banana']);

  const adicionarItem = () => {
    itens.push('Laranja');
    setItens(itens);
  };

  return (
    <div>
      <ul>{itens.map(item => <li key={item}>{item}</li>)}</ul>
      <button onClick={adicionarItem}>Adicionar Laranja</button>
    </div>
  );
}`;

const isDevRole = (job: JobLike) => {
  const text = `${job.title} ${job.area ?? ""} ${(job.dna?.precisa_saber ?? []).join(" ")}`.toLowerCase();
  return /dev|front|back|full ?stack|engenhar|software|program|react|javascript|typescript/.test(text);
};

function devRoutine(job: JobLike, company: string, entrega: string): RoutineDay {
  return {
    title: `Um dia como ${job.title}`,
    intro: `Você acabou de entrar na ${company}. Abaixo está a rotina diária típica desta vaga. Você vai passar pelas mesmas decisões do dia a dia: stand-up, code review, correção de bug real e fechamento escrito.`,
    schedule: DEV_SCHEDULE,
    tasks: [
      {
        kind: "priority",
        time: "09:00",
        title: "Daily: o que entra primeiro na fila?",
        context:
          "Você tem três frentes na mesa depois do stand-up. Ordene da primeira à última coisa que você faria.",
        items: [
          { id: "a", label: "Bug em produção impedindo checkout de usuários", rank: 1 },
          { id: "b", label: "Code review pendente que bloqueia o PR de um colega", rank: 2 },
          { id: "c", label: "Refatorar a documentação de componentes do design system", rank: 3 },
        ],
      },
      {
        kind: "choice",
        time: "09:30",
        title: "Code review: o PR de um colega",
        context:
          "No review você encontra o código abaixo. O clique acontece, mas a lista na tela não atualiza. Qual comentário você deixa no PR?",
        code: BUGGY_CODE,
        options: [
          {
            label:
              "Mutação direta de estado: trocar por setItens([...itens, 'Laranja']) para criar um novo array",
            weight: 3,
            why: "Identificou a mutação direta do estado — o React só re-renderiza com uma nova referência.",
          },
          {
            label: "Adicionar um setTimeout antes do setItens para forçar a atualização da tela",
            weight: 1,
            why: "Forçar timing esconde o problema: a referência do array continua a mesma.",
          },
          {
            label: "Trocar a key do map por index para o React perceber a mudança",
            weight: 0,
            why: "A key não é a causa: o estado foi mutado no lugar.",
          },
          {
            label: "Aprovar o PR: o código funciona localmente",
            weight: 0,
            why: "Aprovar sem reproduzir o comportamento deixa o bug chegar ao usuário.",
          },
        ],
      },
      {
        kind: "choice",
        time: "14:00",
        title: "Bug fixing: relato do QA",
        context:
          "O QA relata que um botão desalinha no mobile e às vezes não dispara a ação. Qual seu primeiro movimento?",
        options: [
          {
            label: "Reproduzir o cenário, isolar em teste e só então corrigir",
            weight: 3,
            why: "Reproduzir antes de corrigir evita conserto no lugar errado.",
          },
          {
            label: "Ajustar o CSS direto e mandar para o QA validar",
            weight: 1,
            why: "Correção sem reprodução costuma voltar como regressão.",
          },
          {
            label: "Pedir mais detalhes e seguir para outra tarefa",
            weight: 0,
            why: "A vaga pede autonomia para investigar com o que já existe.",
          },
        ],
      },
      {
        kind: "choice",
        time: "16:00",
        title: "Integração com back-end",
        context:
          "A API demora e às vezes devolve erro. A tela fica em branco enquanto isso. Como você entrega?",
        options: [
          {
            label: "Tratar loading e erro na UI e alinhar o contrato da API com o back-end",
            weight: 3,
            why: "Cobriu os estados da interface e conversou sobre o contrato.",
          },
          {
            label: "Colocar dados mockados fixos para a tela nunca ficar vazia",
            weight: 1,
            why: "Mock fixo esconde a falha real do usuário.",
          },
          {
            label: "Subir como está: o erro é do back-end",
            weight: 0,
            why: "O estado de erro na tela é responsabilidade do front-end.",
          },
        ],
      },
      {
        kind: "text",
        time: "17:30",
        title: "Pull Request e fechamento do dia",
        context: `Escreva a descrição do PR e o recado para o time sobre ${entrega.toLowerCase()}.`,
        hint: "Contexto do problema, causa raiz, o que mudou, como testar e o que ficou pendente.",
      },
    ],
  };
}

export function buildRoutineDay(job: JobLike): RoutineDay {
  const area = job.area ?? "operação";
  const company = job.companyName ?? "empresa";
  const problema = firstOr(job.dna?.problemas, "processo manual e demorado");
  const entrega = firstOr(job.dna?.fara, `destravar o principal gargalo de ${area}`);
  const skill = firstOr(job.dna?.precisa_saber, "resolução de problemas");

  if (isDevRole(job)) return devRoutine(job, company, entrega);

  return {
    title: `Um dia como ${job.title}`,
    intro: `Você acabou de entrar na ${company}. Abaixo está a rotina real desta vaga: a fila do dia, decisões e uma entrega escrita. Não existem respostas “de prova” — avaliamos como você prioriza, decide e comunica.`,
    schedule: GENERIC_SCHEDULE,
    tasks: [
      {
        kind: "priority",
        time: "09h00",
        title: "Fila da manhã",
        context: `Você abre o dia com três frentes na mesa. Ordene da primeira à última coisa que você faria.`,
        items: [
          { id: "a", label: `Um erro está impactando clientes agora em ${area}`, rank: 1 },
          { id: "b", label: `Reunião de alinhamento sobre ${entrega.toLowerCase()}`, rank: 2 },
          { id: "c", label: "Organizar a documentação interna do time", rank: 3 },
        ],
      },
      {
        kind: "choice",
        time: "10h30",
        title: "Diagnóstico antes da ação",
        context: `O time relata que ${problema.toLowerCase()}. Ninguém mediu o impacto ainda. Qual seu primeiro movimento?`,
        options: [
          {
            label: "Levantar dados do processo atual e medir onde o tempo é perdido",
            weight: 3,
            why: "Você mede antes de mudar — evita resolver o sintoma errado.",
          },
          {
            label: "Propor uma ferramenta nova já na próxima reunião",
            weight: 1,
            why: "Solução antes do diagnóstico costuma gerar retrabalho.",
          },
          {
            label: "Esperar a liderança definir a prioridade",
            weight: 0,
            why: "A vaga pede autonomia para puxar o problema.",
          },
        ],
      },
      {
        kind: "choice",
        time: "13h00",
        title: "Trade-off de prazo",
        context:
          "A liderança pede a entrega em metade do prazo. Fazer tudo com qualidade não cabe. Como você conduz?",
        options: [
          {
            label: "Propor um recorte menor com valor entregue e explicitar o que fica de fora",
            weight: 3,
            why: "Negociar escopo com clareza é o comportamento esperado.",
          },
          {
            label: "Aceitar o prazo e absorver o risco de qualidade",
            weight: 1,
            why: "Silenciar o risco transfere o problema para frente.",
          },
          {
            label: "Recusar o prazo sem apresentar alternativa",
            weight: 0,
            why: "Faltou proposta: a decisão volta para a liderança sem opções.",
          },
        ],
      },
      {
        kind: "choice",
        time: "15h30",
        title: `Uso de ${skill.toLowerCase()}`,
        context: `Você precisa aplicar ${skill.toLowerCase()} em uma situação nova, sem alguém para consultar. O que faz?`,
        options: [
          {
            label: "Testar em pequeno, validar com dados e registrar a decisão",
            weight: 3,
            why: "Aprendizado em ciclos curtos com rastro de decisão.",
          },
          {
            label: "Seguir o que já é feito hoje, mesmo sem entender o motivo",
            weight: 1,
            why: "Repetir o processo sem entendê-lo mantém o gargalo.",
          },
          {
            label: "Postergar até alguém explicar",
            weight: 0,
            why: "A vaga exige avanço mesmo com incerteza.",
          },
        ],
      },
      {
        kind: "text",
        time: "17h30",
        title: "Fechamento do dia",
        context: `Escreva o recado que você enviaria ao time no fim do dia sobre ${entrega.toLowerCase()}.`,
        hint: "Contexto, decisão tomada, impacto esperado e o que você precisa de outras pessoas.",
      },
    ],
  };
}

export type RoutineAnswers = {
  order?: string[];
  choices: Record<number, number>;
  note: string;
};

export function evaluateRoutine(day: RoutineDay, answers: RoutineAnswers) {
  let earned = 0;
  let total = 0;
  const highlights: string[] = [];

  day.tasks.forEach((task, index) => {
    if (task.kind === "priority") {
      total += 3;
      const expected = [...task.items].sort((a, b) => a.rank - b.rank).map((i) => i.id);
      const given = answers.order ?? [];
      const hits = expected.filter((id, i) => given[i] === id).length;
      const points = hits === expected.length ? 3 : hits >= expected.length - 1 ? 2 : 1;
      earned += points;
      highlights.push(
        points === 3
          ? "Priorizou impacto no cliente antes de alinhamento e organização interna."
          : "A ordem escolhida deixou o impacto em clientes para depois de tarefas internas.",
      );
    }
    if (task.kind === "choice") {
      total += 3;
      const chosen = answers.choices[index];
      const option = typeof chosen === "number" ? task.options[chosen] : undefined;
      earned += option?.weight ?? 0;
      if (option) highlights.push(option.why);
    }
    if (task.kind === "text") {
      total += 3;
      const words = answers.note.trim().split(/\s+/).filter(Boolean).length;
      const points = words >= 60 ? 3 : words >= 25 ? 2 : words > 0 ? 1 : 0;
      earned += points;
      highlights.push(
        points >= 2
          ? "Comunicação escrita com contexto e decisão explícitos."
          : "O fechamento escrito ficou curto para mostrar contexto e decisão.",
      );
    }
  });

  const score = Math.round((earned / Math.max(1, total)) * 100);
  const summary =
    score >= 80
      ? "Rotina conduzida como esperado na vaga: diagnostica, negocia escopo e comunica."
      : score >= 55
        ? "Boa base de execução. Ganha força ao medir antes de agir e comunicar trade-offs."
        : "As escolhas priorizaram execução imediata sobre impacto e comunicação.";

  return { score, feedback: [summary, ...highlights.slice(0, 4)].join(" ") };
}
