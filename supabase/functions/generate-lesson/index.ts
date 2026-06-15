// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'

console.log("Edge Function: generate-lesson initialized (Gemini + Cache)");

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Validate Request
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        const { prompt, category, topic, difficulty, questionCount, isPlacementTest, age, userLevel, language, skipCache } = await req.json()
        if (!prompt) {
            throw new Error('Missing "prompt" in request body')
        }

        // 2. Initialize Supabase Clients
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } },
        })
        // Service role client for cache writes (bypasses RLS)
        const supabaseAdmin = supabaseServiceKey
            ? createClient(supabaseUrl, supabaseServiceKey)
            : null

        // 3. Verify User
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            throw new Error('Unauthorized: Invalid user token')
        }

        // 4. Check cache first (skip for placement tests, ELI5, and explicit skipCache)
        const isEli5 = prompt.includes('ELI5') || prompt.includes('Explain like')
        const contentLang = language || 'en'

        if (!isPlacementTest && !isEli5 && !skipCache && category && difficulty) {
            try {
                const { data: cached } = await supabase.rpc('find_cached_lesson', {
                    p_category: category,
                    p_difficulty: difficulty || 'beginner',
                    p_language: contentLang,
                    p_exclude_ids: [],
                })

                if (cached && cached.length > 0) {
                    const hit = cached[0]
                    console.log(`✅ Cache HIT for ${category}/${difficulty}/${contentLang}: "${hit.title}"`)

                    // Update usage count
                    if (supabaseAdmin) {
                        supabaseAdmin.from('lesson_cache').update({
                            usage_count: (hit.usage_count || 0) + 1,
                            last_served_at: new Date().toISOString(),
                        }).eq('id', hit.id).then(() => { })
                    }

                    return new Response(
                        JSON.stringify({
                            lesson: {
                                title: hit.title,
                                theory: hit.theory,
                                questions: hit.questions,
                            },
                            fromCache: true,
                            cacheId: hit.id,
                        }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                    )
                }
            } catch (cacheErr) {
                console.warn('Cache lookup failed, proceeding to AI:', cacheErr.message)
            }
        }

        // 5. Call Gemini API (cache miss)
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) {
            throw new Error('Server configuration error: GEMINI_API_KEY is not set')
        }

        const ageInfo = age ? `User is ${age} years old.` : 'User age is unknown.';
        const levelInfo = userLevel ? `User level: ${userLevel}.` : '';

        const systemPrompt = `You are a professional educational content creator.
Output strict JSON only. Do not wrap in markdown or code blocks.
Your goal is to complete the user's request for a lesson or test.
${ageInfo} ${levelInfo} Adjust the tone and complexity accordingly.
Include a "theory" section (markdown) explaining the topic before the questions.
For each question, provide an "image_keyword" (single English noun) to fetch a relevant stock image.
Vary question types: Multiple Choice (standard), True/False (2 options), Fill-in-the-blank (formatted as MCQ).

Response Format JSON:
{
  "title": "Lesson Title",
  "theory": "## Topic Intro\\nExplanation here...",
  "questions": [
    {
      "id": "q1",
      "question": "Question text...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Why correct...",
      "image_keyword": "apple"
    }
  ]
}`

        console.log(`Generating lesson for user ${user.id} with prompt length ${prompt.length}`)

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 4096,
                        responseMimeType: 'application/json',
                    },
                }),
            }
        )

        if (!geminiRes.ok) {
            const errorText = await geminiRes.text()
            throw new Error(`Gemini API Error (${geminiRes.status}): ${errorText}`)
        }

        const geminiData = await geminiRes.json()
        let content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

        if (!content) {
            throw new Error('Gemini returned an empty response')
        }

        // Clean markdown if present (fixes common AI JSON formatting issues)
        if (content.includes('```')) {
            content = content.replace(/```json/g, '').replace(/```/g, '').trim()
        }

        let lessonJson
        try {
            lessonJson = JSON.parse(content)
        } catch (e) {
            console.error('JSON Parse Error. Content:', content)
            throw new Error('Failed to parse AI response as JSON')
        }

        // 6. Save to cache (async, non-blocking) — skip for ELI5 and placement tests
        if (!isPlacementTest && !isEli5 && supabaseAdmin && category && difficulty && lessonJson.title) {
            const questionTypes = [...new Set((lessonJson.questions || []).map((q) => q.type || 'multiple_choice'))]
            const tags = (category || '').split('/').map((p) => p.toLowerCase().trim())

            supabaseAdmin.from('lesson_cache').upsert({
                category: category,
                difficulty: difficulty || 'beginner',
                language: contentLang,
                title: lessonJson.title,
                theory: lessonJson.theory || null,
                questions: lessonJson.questions || [],
                question_count: lessonJson.questions?.length || 0,
                question_types: questionTypes,
                tags: tags,
                is_ai_generated: true,
                model_used: 'gemini-2.0-flash',
                quality_score: 0.8,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'category,difficulty,language,title',
            }).then(({ error: cacheError }) => {
                if (cacheError) {
                    console.warn('Cache write failed:', cacheError.message)
                } else {
                    console.log(`💾 Cached: "${lessonJson.title}" (${category}/${difficulty}/${contentLang})`)
                }
            })
        }

        // Success response
        return new Response(
            JSON.stringify({ lesson: lessonJson, fromCache: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Function Error:', error.message)
        // Return proper HTTP error status codes for monitoring and client error handling
        const statusCode = error.message?.includes('Unauthorized') ? 401
            : error.message?.includes('Missing') ? 400
                : 500;
        return new Response(
            JSON.stringify({ error: statusCode === 500 ? 'Internal server error' : error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: statusCode }
        )
    }
})
