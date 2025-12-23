import { Trash2, Edit2, Image, Share2, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useTags, Tag } from '@/hooks/useTags';
import { Checkbox } from '@/components/ui/checkbox';
import { ShareTransaction } from './ShareTransaction';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TransactionDisplay {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
  image_url?: string;
}

interface TransactionCardProps {
  transaction: TransactionDisplay;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

const categoryConfig: Record<string, { icon: string; bg: string; color: string }> = {
  food: { icon: '🍜', bg: 'bg-orange-100 dark:bg-orange-900/30', color: 'text-orange-600 dark:text-orange-400' },
  transport: { icon: '🚗', bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
  shopping: { icon: '🛍️', bg: 'bg-pink-100 dark:bg-pink-900/30', color: 'text-pink-600 dark:text-pink-400' },
  entertainment: { icon: '🎮', bg: 'bg-purple-100 dark:bg-purple-900/30', color: 'text-purple-600 dark:text-purple-400' },
  salary: { icon: '💰', bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  investment: { icon: '📈', bg: 'bg-teal-100 dark:bg-teal-900/30', color: 'text-teal-600 dark:text-teal-400' },
  gift: { icon: '🎁', bg: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-600 dark:text-red-400' },
  other: { icon: '📝', bg: 'bg-gray-100 dark:bg-gray-800/50', color: 'text-gray-600 dark:text-gray-400' },
};

export function TransactionCard({ 
  transaction, 
  onDelete, 
  onEdit,
  selectionMode = false,
  isSelected = false,
  onSelect
}: TransactionCardProps) {
  const [showImage, setShowImage] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const { getTransactionTags } = useTags();

  useEffect(() => {
    getTransactionTags(transaction.id).then(setTags);
  }, [transaction.id]);

  const handleCardClick = () => {
    if (selectionMode && onSelect) {
      onSelect(transaction.id);
    }
  };

  const config = categoryConfig[transaction.category] || categoryConfig.other;

  return (
    <>
      <div 
        className={cn(
          'relative rounded-2xl p-4 transition-all duration-200 cursor-pointer',
          'bg-card/80 backdrop-blur-sm border border-border/50',
          'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
          isSelected && 'ring-2 ring-primary bg-primary/5 border-primary/30'
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3">
          {/* Selection checkbox or Category icon */}
          {selectionMode ? (
            <Checkbox 
              checked={isSelected}
              onCheckedChange={() => onSelect?.(transaction.id)}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 w-5 h-5"
              aria-label={isSelected ? "取消选择该账单" : "选择该账单"}
            />
          ) : (
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0',
              'shadow-sm',
              config.bg
            )}>
              {config.icon}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate text-[15px]">
                  {transaction.description || transaction.category}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(transaction.date), 'MM月dd日', { locale: zhCN })}
                  </span>
                  {transaction.image_url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowImage(true);
                      }}
                      className={cn(
                        'flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md',
                        'bg-primary/10 text-primary hover:bg-primary/20 transition-colors'
                      )}
                    >
                      <Image className="w-3 h-3" />
                      <span>凭证</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0">
                <span className={cn(
                  'font-bold text-lg tabular-nums',
                  transaction.type === 'expense' 
                    ? 'text-destructive' 
                    : 'text-emerald-500 dark:text-emerald-400'
                )}>
                  {transaction.type === 'expense' ? '-' : '+'}¥{transaction.amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-white shadow-sm"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions dropdown */}
          {!selectionMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => setShowShare(true)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  分享
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(transaction.id)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(transaction.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Image Modal with Zoom */}
      {showImage && transaction.image_url && (
        <ImageViewer 
          imageUrl={transaction.image_url} 
          onClose={() => setShowImage(false)} 
        />
      )}

      {/* Share Dialog */}
      <ShareTransaction
        transaction={{
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date.toISOString(),
          image_url: transaction.image_url,
        }}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
      />
    </>
  );
}

// Image Viewer with zoom support
function ImageViewer({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 4));
  const handleZoomOut = () => {
    setScale(s => {
      const newScale = Math.max(s - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && scale > 1 && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex flex-col"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-background/80">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 text-foreground"
            disabled={scale <= 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <span className="text-sm text-foreground min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 text-foreground"
            disabled={scale >= 4}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 text-foreground ml-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-muted hover:bg-muted/80 text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Image Container */}
      <div 
        className="flex-1 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <img 
          src={imageUrl} 
          alt="Receipt" 
          className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
          style={{ 
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          }}
          draggable={false}
        />
      </div>

      {/* Hint */}
      <div className="p-2 text-center text-xs text-muted-foreground">
        滚轮或双指缩放 · 拖拽移动
      </div>
    </div>
  );
}
