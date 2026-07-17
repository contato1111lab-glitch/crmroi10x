import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gloacduyuexxrydebvwf.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsb2FjZHV5dWV4eHJ5ZGVidndmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgyMjY5MCwiZXhwIjoyMDgzMzk4NjkwfQ.PKSyntDSq8TeiDTLn4VlXd51CgqdoU4raP8APiUpwNY';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.rpc('exec_sql', { query: 'SELECT 1;' });
  console.log({ data, error });
}
test();
