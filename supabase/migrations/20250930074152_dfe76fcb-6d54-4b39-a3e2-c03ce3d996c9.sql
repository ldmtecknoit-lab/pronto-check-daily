-- Drop existing restrictive policies for checklists
DROP POLICY IF EXISTS "Service role can manage checklists" ON public.checklists;

-- Create policies to allow everyone to manage checklists
CREATE POLICY "Anyone can insert checklists" 
ON public.checklists 
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can update checklists" 
ON public.checklists 
FOR UPDATE 
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete checklists" 
ON public.checklists 
FOR DELETE 
TO public
USING (true);

-- Drop existing restrictive policies for checklist_items
DROP POLICY IF EXISTS "Service role can manage checklist items" ON public.checklist_items;

-- Create policies to allow everyone to manage checklist items
CREATE POLICY "Anyone can insert checklist items" 
ON public.checklist_items 
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can update checklist items" 
ON public.checklist_items 
FOR UPDATE 
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete checklist items" 
ON public.checklist_items 
FOR DELETE 
TO public
USING (true);