module.exports = async function (req, res) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "GEMINI_API_KEY is missing on server" });
        }

        const text = String((req.body && req.body.text) || "").slice(0, 200);

        const prompt =
            `A student in Pakistan said this about an expense in PKR (may be in English, Urdu script, or Roman Urdu): "${text}". ` +
            `Speech recognition may mishear local food, transport, or place names (for example "biryani", "karahi", "chai", "paratha", "rickshaw", "indrive", "yango", "bykea", "teen sau pachas" = 350, "do sau" = 200). ` +
            `Use phonetic similarity and context to fix misheard words. ` +
            `Return ONLY valid JSON with keys: "amount" (number in PKR or null), "category" (strictly "Food", "Transport", or "Other"), and "note" (short 1-4 word description without the amount, in English or Roman Urdu).`;

        const models = ["gemini-3.5-flash-lite", "gemini-4-hydrogen"];

        for (const model of models) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;

            const response = await fetch(url, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0,
                        maxOutputTokens: 200,
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: "OBJECT",
                            properties: {
                                amount: { type: "NUMBER", nullable: true },
                                category: { type: "STRING", enum: ["Food", "Transport", "Other"] },
                                note: { type: "STRING" }
                            },
                            required: ["amount", "category", "note"]
                        }
                    }
                })
            });

            const data = await response.json();

            if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return res.status(200).json({ result: data.candidates[0].content.parts[0].text });
            }

            if (response.status !== 429) {
                return res.status(response.status).json({
                    error: (data.error && data.error.message) || "Gemini API error"
                });
            }
        }

        return res.status(429).json({ error: "All free Gemini models rate-limited" });
    } catch (e) {
        console.error("categorize error:", e);
        res.status(500).json({ error: e.message || "failed" });
    }
};