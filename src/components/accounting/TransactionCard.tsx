import { Trash2, Edit2, Image, Check } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useTags, Tag } from '@/hooks/useTags';
import { Checkbox } from '@/components/ui/checkbox';

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

const categoryIcons: Record<string, string> = {
  food: '🍜',
  transport: '🚗',
  shopping: '🛍️',
  entertainment: '🎮',
  salary: '💰',
  investment: '📈',
  gift: '🎁',
  other: '📝',
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

  return (
    <>
      <div 
        className={cn(
          'glass-card p-4 animate-fade-in group cursor-pointer',
          transaction.type === 'expense' ? 'border-l-4 border-l-destructive/50' : 'border-l-4 border-l-accent/50',
          isSelected && 'ring-2 ring-primary bg-primary/5'
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {selectionMode ? (
              <Checkbox 
                checked={isSelected}
                onCheckedChange={() => onSelect?.(transaction.id)}
                className="shrink-0"
              />
            ) : (
              <span className="text-2xl shrink-0">
                {categoryIcons[transaction.category] || categoryIcons.other}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground truncate">
                {transaction.description || transaction.category}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(transaction.date), 'MM月dd日', { locale: zhCN })}
                </p>
                {transaction.image_url && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowImage(true);
                    }}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                  >
                    <Image className="w-3 h-3" />
                    <span>凭证</span>
                  </button>
                )}
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {tags.map(tag => (
                    <span
                      key={tag.id}
                      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <span className={cn(
              'font-bold text-lg',
              transaction.type === 'expense' ? 'text-destructive' : 'text-accent'
            )}>
              {transaction.type === 'expense' ? '-' : '+'}¥{transaction.amount.toFixed(2)}
            </span>
            {!selectionMode && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(transaction.id);
                  }}
                  className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(transaction.id);
                  }}
                  className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal with Zoom */}
      {showImage && transaction.image_url && (
        <ImageViewer 
          imageUrl={transaction.image_url} 
          onClose={() => setShowImage(false)} 
        />
      )}
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
