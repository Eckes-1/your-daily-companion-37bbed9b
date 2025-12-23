import { useState, useRef } from 'react';
import { Share2, Copy, Check, Download, Link, Loader2 } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';

interface ShareTransactionProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareTransaction({ transaction, isOpen, onClose }: ShareTransactionProps) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);
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

  const createShareLink = async () => {
    setCreatingLink(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-share-link', {
        body: {
          transaction: {
            type: transaction.type,
            amount: transaction.amount,
            category: transaction.category,
            description: transaction.description || '',
            date: transaction.date,
          },
        },
      });

      if (error) throw error;

      const shareUrl = `${window.location.origin}/share/${data.shareId}`;
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast({ title: '分享链接已复制', description: '有效期30天' });
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (error) {
      console.error('Error creating share link:', error);
      toast({ title: '生成链接失败', variant: 'destructive' });
    } finally {
      setCreatingLink(false);
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
          await copyToClipboard();
        }
      }
    } else {
      await copyToClipboard();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[400px] p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 className="w-4 h-4" />
            分享账单
          </DialogTitle>
        </DialogHeader>

        {/* 预览卡片 */}
        <div
          ref={cardRef}
          className="rounded-xl border border-border bg-card p-4"
          style={{ backgroundColor: '#1c1c1e' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={
                `w-10 h-10 rounded-xl flex items-center justify-center ` +
                (transaction.type === 'income'
                  ? 'bg-accent/20'
                  : 'bg-destructive/20')
              }
            >
              <span className="text-base">
                {transaction.type === 'income' ? '💰' : '💸'}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {transaction.type === 'income' ? '收入' : '支出'}
              </p>
              <p
                className={
                  `text-xl font-bold ` +
                  (transaction.type === 'income' ? 'text-accent' : 'text-destructive')
                }
              >
                ¥{transaction.amount.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-background/30 p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">分类</span>
              <span className="font-medium">{transaction.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">备注</span>
              <span className="font-medium text-right max-w-[55%] break-words">
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

          <div className="mt-3 pt-2 border-t border-border/30 text-center">
            <p className="text-[10px] text-muted-foreground">来自「记账本」</p>
          </div>
        </div>

        {/* 分享按钮 - 2行布局 */}
        <div className="space-y-2 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-2 h-10"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
              <span className="text-xs">复制文字</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-2 h-10"
              onClick={downloadAsImage}
              disabled={generating}
            >
              <Download className="w-4 h-4" />
              <span className="text-xs">{generating ? '生成中...' : '保存图片'}</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-2 h-10"
              onClick={createShareLink}
              disabled={creatingLink}
            >
              {creatingLink ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : linkCopied ? (
                <Check className="w-4 h-4 text-accent" />
              ) : (
                <Link className="w-4 h-4" />
              )}
              <span className="text-xs">{linkCopied ? '已复制链接' : '生成链接'}</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              className="flex items-center justify-center gap-2 h-10"
              onClick={shareNative}
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs">分享</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
