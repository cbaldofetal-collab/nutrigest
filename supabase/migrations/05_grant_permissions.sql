-- Conceder permissões básicas para roles anon e authenticated
-- Isso é necessário para que os usuários possam acessar os dados

-- Permissões para tabela users
GRANT SELECT ON public.users TO anon;
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Permissões para tabela registros_glicemicos
GRANT SELECT ON public.registros_glicemicos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros_glicemicos TO authenticated;

-- Permissões para tabela metas_glicemicas
GRANT SELECT ON public.metas_glicemicas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas_glicemicas TO authenticated;

-- Permissões para tabela notificacoes
GRANT SELECT ON public.notificacoes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificacoes TO authenticated;

-- Permissões para tabela relatorios_pdf
GRANT SELECT ON public.relatorios_pdf TO anon;
GRANT SELECT, INSERT ON public.relatorios_pdf TO authenticated;

-- Permissões para tabela consentimentos
GRANT SELECT ON public.consentimentos TO anon;
GRANT SELECT, INSERT, UPDATE ON public.consentimentos TO authenticated;

-- Verificar permissões atuais
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;