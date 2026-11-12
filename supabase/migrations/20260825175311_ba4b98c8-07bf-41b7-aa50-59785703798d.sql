
create table public.companies (id uuid primary key default gen_random_uuid(), email text unique not null, name text not null, industry text, size text, about text, created_at timestamptz not null default now());
create table public.candidates (id uuid primary key default gen_random_uuid(), email text unique not null, full_name text not null, headline text, location text, seniority text, bio text, profile_completion int not null default 40, github_username text, resume_url text, resume_name text, portfolio_url text, education text, skills text[] not null default '{}', created_at timestamptz not null default now());
create table public.specialists (id uuid primary key default gen_random_uuid(), email text unique not null, full_name text not null, focus text, created_at timestamptz not null default now());
create table public.jobs (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, title text not null, area text, modality text, location text, salary_range text, urgency text, seniority text, status text not null default 'draft', diagnosis jsonb, dna jsonb, created_at timestamptz not null default now());
create table public.projects (id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.candidates(id) on delete cascade, name text not null, description text, problem text, solution text, technologies text[] not null default '{}', github_url text, link text, result text, created_at timestamptz not null default now());
create table public.github_profiles (id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.candidates(id) on delete cascade, username text not null, repos int default 0, stars int default 0, languages jsonb, is_mock boolean not null default true, connected_at timestamptz not null default now());
create table public.portfolios (id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.candidates(id) on delete cascade, title text not null, url text, kind text, created_at timestamptz not null default now());
create table public.assessments (id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.candidates(id) on delete cascade, name text not null, score int, created_at timestamptz not null default now());
create table public.applications (id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id) on delete cascade, candidate_id uuid not null references public.candidates(id) on delete cascade, status text not null default 'enviada', match_score int not null default 80, reasons text[] not null default '{}', stage text not null default 'avaliacao', created_at timestamptz not null default now(), unique (job_id, candidate_id));
create table public.simulations (id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id) on delete cascade, title text not null, intro text, questions jsonb not null default '[]', created_at timestamptz not null default now());
create table public.simulation_attempts (id uuid primary key default gen_random_uuid(), simulation_id uuid not null references public.simulations(id) on delete cascade, candidate_id uuid not null references public.candidates(id) on delete cascade, answers jsonb not null default '[]', score int, feedback text, completed_at timestamptz not null default now());
create table public.challenges (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, job_id uuid references public.jobs(id) on delete set null, title text not null, problem text, context text, deadline date, competencies text[] not null default '{}', created_at timestamptz not null default now());
create table public.challenge_submissions (id uuid primary key default gen_random_uuid(), challenge_id uuid not null references public.challenges(id) on delete cascade, candidate_id uuid not null references public.candidates(id) on delete cascade, answer text, link text, file_name text, score int, feedback text, created_at timestamptz not null default now());
create table public.shortlists (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, job_id uuid references public.jobs(id) on delete cascade, candidate_id uuid not null references public.candidates(id) on delete cascade, note text, created_at timestamptz not null default now(), unique (job_id, candidate_id));
create table public.plus_experiences (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, candidate_id uuid references public.candidates(id) on delete set null, job_id uuid references public.jobs(id) on delete set null, status text not null default 'solicitada', notes text, created_at timestamptz not null default now());
create table public.specialist_availability (id uuid primary key default gen_random_uuid(), specialist_id uuid not null references public.specialists(id) on delete cascade, day_of_week int not null, start_time time not null, end_time time not null, active boolean not null default true);
create table public.appointments (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, specialist_id uuid not null references public.specialists(id) on delete cascade, job_id uuid references public.jobs(id) on delete set null, date date not null, start_time time not null, end_time time not null, status text not null default 'agendada', meeting_url text, notes text, created_at timestamptz not null default now(), unique (specialist_id, date, start_time));
create table public.calls (id uuid primary key default gen_random_uuid(), appointment_id uuid references public.appointments(id) on delete cascade, job_id uuid references public.jobs(id) on delete set null, transcript text, status text not null default 'pendente', diagnosis jsonb, created_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), recipient_email text not null, title text not null, body text, read boolean not null default false, created_at timestamptz not null default now());
create table public.consent_records (id uuid primary key default gen_random_uuid(), email text not null, kind text not null, accepted_at timestamptz not null default now());

do $$
declare t text;
begin
  foreach t in array array['companies','candidates','specialists','jobs','projects','github_profiles','portfolios','assessments','applications','simulations','simulation_attempts','challenges','challenge_submissions','shortlists','plus_experiences','specialist_availability','appointments','calls','notifications','consent_records']
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "demo_read_%1$s" on public.%1$I for select to authenticated using (true)', t);
    execute format('create policy "demo_write_%1$s" on public.%1$I for insert to authenticated with check (true)', t);
    execute format('create policy "demo_update_%1$s" on public.%1$I for update to authenticated using (true)', t);
    execute format('create policy "demo_delete_%1$s" on public.%1$I for delete to authenticated using (true)', t);
  end loop;
end $$;

insert into public.companies (id, email, name, industry, size, about) values
('c0000000-0000-4000-8000-000000000001','empresa@eloflow.demo','Nortis Tecnologia','SaaS B2B','80-200','Plataforma de gestão financeira para indústrias.'),
('c0000000-0000-4000-8000-000000000002','pessoas@vivara.demo','Vivara Health','Healthtech','20-80','Cuidado digital contínuo para pacientes crônicos.'),
('c0000000-0000-4000-8000-000000000003','talentos@orbita.demo','Órbita Logística','Logtech','200-500','Inteligência de rotas para operações de última milha.');

insert into public.specialists (id, email, full_name, focus) values
('50000000-0000-4000-8000-000000000001','especialista@eloflow.demo','Marina Duarte','Diagnóstico de vagas de tecnologia'),
('50000000-0000-4000-8000-000000000002','joao@eloflow.demo','João Ferraz','Produto e dados');

insert into public.candidates (id, email, full_name, headline, location, seniority, bio, profile_completion, github_username, education, skills) values
('a0000000-0000-4000-8000-000000000001','candidato@eloflow.demo','Ana Silva','Desenvolvedora Full Stack','São Paulo, SP','Pleno','Gosto de resolver problemas de produto com código simples e mensurável.',82,'anasilva','Ciência da Computação — USP','{React,TypeScript,Node.js,PostgreSQL}'),
('a0000000-0000-4000-8000-000000000002','bruno@eloflow.demo','Bruno Castro','Engenheiro de Dados','Curitiba, PR','Sênior','Pipelines confiáveis e dados que geram decisão.',74,'brunocastro','Engenharia de Software','{Python,dbt,Airflow,SQL}'),
('a0000000-0000-4000-8000-000000000003','carla@eloflow.demo','Carla Nunes','Product Designer','Remoto','Pleno','Design de produto com foco em evidência de uso.',68,'carlanunes','Design Digital','{Figma,"Design System","Pesquisa"}'),
('a0000000-0000-4000-8000-000000000004','diego@eloflow.demo','Diego Rocha','Desenvolvedor Backend','Belo Horizonte, MG','Pleno','APIs performáticas e observabilidade.',71,'diegorocha','Sistemas de Informação','{Node.js,Go,Docker,PostgreSQL}'),
('a0000000-0000-4000-8000-000000000005','elisa@eloflow.demo','Elisa Prado','Analista de Produto','Recife, PE','Júnior','Aprendo rápido e documento tudo.',59,'elisaprado','Administração','{SQL,Métricas,Discovery}'),
('a0000000-0000-4000-8000-000000000006','felipe@eloflow.demo','Felipe Antunes','Desenvolvedor Frontend','Porto Alegre, RS','Sênior','Interfaces acessíveis e rápidas.',88,'felipeantunes','Análise e Desenvolvimento de Sistemas','{React,"Next.js",Acessibilidade,CSS}'),
('a0000000-0000-4000-8000-000000000007','gabi@eloflow.demo','Gabriela Lima','Cientista de Dados','Remoto','Pleno','Modelos simples que entram em produção.',77,'gabilima','Estatística','{Python,"Machine Learning",SQL}'),
('a0000000-0000-4000-8000-000000000008','henrique@eloflow.demo','Henrique Sá','DevOps','Florianópolis, SC','Sênior','Infra previsível e barata.',81,'henriquesa','Redes de Computadores','{Kubernetes,Terraform,AWS}'),
('a0000000-0000-4000-8000-000000000009','isabel@eloflow.demo','Isabel Moura','QA Engineer','Remoto','Pleno','Qualidade como parte do fluxo, não no fim.',66,'isabelmoura','Engenharia de Computação','{Cypress,Playwright,Testes}'),
('a0000000-0000-4000-8000-000000000010','joana@eloflow.demo','Joana Reis','Analista de Suporte Técnico','Salvador, BA','Júnior','Atendimento técnico com foco em causa raiz.',54,'joanareis','Técnico em Informática','{SQL,Zendesk,Suporte}');

insert into public.jobs (id, company_id, title, area, modality, location, salary_range, urgency, seniority, status, diagnosis, dna) values
('60000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','Desenvolvedora Full Stack','Tecnologia','Híbrido','São Paulo, SP','R$ 12.000 - R$ 15.000','Alta','Pleno','validada',
 '{"responsabilidades":["Evoluir o módulo de conciliação financeira","Reduzir tempo de fechamento mensal"],"skills":["React","TypeScript","Node.js","PostgreSQL"],"senioridade":"Pleno","ferramentas":["GitHub","Linear","Datadog"],"problemas":["Fechamento manual leva 6 dias"],"criterios":["Reduzir fechamento para 2 dias"],"obrigatorios":["React","Node.js"],"desejaveis":["Experiência com fintech"]}',
 '{"fara":["Construir fluxos de conciliação","Trabalhar junto ao time financeiro"],"precisa_saber":["React","Node.js","Modelagem relacional"],"pode_aprender":["Domínio fiscal","Observabilidade"],"problemas":["Fechamento contábil manual"],"avaliacao":["Simulação de priorização","Desafio prático de conciliação"]}'),
('60000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000001','Engenheiro de Dados','Dados','Remoto','Remoto','R$ 14.000 - R$ 18.000','Média','Sênior','validada',
 '{"responsabilidades":["Construir pipelines confiáveis"],"skills":["Python","dbt","Airflow"],"senioridade":"Sênior","ferramentas":["BigQuery","dbt"],"problemas":["Dados divergentes entre áreas"],"criterios":["Fonte única de verdade"],"obrigatorios":["SQL","Python"],"desejaveis":["dbt"]}',
 '{"fara":["Modelar camada analítica"],"precisa_saber":["SQL avançado","Python"],"pode_aprender":["dbt cloud"],"problemas":["Divergência de indicadores"],"avaliacao":["Desafio de modelagem"]}'),
('60000000-0000-4000-8000-000000000003','c0000000-0000-4000-8000-000000000002','Product Designer','Design','Remoto','Remoto','R$ 10.000 - R$ 13.000','Média','Pleno','validada',
 '{"responsabilidades":["Redesenhar a jornada de adesão"],"skills":["Figma","Pesquisa","Design System"],"senioridade":"Pleno","ferramentas":["Figma","Maze"],"problemas":["Abandono no onboarding"],"criterios":["Aumentar ativação em 15%"],"obrigatorios":["Figma"],"desejaveis":["Saúde digital"]}',
 '{"fara":["Conduzir discovery com pacientes"],"precisa_saber":["Pesquisa qualitativa"],"pode_aprender":["Regulação em saúde"],"problemas":["Onboarding confuso"],"avaliacao":["Estudo de caso"]}'),
('60000000-0000-4000-8000-000000000004','c0000000-0000-4000-8000-000000000003','Desenvolvedor Backend','Tecnologia','Presencial','Campinas, SP','R$ 11.000 - R$ 14.000','Alta','Pleno','validada',
 '{"responsabilidades":["Otimizar serviço de rotas"],"skills":["Node.js","Go","PostgreSQL"],"senioridade":"Pleno","ferramentas":["Docker","Grafana"],"problemas":["Latência alta em picos"],"criterios":["p95 abaixo de 300ms"],"obrigatorios":["Node.js"],"desejaveis":["Go"]}',
 '{"fara":["Refatorar serviço crítico"],"precisa_saber":["APIs e concorrência"],"pode_aprender":["Go em produção"],"problemas":["Latência em horário de pico"],"avaliacao":["Simulação de incidente"]}'),
('60000000-0000-4000-8000-000000000005','c0000000-0000-4000-8000-000000000002','Analista de Produto','Produto','Híbrido','Recife, PE','R$ 7.000 - R$ 9.000','Baixa','Júnior','diagnostico', null, null);

insert into public.projects (candidate_id, name, description, problem, solution, technologies, github_url, link, result) values
('a0000000-0000-4000-8000-000000000001','Conciliador de pagamentos','Ferramenta que cruza extratos e faturas.','Fechamento manual demorado','Importador com regras configuráveis','{React,Node.js,PostgreSQL}','https://github.com/anasilva/conciliador','https://conciliador.demo','Fechamento caiu de 5 para 2 dias'),
('a0000000-0000-4000-8000-000000000001','Painel de indicadores','Dashboard interno de operação.','Falta de visibilidade','Painel com métricas em tempo real','{React,TypeScript}','https://github.com/anasilva/painel',null,'Redução de 30% em pedidos de relatório'),
('a0000000-0000-4000-8000-000000000001','API de notificações','Serviço central de notificações.','Mensagens duplicadas','Fila com idempotência','{Node.js,Redis}','https://github.com/anasilva/notify',null,'Duplicidade zerada'),
('a0000000-0000-4000-8000-000000000002','Pipeline de vendas','Ingestão diária multi-fonte.','Dados atrasados','Orquestração com Airflow','{Python,Airflow}','https://github.com/brunocastro/pipeline',null,'Atraso de 12h para 30min'),
('a0000000-0000-4000-8000-000000000002','Camada semântica','Modelos dbt documentados.','Métricas divergentes','Fonte única de verdade','{dbt,SQL}','https://github.com/brunocastro/dbt',null,'Indicadores unificados'),
('a0000000-0000-4000-8000-000000000003','Onboarding clínico','Redesenho de jornada.','Abandono alto','Fluxo em 3 passos','{Figma}',null,'https://carla.design/onboarding','Ativação +18%'),
('a0000000-0000-4000-8000-000000000003','Design system','Biblioteca de componentes.','Inconsistência visual','Tokens e documentação','{Figma,Storybook}',null,null,'Tempo de entrega -25%'),
('a0000000-0000-4000-8000-000000000004','Serviço de rotas','Cálculo de rotas otimizadas.','Latência em picos','Cache e filas','{Node.js,Redis}','https://github.com/diegorocha/rotas',null,'p95 de 800ms para 260ms'),
('a0000000-0000-4000-8000-000000000004','Observabilidade','Instrumentação de APIs.','Falta de rastreio','Tracing distribuído','{Go,OpenTelemetry}','https://github.com/diegorocha/otel',null,'MTTR -40%'),
('a0000000-0000-4000-8000-000000000005','Mapa de métricas','Documentação de indicadores.','Métricas sem dono','Catálogo com responsáveis','{SQL,Notion}',null,null,'Alinhamento entre times'),
('a0000000-0000-4000-8000-000000000006','Acessibilidade web','Auditoria e correções.','Barreiras de uso','Correções WCAG AA','{React,CSS}','https://github.com/felipeantunes/a11y',null,'Conformidade AA'),
('a0000000-0000-4000-8000-000000000007','Previsão de demanda','Modelo de previsão semanal.','Estoque desbalanceado','Modelo simples em produção','{Python,"Machine Learning"}','https://github.com/gabilima/forecast',null,'Ruptura -22%'),
('a0000000-0000-4000-8000-000000000008','Infra como código','Provisionamento automatizado.','Ambientes divergentes','Terraform modular','{Terraform,AWS}','https://github.com/henriquesa/infra',null,'Setup em 20 minutos'),
('a0000000-0000-4000-8000-000000000009','Suíte de testes E2E','Cobertura de fluxos críticos.','Regressões frequentes','Testes em pipeline','{Playwright}','https://github.com/isabelmoura/e2e',null,'Regressões -60%'),
('a0000000-0000-4000-8000-000000000010','Base de conhecimento','Artigos de suporte técnico.','Tickets repetidos','Base com busca','{Zendesk}',null,null,'Tickets -18%');

insert into public.github_profiles (candidate_id, username, repos, stars, languages) values
('a0000000-0000-4000-8000-000000000001','anasilva',24,131,'{"TypeScript":58,"JavaScript":24,"SQL":18}');

insert into public.portfolios (candidate_id, title, url, kind) values
('a0000000-0000-4000-8000-000000000001','Portfólio pessoal','https://anasilva.dev','site'),
('a0000000-0000-4000-8000-000000000003','Estudos de caso','https://carla.design','site');

insert into public.assessments (candidate_id, name, score) values
('a0000000-0000-4000-8000-000000000001','Raciocínio lógico',88),
('a0000000-0000-4000-8000-000000000001','Comunicação escrita',92);

insert into public.applications (job_id, candidate_id, status, match_score, reasons, stage) values
('60000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','em_avaliacao',94,'{"Projeto semelhante de conciliação","Skills compatíveis com React e Node.js","Simulação de priorização compatível"}','avaliacao'),
('60000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000001','enviada',86,'{"Experiência com Node.js","Projeto com foco em performance"}','perfil_analisado'),
('60000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000002','em_entrevista',91,'{"Pipelines em produção","Camada semântica com dbt"}','entrevista'),
('60000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000003','enviada',89,'{"Redesenho de onboarding","Pesquisa qualitativa"}','candidatura_enviada'),
('60000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000004','em_avaliacao',93,'{"Serviço de rotas semelhante","Observabilidade"}','avaliacao');

insert into public.simulations (id, job_id, title, intro, questions) values
('70000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','Priorização em produção','Esta simulação foi criada a partir das necessidades reais da vaga.',
 '[{"situation":"Um cliente encontrou um erro crítico no sistema. Você possui três tarefas pendentes. Como priorizaria?","options":["Resolver o erro crítico e comunicar o impacto das demais entregas","Finalizar as tarefas pendentes antes de olhar o erro","Delegar o erro sem contexto"]},{"situation":"O fechamento mensal apresenta divergência de R$ 4.000. O que você faz primeiro?","options":["Isolar as transações do período e comparar com o extrato","Refazer todo o cálculo manualmente","Reportar sem investigar"]},{"situation":"O time financeiro pede uma exceção que quebra a regra de conciliação. Como conduz?","options":["Entender o caso, propor regra configurável e registrar a decisão","Implementar a exceção direto no código","Negar o pedido"]}]'),
('70000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000004','Incidente de latência','Simulação baseada no problema real da operação.',
 '[{"situation":"O p95 subiu para 900ms em horário de pico. Primeiro passo?","options":["Olhar métricas e identificar o gargalo antes de mudar código","Reiniciar o serviço","Aumentar máquinas sem análise"]},{"situation":"O gargalo é uma consulta sem índice. Como age?","options":["Criar índice validando plano de execução e medir impacto","Cachear tudo","Ignorar"]}]');

insert into public.challenges (id, company_id, job_id, title, problem, context, deadline, competencies) values
('80000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','Conciliação com regras variáveis','Como você estruturaria a conciliação de pagamentos quando cada cliente tem regras diferentes?','Hoje o time financeiro faz ajustes manuais em planilhas.','2026-09-15','{"Modelagem","Comunicação","Produto"}'),
('80000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000004','Redução de latência em picos','Proponha um plano para reduzir o p95 do serviço de rotas.','Picos ocorrem entre 17h e 19h.','2026-09-20','{"Performance","Diagnóstico"}');

insert into public.shortlists (company_id, job_id, candidate_id, note) values
('c0000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','Evidências fortes de conciliação.');

insert into public.specialist_availability (specialist_id, day_of_week, start_time, end_time) values
('50000000-0000-4000-8000-000000000001',1,'09:00','12:00'),
('50000000-0000-4000-8000-000000000001',2,'14:00','18:00'),
('50000000-0000-4000-8000-000000000001',3,'09:00','12:00'),
('50000000-0000-4000-8000-000000000001',4,'14:00','17:00'),
('50000000-0000-4000-8000-000000000001',5,'09:00','11:00'),
('50000000-0000-4000-8000-000000000002',2,'09:00','12:00'),
('50000000-0000-4000-8000-000000000002',4,'09:00','12:00');
