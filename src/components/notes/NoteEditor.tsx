import { useState, useEffect } from 'react';
import { Note } from '@/types';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface NoteEditorProps {
  note?: Note | null;
  onSave: (note: Partial<Note>) => void;
  onClose: () => void;
}

export function NoteEditor({ note, onSave, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  const handleSave = () => {
    onSave({
      id: note?.id,
      title,
      content,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background animate-slide-up">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="font-semibold text-foreground">
            {note ? '编辑笔记' : '新建笔记'}
          </h2>
          <Button size="sm" onClick={handleSave} className="gap-1">
            <Save className="w-4 h-4" />
            保存
          </Button>
        </div>
        
        <div className="flex-1 p-4 space-y-4 overflow-auto">
          <Input
            placeholder="标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold border-0 border-b border-border rounded-none px-0 focus-visible:ring-0"
          />
          <Textarea
            placeholder="写点什么..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 min-h-[300px] border-0 resize-none focus-visible:ring-0 text-foreground"
          />
        </div>
      </div>
    </div>
  );
}
