// =============================================
// SUPABASE CONFIGURATION
// Replace with your Supabase project values
// =============================================

const SUPABASE_URL = 'https://kxkhxuddffqlqfvtnrth.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4a2h4dWRkZmZxbHFmdnRucnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDM5ODUsImV4cCI6MjA4NTM3OTk4NX0.S8YJgLEKoN_GRK6py3KHtLRwnWC_s3LY3cC4vufBmSo';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
