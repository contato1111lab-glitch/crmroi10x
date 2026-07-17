import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://gloacduyuexxrydebvwf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsb2FjZHV5dWV4eHJ5ZGVidndmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgyMjY5MCwiZXhwIjoyMDgzMzk4NjkwfQ.PKSyntDSq8TeiDTLn4VlXd51CgqdoU4raP8APiUpwNY');

async function run() {
  const { data, error } = await supabase.from('campanhas_diarias').select('*').limit(1);
  console.log(data);
  
  // Try to create the criativos table
  const query = `
    CREATE TABLE IF NOT EXISTS campanhas_criativos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      id_campanha UUID REFERENCES campanhas_diarias(id) ON DELETE CASCADE,
      nome_criativo TEXT NOT NULL,
      status TEXT CHECK (status IN ('Ativo', 'Inativo')) DEFAULT 'Ativo'
    );
  `;
  // We can't run raw SQL from js client easily unless we use an RPC.
  // We can check if we can add a JSONB column to campanhas_diarias.
}
run();
