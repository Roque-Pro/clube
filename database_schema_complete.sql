-- ============================================
-- CLUBE DO VIDRO - SCHEMA COMPLETO
-- Database Schema - Production Ready
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ENUMS
-- ============================================

CREATE TYPE app_role AS ENUM ('admin', 'user');

-- ============================================
-- 2. CORE TABLES
-- ============================================

-- Profiles (Usuarios/Colaboradores)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, blocked
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL
);

-- Clients (Clientes - Plano/Subscribers)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  cpf TEXT UNIQUE,
  vehicle TEXT NOT NULL,
  plate TEXT UNIQUE,
  plan_start DATE NOT NULL DEFAULT CURRENT_DATE,
  plan_end DATE NOT NULL,
  replacements_used INTEGER DEFAULT 0,
  max_replacements INTEGER DEFAULT 3,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Employees (Funcionarios/Colaboradores)
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'Instalador Senior', 'Instalador', 'Atendente', 'Gerente', 'Auxiliar'
  phone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  salary DECIMAL(10, 2) DEFAULT 1600.00,
  hire_date DATE NOT NULL,
  active BOOLEAN DEFAULT true,
  sales_count INTEGER DEFAULT 0,
  attendance_count INTEGER DEFAULT 0,
  installations_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Replacements (Trocas de Vidro)
CREATE TABLE public.replacements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  item TEXT NOT NULL, -- Para-brisa, Retrovisor esquerdo, etc
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Products (Estoque)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- Para-brisa, Retrovisor, Vigia, Farol, Vidro lateral, Insumo, Ferramenta, Outro
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL,
  supplier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Services (Serviços Realizados)
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  plate TEXT NOT NULL,
  service_type TEXT NOT NULL, -- Tipo de serviço (Instalação, Polimento, etc)
  description TEXT, -- O que foi feito
  value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  installations INTEGER DEFAULT 0, -- Quantidade de instalações feitas
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replacements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user status
CREATE OR REPLACE FUNCTION public.get_user_status(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status FROM public.profiles WHERE user_id = _user_id
$$;

-- Update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create employee auth user (para admin cadastrar funcionário com senha)
CREATE OR REPLACE FUNCTION public.create_employee_auth(email TEXT, password TEXT, full_name TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Criar usuário no auth
  new_user_id := auth.uid(); -- placeholder, será substituído pelo usuario real
  
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    email,
    crypt(password, gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object('full_name', full_name)
  )
  RETURNING id INTO new_user_id;

  -- Criar profile com status approved
  INSERT INTO public.profiles (user_id, full_name, role, status)
  VALUES (new_user_id, full_name, 'user', 'approved')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN json_build_object('success', true, 'user_id', new_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update employee password (para admin resetar senha)
CREATE OR REPLACE FUNCTION public.update_employee_password(p_email TEXT, p_password TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now()
  WHERE email = p_email;

  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update clients updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update employees updated_at
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update replacements updated_at
DROP TRIGGER IF EXISTS update_replacements_updated_at ON public.replacements;
CREATE TRIGGER update_replacements_updated_at
  BEFORE UPDATE ON public.replacements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update products updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update services updated_at
DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 6. POLICIES (RLS) - PROFILES
-- ============================================

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 7. POLICIES (RLS) - USER ROLES
-- ============================================

CREATE POLICY "Admins can do everything on user_roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 8. POLICIES (RLS) - CLIENTS
-- ============================================

CREATE POLICY "Authenticated users can view all clients"
  ON public.clients FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Clients can view their own data"
  ON public.clients FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Clients can update their own data"
  ON public.clients FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Anyone can insert a new client (signup)"
  ON public.clients FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 9. POLICIES (RLS) - EMPLOYEES
-- ============================================

CREATE POLICY "Authenticated users can view all employees"
  ON public.employees FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage employees"
  ON public.employees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 10. POLICIES (RLS) - REPLACEMENTS
-- ============================================

CREATE POLICY "Authenticated users can view all replacements"
  ON public.replacements FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage replacements"
  ON public.replacements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 11. POLICIES (RLS) - PRODUCTS
-- ============================================

CREATE POLICY "Authenticated users can view all products"
  ON public.products FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 12. POLICIES (RLS) - SERVICES
-- ============================================

CREATE POLICY "Authenticated users can view all services"
  ON public.services FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 13. SEED DATA (Optional - Remove in production)
-- ============================================

-- Insert sample employees
INSERT INTO public.employees (name, role, phone, email, hire_date, active) VALUES
('Roberto Lima', 'Instalador Senior', '(45) 99901-0001', 'roberto@iguacu.com', '2020-03-15', true),
('Pedro Souza', 'Instalador', '(45) 99901-0002', 'pedro@iguacu.com', '2021-08-01', true),
('Lucas Ferreira', 'Instalador', '(45) 99901-0003', 'lucas@iguacu.com', '2023-01-10', true),
('Fernanda Alves', 'Atendente', '(45) 99901-0004', 'fernanda@iguacu.com', '2022-05-20', true),
('Marcos Pereira', 'Gerente', '(45) 99901-0005', 'marcos@iguacu.com', '2019-01-05', true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO public.products (name, category, quantity, min_quantity, price, supplier) VALUES
('Para-brisa Civic 2020-2024', 'Para-brisa', 5, 2, 850.00, 'Vidros Brasil'),
('Para-brisa Corolla 2020-2024', 'Para-brisa', 3, 2, 920.00, 'Vidros Brasil'),
('Retrovisor Universal Esq.', 'Retrovisor', 12, 5, 180.00, 'AutoParts PR'),
('Retrovisor Universal Dir.', 'Retrovisor', 8, 5, 180.00, 'AutoParts PR'),
('Vigia Traseiro HB20', 'Vigia', 2, 2, 450.00, 'Vidros Brasil'),
('Farol Dianteiro Universal', 'Farol', 15, 5, 320.00, 'LuzCar'),
('Cola PU Automotiva', 'Insumo', 30, 10, 45.00, 'QuímicAuto'),
('Primer Ativador', 'Insumo', 1, 5, 65.00, 'QuímicAuto')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 14. INDEXES (Performance)
-- ============================================

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_active ON public.clients(active);
CREATE INDEX idx_employees_role ON public.employees(role);
CREATE INDEX idx_employees_active ON public.employees(active);
CREATE INDEX idx_replacements_client_id ON public.replacements(client_id);
CREATE INDEX idx_replacements_employee_id ON public.replacements(employee_id);
CREATE INDEX idx_replacements_date ON public.replacements(date);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_services_client_id ON public.services(client_id);
CREATE INDEX idx_services_employee_id ON public.services(employee_id);
CREATE INDEX idx_services_date ON public.services(service_date);

-- ============================================
-- 15. EXPENSES & ASSETS (FINANCEIRO)
-- ============================================

-- Expenses (Despesas/Gastos)
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Compra', 'Funcionário', 'Aluguel', 'Utilitários', 'Outro'
  amount DECIMAL(10, 2) NOT NULL,
  expense_type TEXT NOT NULL DEFAULT 'pontual', -- 'recorrente', 'pontual'
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  related_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assets (Patrimônio - Carros, Motos, Imóveis, etc - NÃO ESTOQUE)
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL, -- 'Carro', 'Moto', 'Imóvel', 'Equipamento', 'Outro'
  value DECIMAL(10, 2) NOT NULL,
  acquisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sales (Vendas/Lucros)
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  sale_type TEXT NOT NULL DEFAULT 'pontual', -- 'recorrente', 'pontual'
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Services (Serviços - Trocas de vidro e reparos)
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  plate TEXT,
  service_type TEXT NOT NULL, -- 'Para-brisa', 'Retrovisor', 'Vigia', 'Farol', 'Vidro lateral', 'Outro'
  description TEXT,
  value DECIMAL(10, 2) NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name TEXT,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Appointments (Agendamentos - Marcações feitas pelos clientes)
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  service_type TEXT NOT NULL, -- 'Para-brisa', 'Retrovisor', 'Vigia', 'Farol', 'Vidro lateral', 'Insumo', 'Ferramenta', 'Outro'
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'confirmado', 'cancelado', 'concluído'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Product Movement Log (Rastreamento de entradas/saídas)
CREATE TABLE public.product_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL, -- 'entrada', 'saída'
  quantity INTEGER NOT NULL,
  reason TEXT, -- 'compra', 'venda', 'ajuste', 'dano'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Policies for Financial Tables
CREATE POLICY "Authenticated users can view expenses"
  ON public.expenses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage expenses"
  ON public.expenses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view assets"
  ON public.assets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage assets"
  ON public.assets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view sales"
  ON public.sales FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage sales"
  ON public.sales FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view product movements"
  ON public.product_movements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view services"
  ON public.services FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage product movements"
  ON public.product_movements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 16. POLICIES (RLS) - APPOINTMENTS
-- ============================================

CREATE POLICY "Authenticated users can view all appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Clients can create their own appointments"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Clients can update their own appointments"
  ON public.appointments FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Admins can manage all appointments"
  ON public.appointments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_assets_updated_at ON public.assets;
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_assets_type ON public.assets(asset_type);
CREATE INDEX idx_sales_product_id ON public.sales(product_id);
CREATE INDEX idx_sales_date ON public.sales(sale_date);
CREATE INDEX idx_services_client_id ON public.services(client_id);
CREATE INDEX idx_services_employee_id ON public.services(employee_id);
CREATE INDEX idx_services_date ON public.services(service_date);
CREATE INDEX idx_product_movements_product_id ON public.product_movements(product_id);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_scheduled_date ON public.appointments(scheduled_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- ============================================
-- END OF SCHEMA
-- ============================================
