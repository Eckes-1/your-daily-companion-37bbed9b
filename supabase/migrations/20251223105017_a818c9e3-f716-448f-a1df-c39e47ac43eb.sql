-- Create categories table for custom transaction categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#6366f1',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categories
CREATE POLICY "Users can view their own categories"
ON public.categories
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
ON public.categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
ON public.categories
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
ON public.categories
FOR DELETE
USING (auth.uid() = user_id);

-- Create reminders table for notification settings
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
  time TEXT NOT NULL,
  day_of_week INTEGER,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reminders
CREATE POLICY "Users can view their own reminders"
ON public.reminders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
ON public.reminders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
ON public.reminders
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
ON public.reminders
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at on reminders
CREATE TRIGGER update_reminders_updated_at
BEFORE UPDATE ON public.reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();