import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Google AI Setup
// Render dashboard mein GEMINI_API_KEY zaroor check kar lena
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text field is required" });
    }

    // 🔥 MODEL NAME CHANGED TO gemini-1.5-flash (Ye 404 nahi dega)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a medical assistant. Extract symptoms and medicines from the following text and return ONLY a valid JSON object.
    
    Text: "${text}"
    
    JSON Format:
    {
      "symptoms": [],
      "medicines": []
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const outputText = response.text();

    // Clean JSON parsing: Kuch models markdown (```json) ke sath bhejte hain, use saaf karte hain
    const cleanJSON = outputText.replace(/```json|```/g, "").trim();
    
    try {
      const jsonResponse = JSON.parse(cleanJSON);
      res.json(jsonResponse);
    } catch (parseError) {
      res.json({ result: cleanJSON });
    }

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ 
      error: "AI Response failed", 
      message: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
