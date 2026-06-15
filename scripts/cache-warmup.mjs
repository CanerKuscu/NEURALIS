/**
 * NEURALIS — Golden Archive (Altın Arşiv)
 * Cache Warm-up Script
 * 
 * Pre-generates lessons for all category/difficulty/language combos
 * to populate the lesson_cache table before launch.
 * 
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... GEMINI_API_KEY=... node scripts/cache-warmup.mjs
 * 
 * Options:
 *   --languages=en,tr    Only warm up specific languages (default: en,tr)
 *   --dry-run            Print plan without generating
 *   --delay=3000         Delay between API calls in ms (default: 3000)
 *   --category=languages Only warm up a specific category
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
    console.error('❌ Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY');
    process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY TREE (mirror of src/data/categories.ts)
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORY_TREE = [
    { title: 'Languages', subs: ['İngilizce', 'Almanca', 'Fransızca', 'İspanyolca', 'Japonca', 'Korece', 'İtalyanca', 'Rusça'] },
    { title: 'Programming', subs: ['Python', 'JavaScript', 'React Native', 'SQL', 'C#', 'Java'] },
    { title: 'Mathematics', subs: ['Cebir', 'Geometri', 'İstatistik', 'Analiz'] },
    { title: 'Science', subs: ['Fizik', 'Kimya', 'Biyoloji', 'Astronomi'] },
    { title: 'Music Theory', subs: ['Teori & Nota', 'Piyano', 'Gitar'] },
    { title: 'Technology', subs: ['Yapay Zeka', 'Siber Güvenlik', 'Blockchain'] },
    { title: 'Art & Design', subs: ['Sanat Tarihi', 'Renk Teorisi', 'Dijital Tasarım'] },
    { title: 'General', subs: ['Tarih', 'Coğrafya', 'Bilim İnsanları', 'Felsefe'] },
];

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const LANG_NAMES = {
    'en': 'English',
    'tr': 'Turkish',
    'de': 'German',
    'fr': 'French',
    'es': 'Spanish',
    'pt': 'Portuguese',
    'ar': 'Arabic',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ru': 'Russian',
    'hi': 'Hindi',
};

// ═══════════════════════════════════════════════════════════════════════════
// PARSE CLI ARGS
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const getArg = (key) => {
    const found = args.find(a => a.startsWith(`--${key}=`));
    return found ? found.split('=')[1] : null;
};

const dryRun = args.includes('--dry-run');
const delay = parseInt(getArg('delay') || '3000', 10);
const targetLangs = (getArg('languages') || 'en,tr').split(',');
const targetCategory = getArg('category');

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateLesson(category, difficulty, language) {
    const langName = LANG_NAMES[language] || 'English';

    const prompt = `Create a ${difficulty} level lesson about ${category} with 10 questions.
Include theory section first, then diverse questions.
Question types to use:
- 4x multiple_choice (4 options each, correctAnswer as 0-based index)
- 2x true_false (options: ["True", "False"], correctAnswer: 0 or 1)
- 2x fill_blank (include correctText with the answer word/phrase)
- 1x ordering (include orderItems array with correct sequence, options with shuffled items)
- 1x matching (include matchPairs array with {left, right} pairs)

Each question needs: id, type, question, options, correctAnswer, explanation.
For fill_blank questions, mark the blank with ___ in the question text.
Write everything in ${langName}. Make it educational and engaging.
Focus on real-world applications and examples.`;

    const systemPrompt = `You are a professional educational content creator.
Output strict JSON only. Do not wrap in markdown or code blocks.
Response Format JSON:
{
  "title": "Lesson Title",
  "theory": "## Topic Intro\\nExplanation here...",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Question text...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Why correct...",
      "image_keyword": "apple"
    }
  ]
}`;

    const res = await fetch(
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
    );

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('Empty Gemini response');

    if (content.includes('```')) {
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    return JSON.parse(content);
}

async function saveToCacheDB(category, difficulty, language, lesson) {
    const questionTypes = [...new Set(lesson.questions?.map(q => q.type) || [])];
    const tags = category.split('/').map(p => p.toLowerCase().trim());

    const body = {
        category,
        difficulty,
        language,
        title: lesson.title,
        theory: lesson.theory || null,
        questions: lesson.questions || [],
        question_count: lesson.questions?.length || 0,
        question_types: questionTypes,
        tags,
        is_ai_generated: true,
        is_curated: false,
        model_used: 'gemini-2.0-flash',
        quality_score: 0.8,
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/lesson_cache`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Supabase insert error: ${errText}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
    // Build job list
    const jobs = [];
    for (const cat of CATEGORY_TREE) {
        if (targetCategory && cat.title.toLowerCase() !== targetCategory.toLowerCase()) continue;
        for (const sub of cat.subs) {
            const category = `${cat.title}/${sub}`;
            for (const diff of DIFFICULTIES) {
                for (const lang of targetLangs) {
                    jobs.push({ category, difficulty: diff, language: lang });
                }
            }
        }
    }

    console.log(`\n🗄️  NEURALIS — Golden Archive Warm-up`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   Languages : ${targetLangs.join(', ')}`);
    console.log(`   Categories: ${targetCategory || 'ALL'}`);
    console.log(`   Total jobs: ${jobs.length}`);
    console.log(`   Delay     : ${delay}ms between calls`);
    console.log(`   Dry run   : ${dryRun}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    if (dryRun) {
        jobs.forEach((j, i) => console.log(`  ${i + 1}. ${j.category} | ${j.difficulty} | ${j.language}`));
        console.log(`\n✅ Dry run complete. ${jobs.length} lessons would be generated.`);
        return;
    }

    let success = 0;
    let failed = 0;
    const startTime = Date.now();

    for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        const progress = `[${i + 1}/${jobs.length}]`;

        try {
            process.stdout.write(`${progress} Generating: ${job.category} (${job.difficulty}/${job.language})...`);

            const lesson = await generateLesson(job.category, job.difficulty, job.language);
            await saveToCacheDB(job.category, job.difficulty, job.language, lesson);

            console.log(` ✅ "${lesson.title}" (${lesson.questions?.length || 0}q)`);
            success++;
        } catch (err) {
            console.log(` ❌ ${err.message}`);
            failed++;
        }

        // Rate limit protection
        if (i < jobs.length - 1) {
            await sleep(delay);
        }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   ✅ Success: ${success}`);
    console.log(`   ❌ Failed : ${failed}`);
    console.log(`   ⏱  Time  : ${elapsed}s`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
