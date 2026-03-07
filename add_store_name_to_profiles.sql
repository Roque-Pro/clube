-- Adicionar coluna store_name na tabela profiles
ALTER TABLE public.profiles ADD COLUMN store_name VARCHAR(255) DEFAULT 'IGUAÇU AUTO VIDROS SOM E ACESSÓRIOS';

-- Atualizar os usuários com seus nomes de loja
-- Natalia - JJ Parabrisas
UPDATE public.profiles 
SET store_name = 'JJ PARABRISAS'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'natalia-jjparabrisas@clubedovidro.com.br');

-- Milena - Iguaçu Auto - Som e Acessórios
UPDATE public.profiles 
SET store_name = 'IGUAÇU AUTO - SOM E ACESSÓRIOS'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'milena-someacessorios@clubedovidro.com.br');

-- Jessica - Iguaçu Auto Vidros
UPDATE public.profiles 
SET store_name = 'IGUAÇU AUTO VIDROS'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jessica-iguacuauto@clubedovidro.com.br');
