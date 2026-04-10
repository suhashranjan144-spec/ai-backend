import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai"; // ✅ DIRECT IMPORT

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // ✅ WORKING MODEL
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
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ✅ IMPORTANT (Render ke liye)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
