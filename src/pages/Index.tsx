import { useState } from 'react';
import { TabType } from '@/types';
import { BottomNav } from '@/components/BottomNav';
import { Header } from '@/components/Header';
import { NotesTab } from '@/components/notes/NotesTab';
import { AccountingTab } from '@/components/accounting/AccountingTab';
import { StickyTab } from '@/components/sticky/StickyTab';
import { TodoTab } from '@/components/todo/TodoTab';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('notes');

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
