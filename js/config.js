// =============================================
// SUPABASE CONFIGURATION
// Replace these with your actual Supabase project values
// =============================================

const SUPABASE_URL = 'https://kxkhxuddffqlqfvtnrth.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_RKe-giF2o95YB2CylBMUOA_P5_R7h3I';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
