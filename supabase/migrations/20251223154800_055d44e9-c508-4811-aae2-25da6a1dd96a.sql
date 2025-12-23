-- Add icon_style column to categories table
ALTER TABLE public.categories 
ADD COLUMN icon_style text DEFAULT 'outline';

-- Update existing rows to have the default style
UPDATE public.categories SET icon_style = 'outline' WHERE icon_style IS NULL;