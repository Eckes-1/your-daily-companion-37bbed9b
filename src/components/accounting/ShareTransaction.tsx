import { useState, useRef } from 'react';
import { Share2, Link, Image, Copy, Check, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Transaction } from '@/hooks/useTransactions';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ShareTransactionProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareTransaction({ transaction, isOpen, onClose }: ShareTransactionProps) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const shareText = `📊 ${transaction.type === 'income' ? '收入' : '支出'}记录
💰 金额: ¥${transaction.amount.toFixed(2)}
📁 分类: ${transaction.category}
📝 备注: ${transaction.description || '无'}
📅 日期: ${format(new Date(transaction.date), 'yyyy年MM月dd日', { locale: zhCN })}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({ title: '已复制到剪贴板' });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ title: '复制失败', variant: 'destructive' });
    }
  };

  const downloadAsImage = async () => {
    if (!cardRef.current) return;
    
    setGenerating(true);
    try {
      // Use html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `账单_${format(new Date(transaction.date), 'yyyyMMdd')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({ title: '图片已保存' });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({ title: '生成图片失败', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '账单分享',
          text: shareText,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast({ title: '分享失败', variant: 'destructive' });
        }
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            分享账单
          </DialogTitle>
        </DialogHeader>

        {/* 预览卡片 */}
        <div 
          ref={cardRef}
          className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/30 border border-border"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              transaction.type === 'income' 
                ? 'bg-accent/20 text-accent' 
                : 'bg-destructive/20 text-destructive'
            }`}>
              {transaction.type === 'income' ? '💰' : '💸'}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {transaction.type === 'income' ? '收入' : '支出'}
              </p>
              <p className={`text-xl font-bold ${
                transaction.type === 'income' ? 'text-accent' : 'text-destructive'
              }`}>
                ¥{transaction.amount.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">分类</span>
              <span className="font-medium">{transaction.category}</span>
            </div>
            {transaction.description && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">备注</span>
                <span className="font-medium truncate max-w-[150px]">{transaction.description}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">日期</span>
              <span className="font-medium">
                {format(new Date(transaction.date), 'yyyy/MM/dd', { locale: zhCN })}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground">来自「记账本」</p>
          </div>
        </div>

        {/* 分享按钮 */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-3"
            onClick={copyToClipboard}
          >
            {copied ? <Check className="w-5 h-5 text-accent" /> : <Copy className="w-5 h-5" />}
            <span className="text-xs">复制文字</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-3"
            onClick={downloadAsImage}
            disabled={generating}
          >
            <Download className="w-5 h-5" />
            <span className="text-xs">{generating ? '生成中...' : '保存图片'}</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-3"
            onClick={shareNative}
          >
            <Share2 className="w-5 h-5" />
            <span className="text-xs">分享</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
