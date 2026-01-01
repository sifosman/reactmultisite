-- Add address column to customers table for admin customer management
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address text;
