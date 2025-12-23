import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  items: T[];
  pageSize?: number;
}

export function useInfiniteScroll<T>({
  items,
  pageSize = 20,
}: UseInfiniteScrollOptions<T>) {
  const [displayCount, setDisplayCount] = useState(pageSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const displayedItems = items.slice(0, displayCount);
  const hasMore = displayCount < items.length;

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    // 模拟加载延迟
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + pageSize, items.length));
      setIsLoadingMore(false);
    }, 200);
  }, [isLoadingMore, hasMore, pageSize, items.length]);

  // 当数据源变化时重置
  useEffect(() => {
    setDisplayCount(pageSize);
  }, [items.length, pageSize]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observerRef.current.observe(node);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, loadMore]);

  return {
    displayedItems,
    hasMore,
    isLoadingMore,
    loadMoreRef,
    reset: () => setDisplayCount(pageSize),
  };
}
