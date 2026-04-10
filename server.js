import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API Key check karne ke liye log
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ API Key missing in Environment Variables!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    // Yaha hum "gemini-1.5-flash" use kar rahe hain jo sabse latest hai
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Extract symptoms and medicines as JSON: "${text}". 
    Format: {"symptoms": [], "medicines": []}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text();

    // Clean JSON parsing
    const cleanJSON = output.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(cleanJSON));

  } catch (error) {
    console.error("Detailed Error:", error);
    res.status(500).json({ 
      error: "Backend Error", 
      message: error.message,
      suggestion: "Check if your API Key is active and supports Gemini 1.5 Flash"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
