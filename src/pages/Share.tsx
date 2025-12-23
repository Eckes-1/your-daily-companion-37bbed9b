import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Loader2, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SharedTransaction {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

export default function SharePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [transaction, setTransaction] = useState<SharedTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSharedTransaction() {
      if (!shareId) {
        setError('无效的分享链接');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('shared_transactions')
          .select('transaction_data, expires_at')
          .eq('id', shareId)
          .single();

        if (fetchError || !data) {
          setError('分享链接不存在或已过期');
          setLoading(false);
          return;
        }

        // Check expiry
        if (new Date(data.expires_at) < new Date()) {
          setError('分享链接已过期');
          setLoading(false);
          return;
        }

        setTransaction(data.transaction_data as unknown as SharedTransaction);

        // Increment view count
        await supabase
          .from('shared_transactions')
          .update({ view_count: (data as any).view_count + 1 })
          .eq('id', shareId);
      } catch (err) {
        console.error('Error fetching shared transaction:', err);
        setError('加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    }

    fetchSharedTransaction();
  }, [shareId]);

  const downloadAsImage = async () => {
    if (!cardRef.current) return;

    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const el = cardRef.current;

      const canvas = await html2canvas(el, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        useCORS: true,
        logging: false,
        width: el.scrollWidth,
        height: el.scrollHeight,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      const link = document.createElement('a');
      link.download = `账单_${format(new Date(transaction!.date), 'yyyyMMdd')}.png`;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-xl font-semibold text-foreground mb-2">加载失败</h1>
        <p className="text-muted-foreground text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* 账单卡片 */}
      <div
        ref={cardRef}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={
              `w-12 h-12 rounded-2xl flex items-center justify-center border border-border/50 ` +
              (transaction.type === 'income'
                ? 'bg-accent/20 text-accent'
                : 'bg-destructive/20 text-destructive')
            }
          >
            <span className="text-xl">{transaction.type === 'income' ? '💰' : '💸'}</span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {transaction.type === 'income' ? '收入' : '支出'}
            </p>
            <p
              className={
                `text-3xl font-bold ` +
                (transaction.type === 'income' ? 'text-accent' : 'text-destructive')
              }
            >
              ¥{transaction.amount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">分类</span>
            <span className="font-medium">{transaction.category}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">备注</span>
            <span className="font-medium text-right max-w-[60%] break-words">
              {transaction.description || '—'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">日期</span>
            <span className="font-medium">
              {format(new Date(transaction.date), 'yyyy/MM/dd', { locale: zhCN })}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">来自「记账本」</p>
        </div>
      </div>

      {/* 保存按钮 */}
      <Button
        onClick={downloadAsImage}
        disabled={generating}
        className="mt-6 gap-2"
        size="lg"
      >
        <Download className="w-5 h-5" />
        {generating ? '生成中...' : '保存为图片'}
      </Button>

      <p className="mt-4 text-xs text-muted-foreground">长按图片可保存到相册</p>
    </div>
  );
}
