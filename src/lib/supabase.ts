import { createClient } from '@supabase/supabase-js';

// ATENÇÃO: Regra de Arquitetura (Fase 1)
// Conforme solicitado e gravado na pedra, as credenciais estão HARDCODED aqui.
// Sem uso de variáveis de ambiente. Apenas para acesso interno de Gabriel e Fred.

const SUPABASE_URL = 'https://gloacduyuexxrydebvwf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsb2FjZHV5dWV4eHJ5ZGVidndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MjI2OTAsImV4cCI6MjA4MzM5ODY5MH0.oTfxxNHsdbnrHFXg7ibm955bKB7RIh5ck06AHZP8QPA';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsb2FjZHV5dWV4eHJ5ZGVidndmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgyMjY5MCwiZXhwIjoyMDgzMzk4NjkwfQ.PKSyntDSq8TeiDTLn4VlXd51CgqdoU4raP8APiUpwNY';

// Cliente principal (Client-side)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cliente Admin (Service Role) - Use com extrema cautela
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
