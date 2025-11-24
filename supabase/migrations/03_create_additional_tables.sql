-- Tabela de notificações e lembretes
CREATE TABLE IF NOT EXISTS public.notificacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('glicemia', 'medicamento', 'consulta', 'geral')),
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    data_agendada TIMESTAMP WITH TIME ZONE,
    enviada BOOLEAN DEFAULT false,
    lida BOOLEAN DEFAULT false,
    dados_adicionais JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para notificações
CREATE INDEX idx_notificacoes_usuario_id ON public.notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_data_agendada ON public.notificacoes(data_agendada);
CREATE INDEX idx_notificacoes_enviada ON public.notificacoes(enviada);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_notificacoes_updated_at 
    BEFORE UPDATE ON public.notificacoes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Tabela de relatórios PDF gerados
CREATE TABLE IF NOT EXISTS public.relatorios_pdf (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tipo_relatorio TEXT NOT NULL CHECK (tipo_relatorio IN ('glicemia_semanal', 'glicemia_mensal', 'glicemia_anual', 'consulta')),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    nome_arquivo TEXT NOT NULL,
    tamanho_arquivo INTEGER,
    url_armazenamento TEXT,
    estatisticas JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para relatórios
CREATE INDEX idx_relatorios_usuario_id ON public.relatorios_pdf(usuario_id);
CREATE INDEX idx_relatorios_tipo ON public.relatorios_pdf(tipo_relatorio);
CREATE INDEX idx_relatorios_data_criacao ON public.relatorios_pdf(created_at);

-- Tabela de consentimentos de privacidade
CREATE TABLE IF NOT EXISTS public.consentimentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    termos_aceitos BOOLEAN DEFAULT false,
    politica_privacidade_aceita BOOLEAN DEFAULT false,
    compartilhamento_dados BOOLEAN DEFAULT false,
    versao_termos TEXT NOT NULL DEFAULT '1.0',
    data_aceitacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice único para garantir apenas um consentimento por usuário
CREATE UNIQUE INDEX idx_consentimentos_usuario_id ON public.consentimentos(usuario_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_consentimentos_updated_at 
    BEFORE UPDATE ON public.consentimentos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();