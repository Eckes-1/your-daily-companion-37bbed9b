import { Sticky } from '@/types';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StickyNoteProps {
  sticky: Sticky;
  onDelete: (id: string) => void;
}

const colorClasses = {
  yellow: 'bg-sticky-yellow',
  pink: 'bg-sticky-pink',
  blue: 'bg-sticky-blue',
  green: 'bg-sticky-green',
};

export function StickyNoteCard({ sticky, onDelete }: StickyNoteProps) {
  return (
    <div 
      className={cn(
        'sticky-note animate-scale-in group relative',
        colorClasses[sticky.color]
      )}
      style={{ 
        transform: `rotate(${Math.random() * 4 - 2}deg)`,
      }}
    >
      <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap break-words">
        {sticky.content}
      </p>
      <button
        onClick={() => onDelete(sticky.id)}
        className="absolute top-2 right-2 p-1.5 rounded-full text-foreground/50 hover:text-destructive hover:bg-background/30 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
