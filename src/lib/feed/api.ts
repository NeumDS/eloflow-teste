
import { supabase } from '@/integrations/supabase/client';
import type { FeedItem, FeedKind, AuthorType, FetchFeedPageParams } from './types';

export const PAGE_SIZE = 10;

export async function fetchFeedPage({
  limit,
  offset,
  search = '',
  authorType,
  contentType,
}: FetchFeedPageParams): Promise<FeedItem[]> {
  const fetchEnd = offset + limit - 1;
  const items: FeedItem[] = [];

  const wantContent = (kind: FeedKind) =>
    !contentType || contentType === kind;

  const wantAuthor = (type: AuthorType) =>
    !authorType || authorType === type;

  const promises: Promise<void>[] = [];

  // Jobs
  if (wantContent('job') && wantAuthor('company')) {
    promises.push(
      (async () => {
        const q = supabase
          .from('jobs')
          .select('id, title, description, created_at, companies(name)')
          .order('created_at', { ascending: false })
          .range(0, fetchEnd);

        if (search) q.ilike('title', `%${search}%`);

        const { data, error } = await q;
        if (error) throw error;

        for (const row of (data ?? []) as any[]) {
          items.push({
            id: row.id,
            kind: 'job',
            title: row.title ?? '',
            content: row.description ?? null,
            created_at: row.created_at,
            author_name: row.companies?.name ?? 'Empresa',
            author_type: 'company',
          });
        }
      })()
    );
  }

  // Projects
  if (wantContent('project') && wantAuthor('person')) {
    promises.push(
      (async () => {
        const q = supabase
          .from('projects')
          .select('id, name, description, created_at, candidates(full_name)')
          .order('created_at', { ascending: false })
          .range(0, fetchEnd);

        if (search) q.ilike('name', `%${search}%`);

        const { data, error } = await q;
        if (error) throw error;

        for (const row of (data ?? []) as any[]) {
          items.push({
            id: row.id,
            kind: 'project',
            title: row.name ?? '',
            content: row.description ?? null,
            created_at: row.created_at,
            author_name: row.candidates?.full_name ?? 'Candidato',
            author_type: 'person',
          });
        }
      })()
    );
  }

  // Challenges
  if (wantContent('challenge') && wantAuthor('company')) {
    promises.push(
      (async () => {
        const q = supabase
          .from('challenges')
          .select('id, title, problem, created_at, companies(name)')
          .order('created_at', { ascending: false })
          .range(0, fetchEnd);

        if (search) q.ilike('title', `%${search}%`);

        const { data, error } = await q;
        if (error) throw error;

        for (const row of (data ?? []) as any[]) {
          items.push({
            id: row.id,
            kind: 'challenge',
            title: row.title ?? '',
            content: row.problem ?? null,
            created_at: row.created_at,
            author_name: row.companies?.name ?? 'Empresa',
            author_type: 'company',
          });
        }
      })()
    );
  }

  // Simulations
  if (wantContent('simulation') && wantAuthor('company')) {
    promises.push(
      (async () => {
        const q = supabase
          .from('simulations')
          .select('id, title, intro, created_at, jobs(companies(name))')
          .order('created_at', { ascending: false })
          .range(0, fetchEnd);

        if (search) q.ilike('title', `%${search}%`);

        const { data, error } = await q;
        if (error) throw error;

        for (const row of (data ?? []) as any[]) {
          items.push({
            id: row.id,
            kind: 'simulation',
            title: row.title ?? '',
            content: row.intro ?? null,
            created_at: row.created_at,
            author_name: row.jobs?.companies?.name ?? 'Empresa',
            author_type: 'company',
          });
        }
      })()
    );
  }

  // Posts
  if (wantContent('post')) {
    promises.push(
      (async () => {
        let q = supabase
          .from('posts')
          .select('id, author_id, author_type, content, created_at')
          .order('created_at', { ascending: false })
          .range(0, fetchEnd);

        if (search) q = q.ilike('content', `%${search}%`);
        if (authorType) q = q.eq('author_type', authorType);

        const { data, error } = await q;
        if (error) throw error;

        const posts = data ?? [];

        const personIds = posts
          .filter(post => post.author_type === 'person')
          .map(post => post.author_id);

        const companyIds = posts
          .filter(post => post.author_type === 'company')
          .map(post => post.author_id);

        let candidates: { id: string; full_name: string }[] = [];
        let companies: { id: string; name: string }[] = [];

        if (personIds.length > 0) {
          const { data, error } = await supabase
            .from('candidates')
            .select('id, full_name')
            .in('id', personIds);

          if (error) throw error;
          candidates = data ?? [];
        }

        if (companyIds.length > 0) {
          const { data, error } = await supabase
            .from('companies')
            .select('id, name')
            .in('id', companyIds);

          if (error) throw error;
          companies = data ?? [];
        }

        const candidateNames = new Map(
          candidates.map(candidate => [candidate.id, candidate.full_name])
        );

        const companyNames = new Map(
          companies.map(company => [company.id, company.name])
        );

        for (const post of posts) {
          if (
            post.author_type !== 'person' &&
            post.author_type !== 'company'
          ) {
            continue;
          }

          items.push({
            id: post.id,
            kind: 'post',
            title: 'Publicação',
            content: post.content,
            created_at: post.created_at,
            author_name:
              post.author_type === 'person'
                ? candidateNames.get(post.author_id) ?? 'Perfil indisponível'
                : companyNames.get(post.author_id) ?? 'Perfil indisponível',
            author_type: post.author_type,
          });
        }
      })()
    );
  }

  await Promise.all(promises);

  return items
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(offset, offset + limit);
}

export async function createPost({
  content,
  authorType,
  authorId,
}: {
  content: string;
  authorType: AuthorType;
  authorId: string;
}): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase.from('posts').insert({
    user_id: user.id,
    author_type: authorType,
    author_id: authorId,
    content: content.trim(),
  });

  if (error) throw error;
}
