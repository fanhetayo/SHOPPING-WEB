import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hkhajycblrfslxnapogx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhraGFqeWNibHJmc2x4bmFwb2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MjY5MTcsImV4cCI6MjA4ODIwMjkxN30.wtyi1Cn3nXBWHdOhQJ9InFiJwvdZUsE_ZMT8jb2PI54';

export const supabase = createClient(supabaseUrl, supabaseKey);
