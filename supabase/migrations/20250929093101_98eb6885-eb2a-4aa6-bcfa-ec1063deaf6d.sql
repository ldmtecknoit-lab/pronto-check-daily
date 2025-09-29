-- Create operators table
CREATE TABLE public.operators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('autista', 'soccorritore', 'medico')),
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shifts table
CREATE TABLE public.shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('giorno', 'notte')),
  autista_id UUID NOT NULL REFERENCES public.operators(id),
  soccorritore_id UUID NOT NULL REFERENCES public.operators(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, shift_type)
);

-- Enable Row Level Security
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Create policies for operators (publicly readable for this use case)
CREATE POLICY "Anyone can view active operators" 
ON public.operators 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Service role can manage operators" 
ON public.operators 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Create policies for shifts (publicly readable for this use case)
CREATE POLICY "Anyone can view shifts" 
ON public.shifts 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage shifts" 
ON public.shifts 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON public.operators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample operators data
INSERT INTO public.operators (name, role, phone, email) VALUES
  -- Autisti
  ('Marco Rossi', 'autista', '+39 335 1234567', 'marco.rossi@118.it'),
  ('Luca Bianchi', 'autista', '+39 335 2345678', 'luca.bianchi@118.it'),
  ('Andrea Verdi', 'autista', '+39 335 3456789', 'andrea.verdi@118.it'),
  ('Giulio Neri', 'autista', '+39 335 4567890', 'giulio.neri@118.it'),
  ('Paolo Ferrari', 'autista', '+39 335 5678901', 'paolo.ferrari@118.it'),
  ('Antonio Romano', 'autista', '+39 335 6789012', 'antonio.romano@118.it'),
  ('Roberto Marino', 'autista', '+39 335 7890123', 'roberto.marino@118.it'),
  
  -- Soccorritori
  ('Elena Conti', 'soccorritore', '+39 335 8901234', 'elena.conti@118.it'),
  ('Sara Ricci', 'soccorritore', '+39 335 9012345', 'sara.ricci@118.it'),
  ('Francesca Bruno', 'soccorritore', '+39 336 0123456', 'francesca.bruno@118.it'),
  ('Chiara Gallo', 'soccorritore', '+39 336 1234567', 'chiara.gallo@118.it'),
  ('Matteo Costa', 'soccorritore', '+39 336 2345678', 'matteo.costa@118.it'),
  ('Giovanni Giordano', 'soccorritore', '+39 336 3456789', 'giovanni.giordano@118.it'),
  ('Simone Mancini', 'soccorritore', '+39 336 4567890', 'simone.mancini@118.it');

-- Insert sample shifts for current week
WITH operator_ids AS (
  SELECT 
    id, 
    name, 
    role,
    ROW_NUMBER() OVER (PARTITION BY role ORDER BY name) as rn
  FROM public.operators 
  WHERE is_active = true
),
week_dates AS (
  SELECT 
    date_trunc('week', CURRENT_DATE) + (interval '1 day' * generate_series(0, 6)) as shift_date
)
INSERT INTO public.shifts (date, shift_type, autista_id, soccorritore_id)
SELECT 
  wd.shift_date::date,
  st.shift_type,
  a.id as autista_id,
  s.id as soccorritore_id
FROM week_dates wd
CROSS JOIN (VALUES ('giorno'), ('notte')) AS st(shift_type)
LEFT JOIN operator_ids a ON a.role = 'autista' 
  AND a.rn = ((EXTRACT(DOW FROM wd.shift_date)::int + CASE WHEN st.shift_type = 'notte' THEN 1 ELSE 0 END) % 7) + 1
LEFT JOIN operator_ids s ON s.role = 'soccorritore' 
  AND s.rn = ((EXTRACT(DOW FROM wd.shift_date)::int + CASE WHEN st.shift_type = 'notte' THEN 2 ELSE 0 END) % 7) + 1
WHERE a.id IS NOT NULL AND s.id IS NOT NULL;