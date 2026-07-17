import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gloacduyuexxrydebvwf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsb2FjZHV5dWV4eHJ5ZGVidndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MjI2OTAsImV4cCI6MjA4MzM5ODY5MH0.oTfxxNHsdbnrHFXg7ibm955bKB7RIh5ck06AHZP8QPA';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('infraestrutura_meta')
    .select('*')
    .limit(1);

  console.log({ data, error });
}
test();
