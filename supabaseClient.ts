import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iisexzdhptmhpzwpfenz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc2V4emRocHRtaHB6d3BmZW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDU5NTcsImV4cCI6MjA4ODA4MTk1N30.WQPQ5GU9ddcg5TWLWBgjLebW0sXoWPjOfo-cgRfgSTU';

export const supabase = createClient(supabaseUrl, supabaseKey);
