import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ScanResult {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  imageUrl: string;
}

interface ReceiptScannerProps {
  onScanComplete: (result: ScanResult) => void;
  categories: {
    expense: string[];
    income: string[];
  };
  existingImageUrl?: string;
  onImageChange?: (url: string | null) => void;
}

export function ReceiptScanner({ onScanComplete, categories, existingImageUrl, onImageChange }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: '上传失败',
        description: '图片上传失败，请重试',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const processImage = async (file: File) => {
    setIsScanning(true);
    
    try {
      // Convert to base64 for preview and AI
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      setPreviewUrl(base64);

      // Upload image to storage
      const imageUrl = await uploadImage(file);
      if (!imageUrl) {
        setPreviewUrl(null);
        return;
      }

      onImageChange?.(imageUrl);

      // Call edge function for AI analysis
      const { data, error } = await supabase.functions.invoke('analyze-receipt', {
        body: { 
          imageBase64: base64,
          categories
        }
      });

      if (error) throw error;
      
      if (data.error) {
        toast({
          title: '识别提示',
          description: data.error,
          variant: 'destructive'
        });
        // Still complete with just the image
        onScanComplete({
          amount: 0,
          type: 'expense',
          category: categories.expense[0] || '其他',
          description: '',
          imageUrl
        });
        return;
      }

      onScanComplete({
        amount: data.amount || 0,
        type: data.type || 'expense',
        category: data.category || categories.expense[0] || '其他',
        description: data.description || '',
        imageUrl
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
    onImageChange?.(null);
  };

  const isProcessing = isScanning || isUploading;

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
            disabled={isProcessing}
          >
            <X className="w-4 h-4" />
          </button>
          {isProcessing && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-xl">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  {isUploading ? '上传中...' : '识别中...'}
                </span>
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
            disabled={isProcessing}
          >
            <Camera className="w-4 h-4 mr-2" />
            拍照识别
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
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
