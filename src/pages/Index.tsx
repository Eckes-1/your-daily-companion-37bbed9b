import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { TabType } from '@/types';
import { BottomNav } from '@/components/BottomNav';
import { Header } from '@/components/Header';
import { NotesTab } from '@/components/notes/NotesTab';
import { AccountingTab } from '@/components/accounting/AccountingTab';
import { StickyTab } from '@/components/sticky/StickyTab';
import { TodoTab } from '@/components/todo/TodoTab';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'notes':
        return <NotesTab />;
      case 'accounting':
        return <AccountingTab />;
      case 'sticky':
        return <StickyTab />;
      case 'todo':
        return <TodoTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} />
      <main className="pt-2">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
