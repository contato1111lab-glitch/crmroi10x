import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gloacduyuexxrydebvwf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsb2FjZHV5dWV4eHJ5ZGVidndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MjI2OTAsImV4cCI6MjA4MzM5ODY5MH0.oTfxxNHsdbnrHFXg7ibm955bKB7RIh5ck06AHZP8QPA';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .rpc('get_table_columns', { table_name: 'infraestrutura_meta' }); // Probably won't work, let's just make a dummy insert and see the error? No.

  const { data: d2, error: e2 } = await supabase.from('infraestrutura_meta').select('id_bm,nome_bm').limit(1);
  console.log('Test nome_bm:', e2);
}
test();
