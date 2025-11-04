-- Fix Critical Security Issue: Remove public access and require authentication
-- This fixes: MISSING_RLS, CLIENT_SIDE_AUTH, and PUBLIC_DATA_EXPOSURE

-- ============================================================================
-- CHECKLIST_ITEMS TABLE: Require authentication for all operations
-- ============================================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Anyone can insert checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Anyone can update checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Anyone can delete checklist items" ON public.checklist_items;

-- Create new authenticated-only policies
CREATE POLICY "Authenticated users can view checklist items"
ON public.checklist_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert checklist items"
ON public.checklist_items
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update checklist items"
ON public.checklist_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete checklist items"
ON public.checklist_items
FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- CHECKLISTS TABLE: Require authentication for all operations
-- ============================================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view checklists" ON public.checklists;
DROP POLICY IF EXISTS "Anyone can insert checklists" ON public.checklists;
DROP POLICY IF EXISTS "Anyone can update checklists" ON public.checklists;
DROP POLICY IF EXISTS "Anyone can delete checklists" ON public.checklists;

-- Create new authenticated-only policies
CREATE POLICY "Authenticated users can view checklists"
ON public.checklists
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert checklists"
ON public.checklists
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update checklists"
ON public.checklists
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete checklists"
ON public.checklists
FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- OPERATORS TABLE: Protect personal information (phone, email)
-- ============================================================================

-- Drop existing public access policy
DROP POLICY IF EXISTS "Anyone can view active operators" ON public.operators;

-- Create new authenticated-only policy to protect PII
CREATE POLICY "Authenticated users can view active operators"
ON public.operators
FOR SELECT
TO authenticated
USING (is_active = true);

-- ============================================================================
-- SHIFTS TABLE: Require authentication for viewing
-- ============================================================================

-- Drop existing public access policy
DROP POLICY IF EXISTS "Anyone can view shifts" ON public.shifts;

-- Create new authenticated-only policy
CREATE POLICY "Authenticated users can view shifts"
ON public.shifts
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- MONTHLY_SHIFT_IMAGES TABLE: Require authentication for viewing
-- ============================================================================

-- Drop existing public access policy
DROP POLICY IF EXISTS "Anyone can view monthly shift images" ON public.monthly_shift_images;

-- Create new authenticated-only policy
CREATE POLICY "Authenticated users can view monthly shift images"
ON public.monthly_shift_images
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- COMMUNICATIONS TABLE: Require authentication for viewing
-- ============================================================================

-- Drop existing public access policy
DROP POLICY IF EXISTS "Users can view active communications" ON public.communications;

-- Create new authenticated-only policy
CREATE POLICY "Authenticated users can view active communications"
ON public.communications
FOR SELECT
TO authenticated
USING ((is_active = true) AND ((expires_at IS NULL) OR (expires_at > now())));

-- Note: Service role policies remain unchanged as they're for administrative access