-- Create communications table for important messages
CREATE TABLE public.communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read active communications
CREATE POLICY "Users can view active communications" 
ON public.communications 
FOR SELECT 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Create policy for admins to manage communications (for future admin panel)
CREATE POLICY "Service role can manage communications" 
ON public.communications 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create index for better performance
CREATE INDEX idx_communications_active ON public.communications(is_active, priority, created_at) WHERE is_active = true;
CREATE INDEX idx_communications_expires ON public.communications(expires_at) WHERE expires_at IS NOT NULL;