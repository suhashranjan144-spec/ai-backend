import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const apiKey = process.env.GEMINI_API_KEY;

    // 🔥 Force Stable v1 URL - Ye sabse latest aur stable endpoint hai
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ 
            text: `Extract symptoms and medicines as JSON from: "${text}". 
            Format strictly as: {"symptoms": [], "medicines": []}. 
            Return ONLY the JSON, no extra text.` 
          }] 
        }]
      })
    });

    const data = await response.json();

    // Check if Gemini returned a valid response
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const output = data.candidates[0].content.parts[0].text;
      
      // AI kabhi-kabhi markdown bhejta hai, use saaf karte hain
      const cleanJSON = output.replace(/```json|```/g, "").trim();
      
      try {
        res.json(JSON.parse(cleanJSON));
      } catch (parseError) {
        // Agar JSON parse fail ho jaye toh raw text bhej do
        res.json({ result: cleanJSON });
      }
    } else {
      // Agar yahan error aaya toh samajh lo API Key ya Google side ka issue hai
      res.status(500).json({ 
        msg: "Google API Reject ho gayi",
        details: data.error?.message || "Check your API Key and Project Settings",
        full_debug: data 
      });
    }

  } catch (e) {
    res.status(500).json({ error: "Server Internal Error", msg: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Final Server is Live on Port ${PORT}`);
});
