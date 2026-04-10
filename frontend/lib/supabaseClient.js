import {createClient} from "@supabase/supabase-js";

const supabbaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabbaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabbaseUrl, supabbaseAnonKey);