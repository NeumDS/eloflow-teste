
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchFeedPage } from '@/lib/feed/api';
import type { AuthorType, FeedKind } from '@/lib/feed/types';

export function useFeed({
  pageSize = 10,
  search = '',
  authorType,
  contentType,
}: {
  pageSize?: number;
  search?: string;
  authorType?: AuthorType;
  contentType?: FeedKind;
} = {}) {
  return useInfiniteQuery({
    queryKey: ['feed', pageSize, search, authorType, contentType],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      return await fetchFeedPage({
  limit: pageSize,
  offset: pageParam,
  search,
  ...(authorType && { authorType }),
  ...(contentType && { contentType }),
});
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.flat().length;
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
