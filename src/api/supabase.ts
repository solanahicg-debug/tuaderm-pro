import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://kximfoaaewunemuasqdh.supabase.co"
const supabaseKey = "sb_publishable_wewmTVRlagMASSgvrW2lUQ_Gpvul0XY"

export const supabase = createClient(supabaseUrl, supabaseKey)