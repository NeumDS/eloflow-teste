// Feed data types — aligned with the actual Supabase schema

export type FeedKind = 'job' | 'project' | 'challenge' | 'simulation' | 'post';
export type AuthorType = 'person' | 'company';

/** Normalised feed item returned by the API layer */
export interface FeedItem {
  id: string;
  kind: FeedKind;
  title: string;
  content?: string | null;
  created_at: string;
  author_name: string;
  author_type: AuthorType;
}

/** Labels shown in the UI for each kind */
export const KIND_LABELS: Record<FeedKind, string> = {
  job: 'Vaga',
  project: 'Projeto',
  challenge: 'Desafio',
  simulation: 'Simulação',
  post: 'Publicação',
};

/** Content-type filter options */
export const CONTENT_TYPE_FILTERS: { value: FeedKind | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'post', label: 'Publicações' },
  { value: 'job', label: 'Vagas' },
  { value: 'project', label: 'Projetos' },
  { value: 'challenge', label: 'Desafios' },
  { value: 'simulation', label: 'Simulações' },
];

/** Author-type filter options */
export const AUTHOR_TYPE_FILTERS: { value: AuthorType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'person', label: 'Pessoas' },
  { value: 'company', label: 'Empresas' },
];

export interface FetchFeedPageParams {
  limit: number;
  offset: number;
  search?: string;
  authorType?: AuthorType;
  contentType?: FeedKind;
}
