import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchFeedPage } from '@/lib/feed/api';

export function useFeed({
  pageSize = 10,
  search = '',
  authorType,
  category,
}: {
  pageSize?: number;
  search?: string;
  authorType?: "person" | "company";
  category?: string;
} = {}) {
  return useInfiniteQuery({
    queryKey: ['feed', pageSize, search, authorType, category],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      return await fetchFeedPage({
        limit: pageSize,
        offset: pageParam,
        search,
        authorType,
        category,
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
