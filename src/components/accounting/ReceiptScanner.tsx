import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScanResult {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
}

interface ReceiptScannerProps {
  onScanComplete: (result: ScanResult) => void;
  categories: {
    expense: string[];
    income: string[];
  };
}

export function ReceiptScanner({ onScanComplete, categories }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processImage = async (file: File) => {
    setIsScanning(true);
    
    try {
      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      setPreviewUrl(base64);

      // Call edge function
      const { data, error } = await supabase.functions.invoke('analyze-receipt', {
        body: { 
          imageBase64: base64,
          categories
        }
      });

      if (error) throw error;
      
      if (data.error) {
        toast({
          title: '识别失败',
          description: data.error,
          variant: 'destructive'
        });
        return;
      }

      onScanComplete({
        amount: data.amount,
        type: data.type,
        category: data.category,
        description: data.description
      });

      toast({ title: '识别成功' });
    } catch (error) {
      console.error('Receipt scan error:', error);
      toast({
        title: '识别失败',
        description: '请确保图片清晰后重试',
        variant: 'destructive'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
    e.target.value = '';
  };

  const clearPreview = () => {
    setPreviewUrl(null);
  };

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="Receipt preview" 
            className="w-full h-32 object-cover rounded-xl"
          />
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 p-1 bg-background/80 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
          {isScanning && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-xl">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm font-medium">识别中...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isScanning}
          >
            <Camera className="w-4 h-4 mr-2" />
            拍照识别
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
          >
            <Image className="w-4 h-4 mr-2" />
            相册选择
          </Button>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
