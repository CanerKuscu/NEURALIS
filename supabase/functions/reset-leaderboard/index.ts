// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    try {
        // Create a Supabase client with the Auth context of the logged in user
        const supabaseClient = createClient(
            // Supabase API URL - env var automatically populated by Supabase
            Deno.env.get('SUPABASE_URL') ?? '',
            // Supabase API ANON KEY - env var automatically populated by Supabase
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log("Resetting weekly leaderboard...")

        // Reset weekly_xp to 0 for all profiles
        const { error } = await supabaseClient
            .from('profiles')
            .update({ weekly_xp: 0 })
            .neq('weekly_xp', 0) // Only update those who have XP

        if (error) throw error

        return new Response(
            JSON.stringify({ message: 'Leaderboard reset successfully' }),
            { headers: { "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        )
    }
})
