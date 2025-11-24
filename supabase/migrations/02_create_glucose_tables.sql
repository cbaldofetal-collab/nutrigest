-- Tabela de registros glicêmicos
CREATE TABLE IF NOT EXISTS public.registros_glicemicos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    valor_glicemia INTEGER NOT NULL CHECK (valor_glicemia >= 30 AND valor_glicemia <= 600),
    tipo_jejum TEXT NOT NULL CHECK (tipo_jejum IN ('jejum', 'pos-prandial')),
    data_medicao DATE NOT NULL,
    hora_medicao TIME NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_registros_usuario_id ON public.registros_glicemicos(usuario_id);
CREATE INDEX idx_registros_data_medicao ON public.registros_glicemicos(data_medicao);
CREATE INDEX idx_registros_tipo_jejum ON public.registros_glicemicos(tipo_jejum);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_registros_updated_at 
    BEFORE UPDATE ON public.registros_glicemicos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Tabela de metas glicêmicas por usuário
CREATE TABLE IF NOT EXISTS public.metas_glicemicas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meta_jejum_min INTEGER DEFAULT 70,
    meta_jejum_max INTEGER DEFAULT 95,
    meta_pos_prandial_min INTEGER DEFAULT 100,
    meta_pos_prandial_max INTEGER DEFAULT 140,
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice único para garantir apenas uma meta ativa por usuário
CREATE UNIQUE INDEX idx_metas_usuario_ativa ON public.metas_glicemicas(usuario_id) WHERE ativa = true;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_metas_updated_at 
    BEFORE UPDATE ON public.metas_glicemicas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();