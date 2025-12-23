-- Add icon_url column to categories table for storing generated icon images
ALTER TABLE public.categories 
ADD COLUMN icon_url TEXT DEFAULT NULL;