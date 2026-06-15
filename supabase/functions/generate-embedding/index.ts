// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'

console.log("Edge Function: generate-embedding initialized");

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        const { text, lessonCacheId, embedding } = await req.json()

        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } },
        })

        // Verify user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        // MODE 1: Generate embedding from text
        if (text) {
            const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
            if (!GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY not configured')
            }

            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'models/text-embedding-004',
                        content: {
                            parts: [{ text }],
                        },
                    }),
                }
            )

            if (!res.ok) {
                const errText = await res.text()
                throw new Error(`Gemini Embedding API Error: ${errText}`)
            }

            const data = await res.json()
            const embeddingValues = data?.embedding?.values

            if (!embeddingValues || !Array.isArray(embeddingValues)) {
                throw new Error('Invalid embedding response')
            }

            return new Response(
                JSON.stringify({ embedding: embeddingValues, dimension: embeddingValues.length }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // MODE 2: Save embedding to lesson_cache
        if (lessonCacheId && embedding) {
            if (!supabaseServiceKey) {
                throw new Error('Service role key not configured')
            }
            const adminClient = createClient(supabaseUrl, supabaseServiceKey)

            const { error: updateError } = await adminClient
                .from('lesson_cache')
                .update({
                    embedding: embedding,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', lessonCacheId)

            if (updateError) {
                throw new Error(`Embedding update failed: ${updateError.message}`)
            }

            return new Response(
                JSON.stringify({ success: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        throw new Error('Missing "text" or "lessonCacheId + embedding" in body')

    } catch (error) {
        console.error('Embedding Error:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
