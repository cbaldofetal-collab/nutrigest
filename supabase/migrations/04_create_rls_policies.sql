-- Habilitar RLS nas tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_glicemicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_glicemicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios_pdf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consentimentos ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela users
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para tabela registros_glicemicos
CREATE POLICY "Users can view own glucose records" ON public.registros_glicemicos
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own glucose records" ON public.registros_glicemicos
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own glucose records" ON public.registros_glicemicos
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own glucose records" ON public.registros_glicemicos
    FOR DELETE USING (auth.uid() = usuario_id);

-- Políticas para tabela metas_glicemicas
CREATE POLICY "Users can view own glucose goals" ON public.metas_glicemicas
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can manage own glucose goals" ON public.metas_glicemicas
    FOR ALL USING (auth.uid() = usuario_id);

-- Políticas para tabela notificacoes
CREATE POLICY "Users can view own notifications" ON public.notificacoes
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can manage own notifications" ON public.notificacoes
    FOR ALL USING (auth.uid() = usuario_id);

-- Políticas para tabela relatorios_pdf
CREATE POLICY "Users can view own PDF reports" ON public.relatorios_pdf
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create own PDF reports" ON public.relatorios_pdf
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Políticas para tabela consentimentos
CREATE POLICY "Users can view own consent" ON public.consentimentos
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can update own consent" ON public.consentimentos
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create own consent" ON public.consentimentos
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);