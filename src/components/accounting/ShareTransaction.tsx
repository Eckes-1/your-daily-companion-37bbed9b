import { useState, useRef } from 'react';
import { Share2, Copy, Check, Download } from 'lucide-react';
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
      const html2canvas = (await import('html2canvas')).default;
      const el = cardRef.current;

      const canvas = await html2canvas(el, {
        backgroundColor: '#1c1c1e',
        scale: 2,
        useCORS: true,
        logging: false,
        width: el.scrollWidth,
        height: el.scrollHeight,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
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
    // 优先使用原生分享API（支持分享到微信、QQ等平台）
    if (navigator.share) {
      try {
        await navigator.share({
          title: '账单分享',
          text: shareText,
        });
        return;
      } catch (error) {
        // 用户取消分享不做处理
        if ((error as Error).name === 'AbortError') {
          return;
        }
        // 其他错误降级到复制
      }
    }
    // 不支持原生分享时，提示用户
    toast({ 
      title: '当前浏览器不支持直接分享',
      description: '请使用"复制文字"后手动粘贴分享',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[340px] p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 className="w-4 h-4" />
            分享账单
          </DialogTitle>
        </DialogHeader>

        {/* 预览卡片 - 居中且更紧凑 */}
        <div className="flex justify-center py-2">
          <div
            ref={cardRef}
            className="w-[280px] rounded-xl border border-border bg-card p-3"
            style={{ backgroundColor: '#1c1c1e' }}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className={
                  `w-9 h-9 rounded-lg flex items-center justify-center ` +
                  (transaction.type === 'income'
                    ? 'bg-accent/20'
                    : 'bg-destructive/20')
                }
              >
                <span className="text-sm">
                  {transaction.type === 'income' ? '💰' : '💸'}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground leading-none mb-0.5">
                  {transaction.type === 'income' ? '收入' : '支出'}
                </p>
                <p
                  className={
                    `text-lg font-bold leading-tight ` +
                    (transaction.type === 'income' ? 'text-accent' : 'text-destructive')
                  }
                >
                  ¥{transaction.amount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-background/30 p-2.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">分类</span>
                <span className="font-medium">{transaction.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">备注</span>
                <span className="font-medium text-right max-w-[50%] truncate">
                  {transaction.description || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">日期</span>
                <span className="font-medium">
                  {format(new Date(transaction.date), 'yyyy/MM/dd', { locale: zhCN })}
                </span>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-border/30 text-center">
              <p className="text-[9px] text-muted-foreground">来自「记账本」</p>
            </div>
          </div>
        </div>

        {/* 分享按钮 - 3列布局 */}
        <div className="grid grid-cols-3 gap-2 mt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2.5"
            onClick={copyToClipboard}
          >
            {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            <span className="text-[10px]">复制文字</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2.5"
            onClick={downloadAsImage}
            disabled={generating}
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px]">{generating ? '生成中...' : '保存图片'}</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2.5"
            onClick={shareNative}
          >
            <Share2 className="w-4 h-4" />
            <span className="text-[10px]">分享</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
