-- Create table for monthly shift schedule images
CREATE TABLE public.monthly_shift_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(month, year)
);

-- Enable RLS
ALTER TABLE public.monthly_shift_images ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view the images
CREATE POLICY "Anyone can view monthly shift images"
ON public.monthly_shift_images
FOR SELECT
USING (true);

-- Only service role can manage the images
CREATE POLICY "Service role can manage monthly shift images"
ON public.monthly_shift_images
FOR ALL
USING (auth.role() = 'service_role');

-- Add trigger for updated_at
CREATE TRIGGER update_monthly_shift_images_updated_at
BEFORE UPDATE ON public.monthly_shift_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();