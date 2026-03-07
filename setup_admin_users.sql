-- Adicionar coluna store_name na tabela employees (se não existir)
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS store_name VARCHAR(255);

-- Adicionar coluna store_name na tabela profiles (se não existir)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_name VARCHAR(255) DEFAULT 'IGUAÇU AUTO VIDROS SOM E ACESSÓRIOS';

-- Adicionar coluna role na tabela profiles (se não existir) 
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Criar funcionários para os 3 administradores
-- Natalia - JJ Parabrisas
INSERT INTO public.employees (name, role, phone, email, hire_date, active, salary, store_name)
VALUES ('Natalia', 'Administrador', '(21) 9999-9999', 'natalia-jjparabrisas@clubedovidro.com.br', CURRENT_DATE, true, 0, 'JJ PARABRISAS')
ON CONFLICT (email) DO UPDATE SET role = 'Administrador', active = true, store_name = 'JJ PARABRISAS';

-- Milena - Iguaçu Auto - Som e Acessórios
INSERT INTO public.employees (name, role, phone, email, hire_date, active, salary, store_name)
VALUES ('Milena', 'Administrador', '(21) 9999-9999', 'milena-someacessorios@clubedovidro.com.br', CURRENT_DATE, true, 0, 'IGUAÇU AUTO - SOM E ACESSÓRIOS')
ON CONFLICT (email) DO UPDATE SET role = 'Administrador', active = true, store_name = 'IGUAÇU AUTO - SOM E ACESSÓRIOS';

-- Jessica - Iguaçu Auto Vidros
INSERT INTO public.employees (name, role, phone, email, hire_date, active, salary, store_name)
VALUES ('Jessica', 'Administrador', '(21) 9999-9999', 'jessica-iguacuauto@clubedovidro.com.br', CURRENT_DATE, true, 0, 'IGUAÇU AUTO VIDROS')
ON CONFLICT (email) DO UPDATE SET role = 'Administrador', active = true, store_name = 'IGUAÇU AUTO VIDROS';

-- Atualizar profiles para role admin e store_name
-- Natalia
UPDATE public.profiles 
SET role = 'admin', store_name = 'JJ PARABRISAS'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'natalia-jjparabrisas@clubedovidro.com.br');

-- Milena
UPDATE public.profiles 
SET role = 'admin', store_name = 'IGUAÇU AUTO - SOM E ACESSÓRIOS'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'milena-someacessorios@clubedovidro.com.br');

-- Jessica
UPDATE public.profiles 
SET role = 'admin', store_name = 'IGUAÇU AUTO VIDROS'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jessica-iguacuauto@clubedovidro.com.br');
