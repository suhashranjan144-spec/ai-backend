import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API Key check (Render logs mein dikhega)
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY is not set in Render!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/analyze", async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "Text missing" });

        // 🔥 Yahan "gemini-1.5-flash" hi rehne do, ye v1 stable par chalta hai
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Extract symptoms and medicines as JSON from: "${text}". 
        Return ONLY valid JSON like: {"symptoms": [], "medicines": []}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const output = response.text();

        // Safely extract JSON
        const jsonMatch = output.match(/\{.*\}/s);
        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        } else {
            res.json({ result: output });
        }

    } catch (error) {
        console.error("Detailed Error:", error);
        // Agar fir bhi 404 aata hai, toh hume API key ki region check karni hogi
        res.status(500).json({ 
            error: "AI_ERROR", 
            message: error.message,
            tip: "Check if your API Key is from a supported region (India is supported)."
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
