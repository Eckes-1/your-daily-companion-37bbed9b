import { useState, useCallback } from 'react';
import { Plus, StickyNote, Loader2 } from 'lucide-react';
import { useStickies, Sticky } from '@/hooks/useStickies';
import { StickyNoteCard } from './StickyNote';
import { AddSticky } from './AddSticky';
import { PullIndicator, LoadMoreIndicator } from '@/components/ui/PullToRefresh';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

export function StickyTab() {
  const { stickies, loading, addSticky, deleteSticky, refetch } = useStickies();
  const [isAdding, setIsAdding] = useState(false);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);
  const { containerRef, pullDistance, isRefreshing } = usePullToRefresh({ onRefresh: handleRefresh });
  const { displayedItems, hasMore, isLoadingMore, loadMoreRef } = useInfiniteScroll({ items: stickies, pageSize: 20 });

  const handleAdd = async (data: { content: string; color: Sticky['color'] }) => {
    await addSticky(data.content, data.color);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="pb-20 h-full overflow-auto">
      <PullIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
      
      {stickies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-sticky-yellow flex items-center justify-center mb-4">
            <StickyNote className="w-8 h-8 text-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">便签墙空空如也</h3>
          <p className="text-sm text-muted-foreground mt-1">
            添加一些便签来快速记录想法
          </p>
        </div>
      ) : (
        <div className="px-4">
          <div className="grid grid-cols-2 gap-3">
            {displayedItems.map((sticky) => (
              <StickyNoteCard 
                key={sticky.id} 
                sticky={{
                  id: sticky.id,
                  content: sticky.content,
                  color: sticky.color,
                  createdAt: new Date(sticky.created_at),
                }} 
                onDelete={deleteSticky}
              />
            ))}
          </div>
          <div ref={loadMoreRef}>
            <LoadMoreIndicator isLoading={isLoadingMore} hasMore={hasMore} />
          </div>
        </div>
      )}

      <button
        onClick={() => setIsAdding(true)}
        className="fab"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isAdding && (
        <AddSticky
          onAdd={handleAdd}
          onClose={() => setIsAdding(false)}
        />
      )}
    </div>
  );
}
