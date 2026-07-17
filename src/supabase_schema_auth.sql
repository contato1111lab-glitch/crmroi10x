-- Criação da Tabela de Códigos de Convite
CREATE TABLE IF NOT EXISTS codigos_convite (
    codigo TEXT PRIMARY KEY,
    usado BOOLEAN DEFAULT FALSE,
    usado_por TEXT,
    data_uso TIMESTAMP WITH TIME ZONE
);

-- Inserindo os códigos iniciais para Gabriel e Fred
INSERT INTO codigos_convite (codigo) 
VALUES 
    ('GABRIEL10X'), 
    ('FRED10X')
ON CONFLICT (codigo) DO NOTHING;

-- Garantir que a tabela de usuários exista, caso ainda não tenha rodado o schema anterior
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT -- Agora a senha criptografada ficará no auth.users do Supabase, aqui podemos deixar nulo ou remover
);
