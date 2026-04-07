-- MX Gestão Preditiva CRM & Management System Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Team Members (Cadastro de Vendedores e Staff)
CREATE TABLE IF NOT EXISTS team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT,
    conversion NUMERIC(5,2) DEFAULT 0,
    execution NUMERIC(5,2) DEFAULT 0,
    sales INTEGER DEFAULT 0,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Leads (Funnel / Pipeline)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    car TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'Lead', -- Lead, Contato, Agendamento, Visita, Proposta, Venda, Perdido
    sla_minutes INTEGER DEFAULT 0,
    source TEXT, -- Internet, Porta, Carteira
    value NUMERIC(12,2) DEFAULT 0,
    score INTEGER DEFAULT 50,
    last_action TEXT,
    loss_reason TEXT,
    stagnant_days INTEGER DEFAULT 0,
    seller_id UUID REFERENCES team(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tasks (Atividades e Tarefas)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    priority TEXT DEFAULT 'Média', -- Alta, Média, Baixa
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Pendente', -- Pendente, Concluída, Atrasada
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Commissions (Vendas concluídas e Repasses)
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES team(id) ON DELETE SET NULL,
    car TEXT,
    sale_date DATE DEFAULT CURRENT_DATE,
    margin TEXT, -- Ex: "12.5%"
    commission_amount NUMERIC(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Commission Rules (Regras de Cálculo)
CREATE TABLE IF NOT EXISTS commission_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES team(id) ON DELETE CASCADE,
    vehicle_type TEXT,
    margin_min NUMERIC(5,2),
    margin_max NUMERIC(5,2),
    percentage NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Goals (Metas de Vendas)
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'Equipe' ou 'Individual'
    target_id UUID REFERENCES team(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Audit Logs (Histórico para IA Diagnostics)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Referência ao usuário logado (opcional)
    action TEXT NOT NULL,
    resource TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Notifications (Alertas do Sistema)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    time_label TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for leads
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
