import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uekshbaanpprrkanjuve.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVla3NoYmFhbnBwcnJrYW5qdXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyODk5NzEsImV4cCI6MjA1Nzg2NTk3MX0.M9woVu3DkrvC0sNLa3t1E4xFHLy4D2_acC1GPUu6h-Q";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
