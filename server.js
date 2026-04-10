import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Google AI Setup
// GEMINI_API_KEY environment variable check karein Render par
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text field is required" });
    }

    // "gemini-1.5-flash" ki jagah "gemini-pro" use karke dekhte hain 
    // kyunki aapke region/account mein flash shayad v1beta par available nahi hai
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

    // Clean JSON parsing: Kabhi-kabhi AI markdown (```json) bhej deta hai
    const cleanJSON = outputText.replace(/```json|```/g, "").trim();
    
    try {
      const jsonResponse = JSON.parse(cleanJSON);
      res.json(jsonResponse);
    } catch (parseError) {
      // Agar parse fail hua toh raw text bhej do debug ke liye
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
