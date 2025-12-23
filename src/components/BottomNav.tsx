import { FileText, Wallet, StickyNote, CheckSquare } from 'lucide-react';
import { TabType } from '@/types';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'notes' as TabType, icon: FileText, label: '笔记' },
  { id: 'accounting' as TabType, icon: Wallet, label: '记账' },
  { id: 'sticky' as TabType, icon: StickyNote, label: '便签' },
  { id: 'todo' as TabType, icon: CheckSquare, label: '待办' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'nav-item flex-1',
                isActive && 'nav-item-active'
              )}
            >
              <Icon 
                className={cn(
                  'w-6 h-6 transition-all duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )} 
              />
              <span 
                className={cn(
                  'text-xs font-medium transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
