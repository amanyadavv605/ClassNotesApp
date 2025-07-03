// src/config/supabase.js
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://vdsdaxiuvpxucuadocfc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkc2RheGl1dnB4dWN1YWRvY2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0ODc0NDEsImV4cCI6MjA2NTA2MzQ0MX0.ssJnZpmw8hIXdSZqLs_1T7gy6Nb9D9RIKuwZn0Fh5dA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
