import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Gemini init
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🔥 API
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    console.log("🔥 Request aaya:", text);

    // ✅ FINAL WORKING MODEL
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
You are a medical assistant.

Extract:
1. Symptoms
2. Medicines

Text: "${text}"

Return ONLY JSON:
{
  "symptoms": [],
  "medicines": []
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text();

    console.log("🔥 Raw output:", output);

    // 🔥 clean JSON
    const cleaned = output
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let json;
    try {
      json = JSON.parse(cleaned);
    } catch {
      return res.json({
        symptoms: [],
        medicines: [],
        raw: output,
      });
    }

    res.json(json);

  } catch (e) {
    console.error("❌ ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

// ✅ Render ke liye PORT fix
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
