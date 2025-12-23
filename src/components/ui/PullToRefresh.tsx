import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export function PullIndicator({ pullDistance, isRefreshing, threshold = 80 }: PullIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const ready = progress >= 1;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-150"
      style={{ height: pullDistance }}
    >
      <div
        className={cn(
          "flex items-center gap-2 text-sm text-muted-foreground transition-opacity",
          pullDistance > 20 ? "opacity-100" : "opacity-0"
        )}
      >
        {isRefreshing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>刷新中...</span>
          </>
        ) : ready ? (
          <span>释放刷新</span>
        ) : (
          <span>下拉刷新</span>
        )}
      </div>
    </div>
  );
}

interface LoadMoreIndicatorProps {
  isLoading: boolean;
  hasMore: boolean;
}

export function LoadMoreIndicator({ isLoading, hasMore }: LoadMoreIndicatorProps) {
  if (!hasMore && !isLoading) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        没有更多了
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>加载中...</span>
      </div>
    );
  }

  return <div className="h-4" />;
}
