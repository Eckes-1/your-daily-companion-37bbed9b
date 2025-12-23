import { useState } from 'react';
import { Plus, StickyNote } from 'lucide-react';
import { Sticky } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { StickyNoteCard } from './StickyNote';
import { AddSticky } from './AddSticky';

export function StickyTab() {
  const [stickies, setStickies] = useLocalStorage<Sticky[]>('stickies', []);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (data: Omit<Sticky, 'id' | 'createdAt'>) => {
    const newSticky: Sticky = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setStickies([newSticky, ...stickies]);
  };

  const handleDelete = (id: string) => {
    setStickies(stickies.filter(s => s.id !== id));
  };

  return (
    <div className="pb-20">
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
        <div className="px-4 grid grid-cols-2 gap-3">
          {stickies.map((sticky) => (
            <StickyNoteCard 
              key={sticky.id} 
              sticky={sticky} 
              onDelete={handleDelete}
            />
          ))}
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
