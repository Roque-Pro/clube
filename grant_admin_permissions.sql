-- Dar permissão de administrador aos 3 usuários
-- Natalia
INSERT INTO public.user_roles (user_id, role)
VALUES ((SELECT id FROM auth.users WHERE email = 'natalia-jjparabrisas@clubedovidro.com.br'), 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Milena
INSERT INTO public.user_roles (user_id, role)
VALUES ((SELECT id FROM auth.users WHERE email = 'milena-someacessorios@clubedovidro.com.br'), 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Jessica
INSERT INTO public.user_roles (user_id, role)
VALUES ((SELECT id FROM auth.users WHERE email = 'jessica-iguacuauto@clubedovidro.com.br'), 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
