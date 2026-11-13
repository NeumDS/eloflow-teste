import { supabase } from '@/integrations/supabase/client';
import type { FeedItem, FeedKind, AuthorType, FetchFeedPageParams } from './types';

export const PAGE_SIZE = 10;

/* ------------------------------------------------------------------ */
/*  Feed page query                                                    */
/* ------------------------------------------------------------------ */

export async function fetchFeedPage({
  limit,
  offset,
  search = '',
  authorType,
  contentType,
}: FetchFeedPageParams): Promise<FeedItem[]> {
  const fetchEnd = offset + limit - 1;
  const items: FeedItem[] = [];

  const wantContent = (kind: FeedKind) => !contentType || contentType === kind;
  const wantAuthor = (type: AuthorType) => !authorType || authorType === type;

  const promises: Promise<void>[] = [];

  /* --- Jobs (company-authored) ------------------------------------ */
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
      })(),
    );
  }

  /* --- Projects (person-authored / candidate) --------------------- */
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
      })(),
    );
  }

  /* --- Challenges (company-authored) ------------------------------ */
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
      })(),
    );
  }

  /* --- Simulations (company-authored via job) ---------------------- */
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
      })(),
    );
  }

  /* --- Posts (user publications — table may not exist yet) --------- */
  if (wantContent('post')) {
    promises.push(
      (async () => {
        try {
          const q = (supabase as any)
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .range(0, fetchEnd);
          if (search) q.ilike('content', `%${search}%`);
          if (authorType) q.eq('author_type', authorType);
          const { data, error } = await q;
          if (error) {
            // Table may not exist yet — silently skip
            console.warn('posts table not available:', error.message);
            return;
          }
          for (const row of (data ?? []) as any[]) {
            items.push({
              id: row.id,
              kind: 'post',
              title: 'Publicação',
              content: row.content,
              created_at: row.created_at,
              author_name: row.author_name ?? 'Usuário',
              author_type: row.author_type ?? 'person',
            });
          }
        } catch {
          // gracefully skip
        }
      })(),
    );
  }

  await Promise.all(promises);

  return items
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(offset, offset + limit);
}

/* ------------------------------------------------------------------ */
/*  Create a post                                                      */
/* ------------------------------------------------------------------ */

export async function createPost({
  content,
  authorType,
  authorName,
}: {
  content: string;
  authorType: AuthorType;
  authorName: string;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await (supabase as any).from('posts').insert({
    user_id: user.id,
    author_type: authorType,
    author_name: authorName,
    content,
  });

  if (error) throw error;
}
