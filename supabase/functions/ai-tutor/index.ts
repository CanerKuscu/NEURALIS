// @ts-nocheck
// Neuralis AI Tutor — Gemini-powered Shadow Tutor edge function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Auth
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        // 2. Parse body
        const { prompt, systemPrompt, provider } = await req.json()
        if (!prompt) throw new Error('Missing prompt')

        // 3. Call Gemini API
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')

        const defaultSystem = `You are the Shadow Tutor, an AI mentor within the Neuralis learning system. Analyze cognitive errors and guide users to correct answers. Be concise, encouraging, and focus on teaching the reasoning path — never just give the answer. Keep responses under 300 words.`

        const fullPrompt = `${systemPrompt || defaultSystem}\n\n${prompt}`

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: fullPrompt }] },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    },
                }),
            }
        )

        if (!res.ok) {
            const errText = await res.text()
            throw new Error(`Gemini error (${res.status}): ${errText}`)
        }

        const data = await res.json()
        const response = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

        return new Response(
            JSON.stringify({ response }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('ai-tutor error:', error.message)
        const status = error.message?.includes('Unauthorized') ? 401 : 500
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
        )
    }
})
