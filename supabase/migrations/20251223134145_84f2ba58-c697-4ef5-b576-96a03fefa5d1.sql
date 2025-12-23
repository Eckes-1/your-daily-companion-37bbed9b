-- 创建备份表
CREATE TABLE public.backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Users can view their own backups"
ON public.backups FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backups"
ON public.backups FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backups"
ON public.backups FOR DELETE
USING (auth.uid() = user_id);