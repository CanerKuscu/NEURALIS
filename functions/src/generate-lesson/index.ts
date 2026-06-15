// Supabase Edge Function: generate-lesson
// File: functions/src/generate-lesson/index.ts
import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

app.post("/", async (req, res) => {
    try {
        // Parse request body
        const { topic, userId } = req.body;
        if (!topic || !userId) {
            return res.status(400).json({ error: "Missing topic or userId" });
        }

        // Prepare Gemini API call
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Missing Gemini API key" });
        }

        const systemPrompt = "You are a teacher. Output JSON only. Create a lesson about the topic. Structure: { title, theory, questions: [] }.";
        const userPrompt = topic;

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        responseMimeType: "application/json",
                    },
                }),
            }
        );

        if (!geminiRes.ok) {
            const errorText = await geminiRes.text();
            return res.status(502).json({ error: "Gemini API error", details: errorText });
        }

        const geminiData = await geminiRes.json();
        const lessonContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!lessonContent) {
            return res.status(500).json({ error: "No lesson content returned from Gemini" });
        }

        let lessonJson;
        try {
            lessonJson = JSON.parse(lessonContent);
        } catch (e) {
            return res.status(500).json({ error: "Gemini did not return valid JSON", details: lessonContent });
        }

        // Insert into Supabase
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            return res.status(500).json({ error: "Missing Supabase env vars" });
        }
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase.from("custom_lessons").insert({
            user_id: userId,
            topic,
            content: lessonJson,
        });
        if (error) {
            return res.status(500).json({ error: "Database insert error", details: error.message });
        }

        // Return lesson JSON
        return res.status(200).json(lessonJson);
    } catch (err) {
        const errorMessage = (err instanceof Error) ? err.message : String(err);
        return res.status(500).json({ error: "Unexpected error", details: errorMessage });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
