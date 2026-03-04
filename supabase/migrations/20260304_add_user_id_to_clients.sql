-- Add user_id column to clients table to link with Supabase Auth
ALTER TABLE public.clients ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_clients_user_id ON public.clients(user_id);

-- Drop old policy and create new ones using user_id
DROP POLICY IF EXISTS "Clients can view their own data" ON public.clients;
DROP POLICY IF EXISTS "Clients can update their own data" ON public.clients;

-- New policies using user_id
CREATE POLICY "Clients can view their own data"
  ON public.clients FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = email);

CREATE POLICY "Clients can update their own data"
  ON public.clients FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = email);
