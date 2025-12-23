import { useState } from 'react';
import { X, Flag } from 'lucide-react';
import { Todo } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AddTodoProps {
  onAdd: (todo: Omit<Todo, 'id' | 'completed' | 'createdAt'>) => void;
  onClose: () => void;
}

const priorities: { id: Todo['priority']; label: string; color: string }[] = [
  { id: 'low', label: '低', color: 'bg-muted text-muted-foreground' },
  { id: 'medium', label: '中', color: 'bg-primary/20 text-primary' },
  { id: 'high', label: '高', color: 'bg-destructive/20 text-destructive' },
];

export function AddTodo({ onAdd, onClose }: AddTodoProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Todo['priority']>('medium');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({ title, priority });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-elevated animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="font-semibold text-foreground">新建待办</h2>
          <Button size="sm" onClick={handleSubmit}>
            添加
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <Input
            placeholder="要做什么？"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg"
            autoFocus
          />

          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">优先级：</span>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                    p.color,
                    priority === p.id && 'ring-2 ring-offset-2 ring-primary'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
