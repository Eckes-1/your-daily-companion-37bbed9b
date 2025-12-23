import { Todo } from '@/types';
import { Trash2, Circle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: 'border-l-muted-foreground',
  medium: 'border-l-primary',
  high: 'border-l-destructive',
};

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div 
      className={cn(
        'glass-card p-4 animate-fade-in group border-l-4',
        priorityColors[todo.priority],
        todo.completed && 'opacity-60'
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => onToggle(todo.id)}
          className="flex-shrink-0 text-primary transition-transform hover:scale-110"
        >
          {todo.completed ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>
        
        <p className={cn(
          'flex-1 text-foreground transition-all',
          todo.completed && 'line-through text-muted-foreground'
        )}>
          {todo.title}
        </p>

        <button
          onClick={() => onDelete(todo.id)}
          className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
