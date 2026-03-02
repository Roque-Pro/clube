-- Create clients table for subscription/membership
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  cpf TEXT,
  vehicle TEXT NOT NULL,
  plate TEXT,
  plan_start DATE NOT NULL DEFAULT CURRENT_DATE,
  plan_end DATE NOT NULL,
  replacements_used INTEGER DEFAULT 0,
  max_replacements INTEGER DEFAULT 3,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view all clients"
  ON public.clients FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Clients can view their own data"
  ON public.clients FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Clients can update their own data"
  ON public.clients FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Anyone can insert a new client"
  ON public.clients FOR INSERT
  WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
