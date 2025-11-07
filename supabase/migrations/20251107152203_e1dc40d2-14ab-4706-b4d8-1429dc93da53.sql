-- Create app_versions table to store APK download URLs and version info
CREATE TABLE public.app_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version text NOT NULL,
  apk_url text NOT NULL,
  release_notes text,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view versions
CREATE POLICY "Authenticated users can view app versions"
ON public.app_versions
FOR SELECT
TO authenticated
USING (true);

-- Create policy for service role to manage versions
CREATE POLICY "Service role can manage app versions"
ON public.app_versions
FOR ALL
TO service_role
USING (auth.role() = 'service_role');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_app_versions_updated_at
BEFORE UPDATE ON public.app_versions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial version
INSERT INTO public.app_versions (version, apk_url, release_notes, is_current)
VALUES ('1.0.0', 'https://your-domain.com/app-latest.apk', 'Versione iniziale', true);