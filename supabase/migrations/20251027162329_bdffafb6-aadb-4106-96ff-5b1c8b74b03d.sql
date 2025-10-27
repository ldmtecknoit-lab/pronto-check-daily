-- Add signature column to checklist_items table
ALTER TABLE public.checklist_items 
ADD COLUMN signature TEXT;

COMMENT ON COLUMN public.checklist_items.signature IS 'Base64 encoded signature data for shift personnel';