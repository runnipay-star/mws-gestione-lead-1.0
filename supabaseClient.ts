
import { createClient } from '@supabase/supabase-js';

// INSERISCI QUI I TUOI VALORI OTTENUTI DAL PASSO 2 DELLA GUIDA-
const supabaseUrl = 'https://lmuunqingyolxjuktred.supabase.co'; // Es: 'https://xxxxxxxx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtdXVucWluZ3lvbHhqdWt0cmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTAzNjYsImV4cCI6MjA3MjU4NjM2Nn0.DZ8CVuTNTehfMitQpPFJoJumUsngTbhUbcSgK6FGHQE'; // Es: 'ey...'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);