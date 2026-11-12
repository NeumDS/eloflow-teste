# Menus mais enxutos: 5 itens por área

O objetivo é reduzir a carga de decisão do menu lateral. Nenhuma funcionalidade é removida — as páginas atuais passam a viver agrupadas, com uma barra de abas secundária no topo do grupo.

## Candidato (8 → 5)


| Menu          | Contém                                               |
| ------------- | ---------------------------------------------------- |
| Início        | dashboard atual                                      |
| Meu perfil    | Perfil · Projetos · GitHub · Currículo               |
| Oportunidades | lista de vagas + detalhe da vaga                     |
| Candidaturas  | timeline dos processos                               |
| Avaliações    | resultados das avaliações técnicas e comportamentais |


## Empresa (7 → 5)


| Menu          | Contém                                       |
| ------------- | -------------------------------------------- |
| Início        | dashboard atual                              |
| Contratações  | Contratações · Desafios · Nova contratação   |
| Candidatos    | Candidatos · Shortlist · perfil do candidato |
| Agenda        | Agenda · agendamento de call                 |
| Configurações | Dados da empresa · EloFlow Plus              |


## Especialista (8 → 5)


| Menu       | Contém                           |
| ---------- | -------------------------------- |
| Início     | dashboard atual                  |
| Agenda     | Agenda (disponibilidade) · Calls |
| Validações | Validações · Processos           |
| Vagas      | vagas em diagnóstico/validadas   |
| Pessoas    | Empresas · Candidatos            |


## Como fica na tela

- Menu lateral: 5 links por área, sem sub-itens.
- Dentro de um grupo, uma linha de abas discretas (estilo pill em bege/bordô) troca entre as páginas do grupo, mantendo a regra "uma tela = uma decisão".
- No mobile, a mesma linha de abas rola horizontalmente.

## Detalhes técnicos

- `src/components/eloflow/AppShell.tsx`: `NAV` passa a ter 5 entradas por role; cada entrada ganha uma lista de rotas do grupo usada para o estado ativo (o link do grupo fica ativo quando qualquer rota filha casa).
- Novo componente `SectionTabs` em `src/components/eloflow/ui.tsx` recebendo os itens do grupo e renderizado no topo das páginas correspondentes.
- Rotas e arquivos existentes ficam onde estão (sem renomear rotas, sem quebrar links salvos); apenas passam a renderizar `SectionTabs`.
- Páginas de detalhe (`vaga/$jobId`, `candidato/$candidateId`, `simulacao/$simulationId`, `call/$appointmentId`) não mostram abas, mas mantêm o grupo ativo no menu.
- Nenhuma mudança de banco de dados ou de lógica de negócio.  
  
  
Precisamos incluir uma /opção de aprovar candidato para a vaga pelo especialista, de enviar o candidato para a empresa com o testes e pontuações e a opção de excluir a vaga, tanto por parte do expecialista como por parte da empresa
- &nbsp;