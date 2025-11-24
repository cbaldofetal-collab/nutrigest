-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
    metadata JSONB DEFAULT '{}',
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sheets table
CREATE TABLE IF NOT EXISTS sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    size INTEGER NOT NULL CHECK (size > 0),
    row_count INTEGER NOT NULL CHECK (row_count > 0),
    column_count INTEGER NOT NULL CHECK (column_count > 0),
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'error')),
    settings JSONB DEFAULT '{"hasHeader": true}',
    file_path TEXT NOT NULL,
    error_message TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create processed_data table
CREATE TABLE IF NOT EXISTS processed_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
    headers JSONB NOT NULL,
    rows JSONB NOT NULL,
    data_types JSONB NOT NULL,
    statistics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN ('summary', 'trends', 'anomalies', 'predictions')),
    insights JSONB NOT NULL,
    summary JSONB NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    processing_time_ms INTEGER,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
    metadata JSONB DEFAULT '{}',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sheets_user_id ON sheets(user_id);
CREATE INDEX IF NOT EXISTS idx_sheets_status ON sheets(status);
CREATE INDEX IF NOT EXISTS idx_sheets_uploaded_at ON sheets(uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_processed_data_sheet_id ON processed_data(sheet_id);
CREATE INDEX IF NOT EXISTS idx_processed_data_created_at ON processed_data(created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_sheet_id ON analytics(sheet_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics(analysis_type);
CREATE INDEX IF NOT EXISTS idx_analytics_generated_at ON analytics(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sheets_updated_at BEFORE UPDATE ON sheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for Supabase
GRANT SELECT ON users TO anon;
GRANT ALL ON users TO authenticated;
GRANT SELECT ON sheets TO anon;
GRANT ALL ON sheets TO authenticated;
GRANT SELECT ON processed_data TO anon;
GRANT ALL ON processed_data TO authenticated;
GRANT SELECT ON analytics TO anon;
GRANT ALL ON analytics TO authenticated;
GRANT SELECT ON subscriptions TO anon;
GRANT ALL ON subscriptions TO authenticated;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own sheets" ON sheets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sheets" ON sheets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sheets" ON sheets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sheets" ON sheets
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their processed data" ON processed_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sheets 
            WHERE sheets.id = processed_data.sheet_id 
            AND sheets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their analytics" ON analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sheets 
            WHERE sheets.id = analytics.sheet_id 
            AND sheets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Insert sample data for testing
INSERT INTO users (email, password_hash, name, plan, email_verified) VALUES
    ('demo@leitorplanilhas.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..G', 'Demo User', 'free', true),
    ('premium@leitorplanilhas.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..G', 'Premium User', 'premium', true);