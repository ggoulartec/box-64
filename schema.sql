-- Script SQL para rodar no SQL Editor do Supabase

-- 1. Criação da tabela de Lotes (Miniaturas)
CREATE TABLE public.lots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    number VARCHAR(10) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(150) NOT NULL,
    year VARCHAR(4),
    designer VARCHAR(100),
    segment VARCHAR(50),
    series VARCHAR(150),
    scale VARCHAR(20) DEFAULT '1:64',
    body_color VARCHAR(100),
    window_color VARCHAR(50),
    interior_color VARCHAR(50),
    base_material VARCHAR(50),
    wheel_type VARCHAR(50),
    condition VARCHAR(50),
    box_condition VARCHAR(50),
    description TEXT,
    starting_bid NUMERIC(10,2) DEFAULT 0,
    current_bid NUMERIC(10,2) DEFAULT 0,
    min_increment NUMERIC(10,2) DEFAULT 10,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    images TEXT[] -- Array de URLs das imagens
);

-- 2. Criação da tabela de Lances (Bids)
CREATE TABLE public.bids (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    amount NUMERIC(10,2) NOT NULL
);

-- 3. Função para atualizar o "current_bid" do lote automaticamente
CREATE OR REPLACE FUNCTION public.update_lot_current_bid()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.lots
    SET current_bid = NEW.amount
    WHERE id = NEW.lot_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger para disparar a função acima sempre que um lance for dado
CREATE TRIGGER tr_update_lot_bid
AFTER INSERT ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.update_lot_current_bid();

-- 5. Configuração de Segurança (Row Level Security - RLS)
-- Para testar rápido e sem login no Supabase (apenas Mock na interface), vamos liberar acesso total.
-- (ATENÇÃO: Em produção, isso deve ser alterado!)
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all actions for all users" ON public.lots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all actions for all users" ON public.bids FOR ALL USING (true) WITH CHECK (true);

-- Habilitar o Realtime nas tabelas para ouvirmos lances novos
alter publication supabase_realtime add table public.lots;
alter publication supabase_realtime add table public.bids;
