import { useState } from 'react';
import { X } from 'lucide-react';
import { Sticky } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface AddStickyProps {
  onAdd: (sticky: Omit<Sticky, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const colors: Sticky['color'][] = ['yellow', 'pink', 'blue', 'green'];

const colorClasses = {
  yellow: 'bg-sticky-yellow border-sticky-yellow',
  pink: 'bg-sticky-pink border-sticky-pink',
  blue: 'bg-sticky-blue border-sticky-blue',
  green: 'bg-sticky-green border-sticky-green',
};

export function AddSticky({ onAdd, onClose }: AddStickyProps) {
  const [content, setContent] = useState('');
  const [color, setColor] = useState<Sticky['color']>('yellow');

  const handleSubmit = () => {
    if (!content.trim()) return;
    onAdd({ content, color });
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
          <h2 className="font-semibold text-foreground">新建便签</h2>
          <Button size="sm" onClick={handleSubmit}>
            添加
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <Textarea
            placeholder="写点什么..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={cn(
              'min-h-[150px] border-2 resize-none transition-colors',
              colorClasses[color]
            )}
            autoFocus
          />

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">选择颜色：</span>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all',
                    colorClasses[c],
                    color === c ? 'ring-2 ring-primary ring-offset-2' : ''
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
