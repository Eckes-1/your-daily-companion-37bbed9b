import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Wallet, BarChart3, Tag, Bell, Download, CheckCircle, Search, Filter, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const STEPS = [
  {
    icon: Wallet,
    title: '欢迎使用效率助手',
    description: '这是一款简洁高效的记账应用，帮助你轻松管理日常收支。让我们快速了解主要功能吧！',
    color: 'bg-gradient-to-br from-primary to-orange-500',
    tips: ['支持收入/支出记录', '自动统计分析', '云端数据同步'],
  },
  {
    icon: Search,
    title: '快速搜索',
    description: '在顶部搜索框中输入关键词，可以快速找到任何账单记录。支持按备注、分类、金额搜索。',
    color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    tips: ['输入备注内容搜索', '输入分类名称搜索', '输入金额数字搜索'],
  },
  {
    icon: Filter,
    title: '筛选与标签',
    description: '点击左侧的筛选按钮，可以按日期范围和标签筛选账单，帮你快速找到特定时期或类型的记录。',
    color: 'bg-gradient-to-br from-violet-500 to-purple-500',
    tips: ['按日期范围筛选', '按标签分类筛选', '多条件组合筛选'],
  },
  {
    icon: BarChart3,
    title: '统计图表',
    description: '点击"查看统计图表"按钮展开详细分析，包括分类占比饼图、趋势折线图等，直观了解消费情况。',
    color: 'bg-gradient-to-br from-blue-500 to-indigo-500',
    tips: ['分类占比分析', '收支趋势图表', '月度对比统计'],
  },
  {
    icon: Tag,
    title: '分类管理',
    description: '在工具栏菜单中点击"分类管理"，可以自定义收支分类，选择喜欢的图标、颜色和样式。',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    tips: ['自定义分类名称', '选择图标和颜色', '支持描边/填充风格'],
  },
  {
    icon: Bell,
    title: '记账提醒',
    description: '担心忘记记账？设置每日或每周提醒，养成良好的记账习惯。在工具栏菜单中找到"记账提醒"。',
    color: 'bg-gradient-to-br from-orange-500 to-amber-500',
    tips: ['每日定时提醒', '每周固定日提醒', '自定义提醒时间'],
  },
  {
    icon: Download,
    title: '导出与备份',
    description: '支持导出为 CSV、Excel 或 PDF 格式。还可以创建云端备份，数据永不丢失。',
    color: 'bg-gradient-to-br from-teal-500 to-emerald-500',
    tips: ['多格式导出', '按分类/月份导出', '云端自动备份'],
  },
  {
    icon: Zap,
    title: '批量操作',
    description: '需要处理多条记录？点击"批量操作"进入多选模式，可以一次性删除或管理多条账单。',
    color: 'bg-gradient-to-br from-yellow-500 to-orange-500',
    tips: ['多选账单记录', '批量删除操作', '全选/反选功能'],
  },
  {
    icon: Shield,
    title: '数据安全',
    description: '所有数据都安全存储在云端，支持多设备同步。你的账单信息只有你能看到。',
    color: 'bg-gradient-to-br from-slate-600 to-slate-800',
    tips: ['端到端加密', '多设备同步', '隐私保护'],
  },
  {
    icon: CheckCircle,
    title: '准备就绪！',
    description: '点击右下角的 + 按钮开始记录你的第一笔账单吧！随时可以在菜单中点击"查看引导"重新查看教程。',
    color: 'bg-gradient-to-br from-green-500 to-emerald-500',
    tips: ['点击 + 开始记账', '随时查看引导', '享受记账乐趣'],
  },
];

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection('next');
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection('prev');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      localStorage.setItem('hasCompletedOnboarding', 'true');
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const goToStep = (index: number) => {
    setDirection(index > currentStep ? 'next' : 'prev');
    setCurrentStep(index);
  };

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md transition-opacity duration-300",
        isExiting ? "opacity-0" : "opacity-100"
      )}
    >
      <div 
        className={cn(
          "relative w-full max-w-sm bg-card rounded-2xl shadow-elevated overflow-hidden transition-all duration-300",
          isExiting ? "scale-95 opacity-0" : "scale-100 opacity-100"
        )}
      >
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step counter */}
        <div className="absolute top-4 left-4 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium z-10">
          {currentStep + 1} / {STEPS.length}
        </div>

        {/* Icon section with gradient */}
        <div className={cn("pt-12 pb-8 flex justify-center", step.color)}>
          <div 
            key={currentStep}
            className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm animate-pop-in"
          >
            <Icon className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          <h2 
            key={`title-${currentStep}`}
            className="text-xl font-bold text-foreground text-center mb-3 animate-fade-in"
          >
            {step.title}
          </h2>
          <p 
            key={`desc-${currentStep}`}
            className="text-sm text-muted-foreground text-center leading-relaxed animate-fade-in"
          >
            {step.description}
          </p>

          {/* Tips */}
          <div 
            key={`tips-${currentStep}`}
            className="mt-4 space-y-2 animate-fade-in"
          >
            {step.tips.map((tip, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 text-sm text-foreground/80"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {tip}
              </div>
            ))}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1 mt-6 mb-6">
            {STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === currentStep 
                    ? "bg-primary w-6" 
                    : index < currentStep 
                      ? "bg-primary/50 w-1.5" 
                      : "bg-muted-foreground/30 w-1.5",
                  "hover:bg-primary/70"
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1 btn-press"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                上一步
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={cn("flex-1 btn-press", currentStep === 0 && "w-full")}
            >
              {currentStep === STEPS.length - 1 ? (
                '开始使用'
              ) : (
                <>
                  下一步
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
