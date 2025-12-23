import { LogOut } from 'lucide-react';
import { TabType } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: '退出失败',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: '已退出登录',
      });
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg pt-safe-area">
      <div className="px-5 py-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {titles[activeTab]}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {subtitles[activeTab]}
          </p>
        </div>
        {user && (
          <button
            onClick={handleSignOut}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="退出登录"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
}
