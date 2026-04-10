import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Google AI Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text field is required" });
    }

    // Model select karein (SDK automatically versioning handle karta hai)
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Extract symptoms and medicines as JSON from this text: "${text}". 
    Format: {"symptoms": [], "medicines": []}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const outputText = response.text();

    // JSON Parse karke bhejein
    try {
      const jsonResponse = JSON.parse(outputText);
      res.json(jsonResponse);
    } catch (parseError) {
      res.json({ result: outputText });
    }

  } catch (error) {
    console.error("Error details:", error);
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
