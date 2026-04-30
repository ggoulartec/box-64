import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lhuumdbasebtionlehby.supabase.co'
const supabaseKey = 'sb_publishable_ZtSElGa73I35GJRQ6KFkpg_rRbtnPiD'

export const supabase = createClient(supabaseUrl, supabaseKey)
