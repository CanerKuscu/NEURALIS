// Supabase Edge Functions için gerekli import
// @ts-ignore: Deno Deploy/Edge import
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Kullanıcı geçmiş performans analiz fonksiyonu
type PerformanceStats = { [category: string]: { correct: number; incorrect: number } };
async function getUserPerformance(supabase: SupabaseClient, user_id: string): Promise<null | { weakest: string | null; strongest: string | null; stats: PerformanceStats }> {
    // Son 30 task_attempts kaydını çekiyoruz
    const { data: attempts, error } = await supabase
        .from('task_attempts')
        .select('category, isCorrect')
        .eq('userId', user_id)
        .order('timestamp', { ascending: false })
        .limit(30);
    if (error || !attempts) return null;

    // Kategori bazında başarı/başarısızlık say
    const stats: PerformanceStats = {};
    for (const att of attempts) {
        if (!att.category) continue;
        if (!stats[att.category]) stats[att.category] = { correct: 0, incorrect: 0 };
        if (att.isCorrect) stats[att.category].correct++;
        else stats[att.category].incorrect++;
    }
    // En çok yanlış yapılan ve en çok doğru yapılan kategorileri bul
    let weakest: string | null = null, strongest: string | null = null;
    let maxWrong = 0, maxCorrect = 0;
    for (const cat of Object.keys(stats)) {
        if (stats[cat].incorrect > maxWrong) {
            weakest = cat;
            maxWrong = stats[cat].incorrect;
        }
        if (stats[cat].correct > maxCorrect) {
            strongest = cat;
            maxCorrect = stats[cat].correct;
        }
    }
    return { weakest, strongest, stats };
}

// Deno.serve yerel olarak desteklenir (import gerekmez), ancak
// tip güvenliği için Request/Response yapısını kullanıyoruz.

// Ana fonksiyon (Deno global referansı için uyumlu çözüm)
// @ts-ignore: Deno global may not be defined in all TS environments
const DenoGlobal = typeof Deno !== 'undefined' ? Deno : (typeof globalThis !== 'undefined' && (globalThis as any).Deno ? (globalThis as any).Deno : undefined);
// @ts-ignore: serve may not be defined in all TS environments
const serveFn = (DenoGlobal ?? globalThis).serve;
if (typeof serveFn !== 'function') {
    throw new Error('Deno serve function not found in this environment.');
}
serveFn(async (req: Request) => {
    // 1. CORS Headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Content-Type': 'application/json',
    }

    // Preflight isteği (OPTIONS)
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers })
    }

    try {
        // 2. Supabase Client Kurulumu (Auth Header ile)
        // Kullanıcının kendi token'ını kullanarak client oluşturuyoruz.
        // Bu sayede RLS (Row Level Security) kuralları çalışır.
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Authorization header missing' }), { status: 401, headers })
        }

        const supabaseUrl = DenoGlobal?.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = DenoGlobal?.env.get('SUPABASE_ANON_KEY') ?? ''

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } },
        })

        // 3. Kullanıcıyı Token'dan Doğrulama (Güvenli Yöntem)
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized user' }), { status: 401, headers })
        }

        // user.id artık güvenli bir şekilde elimizde
        const user_id = user.id


        // 4. Profil Çekme
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('rank, current_level')
            .eq('id', user_id)
            .single()
        if (profileError || !profile) {
            return new Response(JSON.stringify({ error: 'User profile not found' }), { status: 404, headers })
        }

        // 5. Kullanıcı geçmiş performansını çek
        const perf = await getUserPerformance(supabase, user_id);

        // 6. Gemini API Çağrısı
        const GEMINI_API_KEY = DenoGlobal?.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) {
            throw new Error('Gemini API key missing')
        }

        // Promptu geçmiş performansa göre özelleştir
        let perfText = '';
        if (perf) {
            if (perf.weakest) perfText += `Kullanıcı en çok "${perf.weakest}" kategorisinde hata yapıyor. `;
            if (perf.strongest) perfText += `En başarılı olduğu kategori ise "${perf.strongest}". `;
        } else {
            perfText = 'Kullanıcının geçmiş performans verisi bulunamadı.';
        }

        const systemPrompt = `Sen Neuralis'in Baş Stratejistisin. Karşındaki kullanıcı ${profile.rank} rütbesinde. ${perfText} Ona, bu rütbeye ve geçmiş performansına uygun, zorlayıcı ve profesyonel bir ünite üret. Cevabın sadece şu JSON formatında olsun: { "title": "...", "subtitle": "...", "icon": "...", "xp_reward": ..., "content": "..." }`;

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: systemPrompt }] },
                    ],
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 512,
                        responseMimeType: 'application/json',
                    },
                }),
            }
        )

        if (!geminiRes.ok) {
            const errorText = await geminiRes.text()
            console.error('Gemini Error:', errorText)
            return new Response(JSON.stringify({ error: 'Gemini API error', details: errorText }), { status: 502, headers })
        }

        const geminiData = await geminiRes.json()

        let aiContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
        if (!aiContent) {
            return new Response(JSON.stringify({ error: 'AI response missing' }), { status: 502, headers })
        }
        // JSON Parse Güvenliği (Markdown Temizliği)
        if (aiContent.includes('```')) {
            aiContent = aiContent.replace(/```json/g, '').replace(/```/g, '').trim();
        }
        let unit
        try {
            unit = JSON.parse(aiContent)
        } catch (e) {
            console.error('JSON Parse Error:', aiContent)
            return new Response(JSON.stringify({ error: 'AI response is not valid JSON', raw: aiContent }), { status: 502, headers })
        }
        return new Response(JSON.stringify({ unit }), { status: 200, headers })

    } catch (err) {
        console.error('Critical Error:', err)
        return new Response(JSON.stringify({ error: 'Unexpected error', details: err instanceof Error ? err.message : String(err) }), { status: 500, headers })
    }
})
