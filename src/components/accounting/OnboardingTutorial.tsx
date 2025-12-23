import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Wallet, BarChart3, Tag, Bell, Download, CheckCircle } from 'lucide-react';
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
    color: 'bg-primary',
  },
  {
    icon: BarChart3,
    title: '统计图表',
    description: '点击"查看统计图表"按钮可以展开详细的收支分析图表，包括分类占比、趋势分析等，帮你直观了解消费情况。',
    color: 'bg-blue-500',
  },
  {
    icon: Tag,
    title: '分类管理',
    description: '你可以自定义收支分类，选择喜欢的图标和颜色。在工具栏菜单中点击"分类管理"即可设置。',
    color: 'bg-purple-500',
  },
  {
    icon: Bell,
    title: '记账提醒',
    description: '担心忘记记账？设置每日或每周提醒，养成良好的记账习惯。在工具栏菜单中找到"记账提醒"。',
    color: 'bg-orange-500',
  },
  {
    icon: Download,
    title: '数据导出与备份',
    description: '支持导出为 CSV、Excel 或 PDF 格式，还可以创建云端备份。所有数据都安全存储在云端。',
    color: 'bg-teal-500',
  },
  {
    icon: CheckCircle,
    title: '准备就绪！',
    description: '点击右下角的 + 按钮开始记录你的第一笔账单吧！如果有任何问题，随时可以在设置中查看帮助。',
    color: 'bg-green-500',
  },
];

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
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

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md transition-opacity duration-300",
        isExiting ? "opacity-0" : "opacity-100 animate-fade-in"
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
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon section */}
        <div className={cn("pt-10 pb-6 flex justify-center", step.color)}>
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Icon className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          <h2 className="text-xl font-bold text-foreground text-center mb-3">
            {step.title}
          </h2>
          <p className="text-sm text-muted-foreground text-center leading-relaxed min-h-[60px]">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mt-6 mb-6">
            {STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentStep 
                    ? "bg-primary w-6" 
                    : index < currentStep 
                      ? "bg-primary/50" 
                      : "bg-muted-foreground/30"
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
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                上一步
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={cn("flex-1", currentStep === 0 && "w-full")}
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
