-- Criação da Tabela: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL
);

-- Criação da Tabela: produtos
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_produto TEXT NOT NULL,
    tipo TEXT CHECK (tipo IN ('Nutra', 'Info')) NOT NULL,
    faturamento_bruto_produto NUMERIC DEFAULT 0,
    faturamento_bruto_operacao NUMERIC DEFAULT 0
);

-- Criação da Tabela: infraestrutura_meta
CREATE TABLE IF NOT EXISTS infraestrutura_meta (
    id_bm UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_bm TEXT NOT NULL,
    perfil_dono TEXT NOT NULL,
    cartao_final VARCHAR(4),
    status TEXT CHECK (status IN ('Ativa', 'Bloqueada')) NOT NULL
);

-- Criação da Tabela: fechamento_diario
CREATE TABLE IF NOT EXISTS fechamento_diario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_referencia DATE NOT NULL,
    gasto_trafego_total NUMERIC DEFAULT 0,
    status_fechamento TEXT NOT NULL
);

-- Criação da Tabela: leads_crm
CREATE TABLE IF NOT EXISTS leads_crm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_cliente TEXT NOT NULL,
    telefone TEXT NOT NULL,
    id_produto UUID REFERENCES produtos(id) ON DELETE SET NULL,
    fase_funil TEXT CHECK (fase_funil IN ('Novo', 'Atendimento', 'Agendado', 'Concluido', 'Desqualificado', 'Recusado')) NOT NULL,
    data_entrada TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    data_prevista_entrega DATE
);

-- Criação da Tabela: log_auditoria
CREATE TABLE IF NOT EXISTS log_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    acao TEXT NOT NULL,
    tabela_afetada TEXT NOT NULL,
    registro_id UUID,
    usuario_responsavel TEXT
);

-- Function para a Trigger de Auditoria
CREATE OR REPLACE FUNCTION function_auditoria() RETURNS TRIGGER AS $$
DECLARE
    nome_tabela TEXT := TG_TABLE_NAME;
    tipo_acao TEXT := TG_OP;
    id_registro UUID;
    v_usuario TEXT;
BEGIN
    -- Captura o email do usuário logado no Supabase Auth, se houver
    v_usuario := coalesce(current_setting('request.jwt.claims', true)::json->>'email', 'Sistema');

    IF tipo_acao = 'DELETE' THEN
        IF nome_tabela = 'infraestrutura_meta' THEN
            id_registro := OLD.id_bm;
        ELSE
            id_registro := OLD.id;
        END IF;
        
        INSERT INTO log_auditoria (acao, tabela_afetada, registro_id, usuario_responsavel)
        VALUES (tipo_acao, nome_tabela, id_registro, v_usuario);
        RETURN OLD;
        
    ELSIF tipo_acao = 'UPDATE' THEN
        IF nome_tabela = 'infraestrutura_meta' THEN
            id_registro := NEW.id_bm;
        ELSE
            id_registro := NEW.id;
        END IF;

        INSERT INTO log_auditoria (acao, tabela_afetada, registro_id, usuario_responsavel)
        VALUES (tipo_acao, nome_tabela, id_registro, v_usuario);
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers de Auditoria para as Tabelas
DROP TRIGGER IF EXISTS trg_auditoria_usuarios ON usuarios;
CREATE TRIGGER trg_auditoria_usuarios
AFTER UPDATE OR DELETE ON usuarios
FOR EACH ROW EXECUTE FUNCTION function_auditoria();

DROP TRIGGER IF EXISTS trg_auditoria_produtos ON produtos;
CREATE TRIGGER trg_auditoria_produtos
AFTER UPDATE OR DELETE ON produtos
FOR EACH ROW EXECUTE FUNCTION function_auditoria();

DROP TRIGGER IF EXISTS trg_auditoria_infraestrutura_meta ON infraestrutura_meta;
CREATE TRIGGER trg_auditoria_infraestrutura_meta
AFTER UPDATE OR DELETE ON infraestrutura_meta
FOR EACH ROW EXECUTE FUNCTION function_auditoria();

DROP TRIGGER IF EXISTS trg_auditoria_fechamento_diario ON fechamento_diario;
CREATE TRIGGER trg_auditoria_fechamento_diario
AFTER UPDATE OR DELETE ON fechamento_diario
FOR EACH ROW EXECUTE FUNCTION function_auditoria();

DROP TRIGGER IF EXISTS trg_auditoria_leads_crm ON leads_crm;
CREATE TRIGGER trg_auditoria_leads_crm
AFTER UPDATE OR DELETE ON leads_crm
FOR EACH ROW EXECUTE FUNCTION function_auditoria();
