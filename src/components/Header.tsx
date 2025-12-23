import { TabType } from '@/types';

interface HeaderProps {
  activeTab: TabType;
}

const titles: Record<TabType, string> = {
  notes: '我的笔记',
  accounting: '收支记录',
  sticky: '便签墙',
  todo: '待办事项',
};

const subtitles: Record<TabType, string> = {
  notes: '记录你的想法',
  accounting: '管理你的财务',
  sticky: '快速记录',
  todo: '规划你的一天',
};

export function Header({ activeTab }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg pt-safe-area">
      <div className="px-5 py-4">
        <h1 className="text-2xl font-bold text-foreground">
          {titles[activeTab]}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {subtitles[activeTab]}
        </p>
      </div>
    </header>
  );
}
