-- Tabela de usuários (extendendo auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    semana_gestacional INTEGER CHECK (semana_gestacional >= 1 AND semana_gestacional <= 42),
    tipo_diabetes TEXT CHECK (tipo_diabetes IN ('DMG', 'PRE_EXISTENTE', 'TIPO1', 'TIPO2')) DEFAULT 'DMG',
    data_diagnostico DATE,
    data_parto_prevista DATE,
    configuracoes JSONB DEFAULT '{}',
    lembretes_ativados BOOLEAN DEFAULT true,
    backup_automatico BOOLEAN DEFAULT true,
    notificacoes_push BOOLEAN DEFAULT true,
    tema TEXT DEFAULT 'sistema' CHECK (tema IN ('claro', 'escuro', 'sistema')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente após registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, nome, email)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'nome', NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();