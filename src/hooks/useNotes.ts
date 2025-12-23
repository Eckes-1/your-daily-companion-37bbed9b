import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [user]);

  const addNote = async (title: string, content: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({ user_id: user.id, title, content })
        .select()
        .single();

      if (error) throw error;
      setNotes([data, ...notes]);
      toast({ title: '笔记已保存' });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({ title: '保存失败', variant: 'destructive' });
    }
  };

  const updateNote = async (id: string, title: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({ title, content })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setNotes(notes.map(n => n.id === id ? data : n));
      toast({ title: '笔记已更新' });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({ title: '更新失败', variant: 'destructive' });
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotes(notes.filter(n => n.id !== id));
      toast({ title: '笔记已删除' });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({ title: '删除失败', variant: 'destructive' });
    }
  };

  return { notes, loading, addNote, updateNote, deleteNote, refetch: fetchNotes };
}
