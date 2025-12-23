import { Note } from '@/types';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onClick: (note: Note) => void;
}

export function NoteCard({ note, onDelete, onClick }: NoteCardProps) {
  return (
    <div 
      className="glass-card p-4 animate-fade-in cursor-pointer group"
      onClick={() => onClick(note)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {note.title || '无标题'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {note.content || '暂无内容'}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            {format(new Date(note.updatedAt), 'MM月dd日 HH:mm', { locale: zhCN })}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
