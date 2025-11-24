-- GlicoGest - Monitoramento Inteligente para Diabetes Gestacional
-- Schema inicial do banco de dados

-- 1. Perfis de Usuário (gestantes)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    semana_gestacional INTEGER CHECK (semana_gestacional BETWEEN 1 AND 40),
    data_diagnostico DATE,
    tipo_diabetes VARCHAR(20) CHECK (tipo_diabetes IN ('DMG', 'PRE_EXISTENTE')),
    data_parto_prevista DATE,
    meta_jejum INTEGER DEFAULT 95 CHECK (meta_jejum BETWEEN 70 AND 120),
    meta_pos_prandial INTEGER DEFAULT 140 CHECK (meta_pos_prandial BETWEEN 100 AND 180),
    pin_hash VARCHAR(255),
    biometria_ativada BOOLEAN DEFAULT false,
    configuracoes JSONB DEFAULT '{"lembretes_ativados": true, "backup_automatico": true}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Registros Glicêmicos
CREATE TABLE registros_glicemicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    valor_glicemia INTEGER NOT NULL CHECK (valor_glicemia BETWEEN 20 AND 600),
    tipo_medicao VARCHAR(15) NOT NULL CHECK (
        tipo_medicao IN ('JEJUM', 'POS_CAFE', 'POS_ALMOCO', 'POS_JANTAR')
    ),
    data_medicao DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_medicao TIME NOT NULL,
    dentro_meta BOOLEAN NOT NULL,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Configurações de Lembretes
CREATE TABLE configuracoes_lembretes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tipo_medicao VARCHAR(15) NOT NULL CHECK (
        tipo_medicao IN ('JEJUM', 'POS_CAFE', 'POS_ALMOCO', 'POS_JANTAR')
    ),
    ativo BOOLEAN DEFAULT true,
    horario TIME NOT NULL,
    dias_semana INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Dom, 7=Sab
    mensagem_personalizada TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, tipo_medicao)
);

-- 4. Relatórios Gerados
CREATE TABLE relatorios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    nome_arquivo VARCHAR(255) NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    dados_consolidados JSONB NOT NULL, -- Estatísticas e métricas do período
    caminho_arquivo VARCHAR(500), -- Caminho no storage do Supabase
    tipo_relatorio VARCHAR(50) DEFAULT 'COMPLETO' CHECK (tipo_relatorio IN ('COMPLETO', 'SEMANAL', 'MENSAL', 'CUSTOMIZADO')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Backup e Sincronização
CREATE TABLE backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tipo_backup VARCHAR(20) DEFAULT 'MANUAL' CHECK (
        tipo_backup IN ('MANUAL', 'AUTOMATICO')
    ),
    status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (
        status IN ('PENDENTE', 'SUCESSO', 'ERRO')
    ),
    dados_backup JSONB, -- Dados criptografados do backup
    checksum VARCHAR(64), -- Para verificação de integridade
    tamanho_bytes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 6. Notificações e Lembretes
CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('LEMBRETE_MEDICAO', 'ALERTA_GLICEMIA', 'RELATORIO_PRONTO', 'BACKUP_CONCLUIDO')),
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    dados_adicionais JSONB,
    agendada_para TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

CREATE INDEX idx_registros_glicemicos_usuario_data ON registros_glicemicos(usuario_id, data_medicao DESC);
CREATE INDEX idx_registros_glicemicos_tipo_data ON registros_glicemicos(tipo_medicao, data_medicao DESC);
CREATE INDEX idx_registros_glicemicos_dentro_meta ON registros_glicemicos(dentro_meta);

CREATE INDEX idx_configuracoes_lembretes_usuario ON configuracoes_lembretes(usuario_id);
CREATE INDEX idx_configuracoes_lembretes_ativo ON configuracoes_lembretes(ativo);

CREATE INDEX idx_relatorios_usuario_periodo ON relatorios(usuario_id, periodo_inicio DESC);
CREATE INDEX idx_relatorios_created_at ON relatorios(created_at DESC);

CREATE INDEX idx_backups_usuario_status ON backups(usuario_id, status);
CREATE INDEX idx_backups_created_at ON backups(created_at DESC);

CREATE INDEX idx_notificacoes_usuario_lida ON notificacoes(usuario_id, lida);
CREATE INDEX idx_notificacoes_agendada_para ON notificacoes(agendada_para);

-- Funções auxiliares
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trigger_registros_glicemicos_updated_at
    BEFORE UPDATE ON registros_glicemicos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trigger_configuracoes_lembretes_updated_at
    BEFORE UPDATE ON configuracoes_lembretes
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_updated_at();

-- Função para calcular se valor está dentro da meta
CREATE OR REPLACE FUNCTION calcular_dentro_meta(
    p_valor INTEGER,
    p_tipo_medicao VARCHAR(15),
    p_meta_jejum INTEGER DEFAULT 95,
    p_meta_pos_prandial INTEGER DEFAULT 140
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN CASE 
        WHEN p_tipo_medicao = 'JEJUM' THEN p_valor <= p_meta_jejum
        ELSE p_valor <= p_meta_pos_prandial
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Permissões Supabase (RLS será configurado via código)
GRANT SELECT ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;

GRANT SELECT ON registros_glicemicos TO anon;
GRANT ALL ON registros_glicemicos TO authenticated;

GRANT SELECT ON configuracoes_lembretes TO anon;
GRANT ALL ON configuracoes_lembretes TO authenticated;

GRANT SELECT ON relatorios TO anon;
GRANT ALL ON relatorios TO authenticated;

GRANT SELECT ON backups TO anon;
GRANT ALL ON backups TO authenticated;

GRANT SELECT ON notificacoes TO anon;
GRANT ALL ON notificacoes TO authenticated;