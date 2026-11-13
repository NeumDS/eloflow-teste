
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFeed } from '@/lib/feed/useFeed';
import { createPost } from '@/lib/feed/api';
import { useAuth } from '@/hooks/useAuth';
import type { AuthorType, FeedKind } from '@/lib/feed/types';
import { FeedCard } from '@/components/eloflow/FeedCard';
import {
  AUTHOR_TYPE_FILTERS,
  CONTENT_TYPE_FILTERS,
} from '@/lib/feed/types';
import {
  PageHeader,
  Loading,
  ErrorState,
  EmptyState,
} from '@/components/eloflow/ui';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function FeedPage() {
  const [search, setSearch] = useState('');
  const [content, setContent] = useState('');
  const [authorType, setAuthorType] = useState<AuthorType | 'all'>('all');
  const [contentType, setContentType] = useState<FeedKind | 'all'>('all');

  const { identity } = useAuth();
  const queryClient = useQueryClient();

  const feed = useFeed({
    search,
    ...(authorType !== 'all' ? { authorType } : {}),
    ...(contentType !== 'all' ? { contentType } : {}),
  });

  const postMutation = useMutation({
    mutationFn: () => {
      if (!identity) throw new Error('Usuário não identificado');

      if (identity.role === 'especialista') {
        throw new Error('Especialistas não podem publicar no Feed');
      }

      return createPost({
        content,
        authorType: identity.role === 'candidato' ? 'person' : 'company',
        authorId: identity.id,
      });
    },
    onSuccess: async () => {
      setContent('');
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const items = feed.data?.pages.flat() ?? [];

  function handlePublish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!content.trim() || postMutation.isPending) return;

    postMutation.mutate();
  }

  return (
    <>
      <PageHeader
        title="Feed"
        subtitle="Acompanhe publicações, oportunidades, projetos e desafios."
      />

      <div className="space-y-4">
        {identity && identity.role !== 'especialista' && (
          <form onSubmit={handlePublish} className="space-y-3 rounded-lg border p-4">
            <h2 className="font-semibold">Criar publicação</h2>

            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="O que você gostaria de compartilhar?"
              maxLength={2000}
              rows={4}
              className="w-full resize-y rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {content.length}/2000 caracteres
              </span>

              <Button
                type="submit"
                disabled={!content.trim() || postMutation.isPending}
              >
                {postMutation.isPending ? 'Publicando...' : 'Publicar'}
              </Button>
            </div>

            {postMutation.isError && (
              <p className="text-sm text-destructive">
                Erro ao publicar: {postMutation.error.message}
              </p>
            )}
          </form>
        )}

        <Input
          placeholder="Buscar no feed..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          {AUTHOR_TYPE_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={authorType === filter.value ? 'default' : 'outline'}
              onClick={() => setAuthorType(filter.value as AuthorType | 'all')}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {CONTENT_TYPE_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={contentType === filter.value ? 'default' : 'outline'}
              onClick={() => setContentType(filter.value as FeedKind | 'all')}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {feed.isLoading && <Loading />}
      {feed.isError && <ErrorState message={feed.error.message} />}

      {!feed.isLoading && !feed.isError && items.length === 0 && (
        <EmptyState
          title="Nenhuma publicação encontrada"
          description="Ainda não há conteúdos para exibir com esses filtros."
        />
      )}

      <div className="grid gap-4">
        {items.map((item) => (
          <FeedCard key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </div>

      {feed.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => feed.fetchNextPage()}
            disabled={feed.isFetchingNextPage}
          >
            {feed.isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
          </Button>
        </div>
      )}
    </>
  );
}
