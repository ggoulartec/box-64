import {createClient} from "@supabase/supabase-js";

const supabbaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabbaseUrl, supabaseAnonKey);