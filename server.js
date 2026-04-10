import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "@google/generative-ai";

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

    // ✅ FIXED MODEL
    const model = genAI.getGenerativeModel({
   const { GoogleGenerativeAI } = pkg;
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
    const output = result.response.text();

    // 🔥 clean JSON (important)
    const cleaned = output
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let json;
    try {
      json = JSON.parse(cleaned);
    } catch (e) {
      return res.json({
        symptoms: [],
        medicines: [],
        raw: output,
      });
    }

    res.json(json);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 🔥 server start
app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
