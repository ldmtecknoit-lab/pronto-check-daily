-- Create checklists table
CREATE TABLE public.checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('giorno', 'notte')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'partial')) DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, shift_type)
);

-- Create checklist_items table
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  required BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  value TEXT CHECK (value IN ('si', 'no') OR value IS NULL),
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- Create policies for checklists (publicly readable for this use case)
CREATE POLICY "Anyone can view checklists" 
ON public.checklists 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage checklists" 
ON public.checklists 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Create policies for checklist_items (publicly readable for this use case)
CREATE POLICY "Anyone can view checklist items" 
ON public.checklist_items 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage checklist items" 
ON public.checklist_items 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_checklists_updated_at
  BEFORE UPDATE ON public.checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_checklists_date_shift ON public.checklists(date, shift_type);
CREATE INDEX idx_checklist_items_checklist_id ON public.checklist_items(checklist_id);
CREATE INDEX idx_checklist_items_category ON public.checklist_items(category);