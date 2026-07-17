import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://gloacduyuexxrydebvwf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsb2FjZHV5dWV4eHJ5ZGVidndmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgyMjY5MCwiZXhwIjoyMDgzMzk4NjkwfQ.PKSyntDSq8TeiDTLn4VlXd51CgqdoU4raP8APiUpwNY');

async function run() {
  const { data, error } = await supabase.from('system_settings').insert([
    { key: 'test_key', value: '["CT01", "CT02"]', description: 'test' }
  ]);
  console.log({ error });
}
run();
