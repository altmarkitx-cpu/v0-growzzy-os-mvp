// Test Supabase connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zezdnybwtajdvqpxgcid.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplemRueWJ3dGFqZHZxcHhnY2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzE3NTcsImV4cCI6MjA4NTYwNzc1N30.bFa4UrmdwiNFyuQP71BTzGu0zr-2QaGYltdFrnDvRVg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').single();
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    } else {
      console.log('✅ Connection successful!');
      console.log('✅ Database accessible');
      return true;
    }
  } catch (err) {
    console.error('❌ Error:', err);
    return false;
  }
}

testConnection();
