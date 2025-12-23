import { useState, useCallback } from 'react';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { useNotes, Note } from '@/hooks/useNotes';
import { NoteCard } from './NoteCard';
import { NoteEditor } from './NoteEditor';
import { PullIndicator, LoadMoreIndicator } from '@/components/ui/PullToRefresh';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

export function NotesTab() {
  const { notes, loading, addNote, updateNote, deleteNote, refetch } = useNotes();
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);
  const { containerRef, pullDistance, isRefreshing } = usePullToRefresh({ onRefresh: handleRefresh });
  const { displayedItems, hasMore, isLoadingMore, loadMoreRef } = useInfiniteScroll({ items: notes, pageSize: 20 });

  const handleSave = async (noteData: { id?: string; title: string; content: string }) => {
    if (noteData.id) {
      await updateNote(noteData.id, noteData.title, noteData.content);
    } else {
      await addNote(noteData.title, noteData.content);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setIsEditing(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="pb-20 h-full overflow-auto">
      <PullIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
      
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-note flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">暂无笔记</h3>
          <p className="text-sm text-muted-foreground mt-1">
            点击右下角按钮创建第一篇笔记
          </p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {displayedItems.map((note) => (
            <NoteCard 
              key={note.id} 
              note={{
                id: note.id,
                title: note.title,
                content: note.content || '',
                createdAt: new Date(note.created_at),
                updatedAt: new Date(note.updated_at),
              }} 
              onDelete={deleteNote}
              onClick={() => handleEdit(note)}
            />
          ))}
          <div ref={loadMoreRef}>
            <LoadMoreIndicator isLoading={isLoadingMore} hasMore={hasMore} />
          </div>
        </div>
      )}

      <button
        onClick={() => {
          setEditingNote(null);
          setIsEditing(true);
        }}
        className="fab"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isEditing && (
        <NoteEditor
          note={editingNote ? {
            id: editingNote.id,
            title: editingNote.title,
            content: editingNote.content || '',
            createdAt: new Date(editingNote.created_at),
            updatedAt: new Date(editingNote.updated_at),
          } : null}
          onSave={handleSave}
          onClose={() => {
            setIsEditing(false);
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
}
