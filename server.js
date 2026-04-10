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
    const apiKey = process.env.GEMINI_API_KEY;

    // 🔥 Ekdum Standard Stable URL
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Extract symptoms and medicines from this text as JSON: "${text}". 
            Format: {"symptoms": [], "medicines": []}`
          }]
        }]
      })
    });

    const data = await response.json();

    // Agar Google ne response diya toh yahan handle hoga
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const aiText = data.candidates[0].content.parts[0].text;
      
      // JSON Clean-up (Markdown hatao agar ho toh)
      const cleanJSON = aiText.replace(/```json|```/g, "").trim();
      
      try {
        res.json(JSON.parse(cleanJSON));
      } catch (e) {
        res.json({ result: cleanJSON });
      }
    } else {
      // Isse hume pata chalega asli error kya hai (API key ya Billing)
      res.status(500).json({ 
        error: "Google API Issue", 
        message: data.error?.message || "Check your API key status",
        full_debug: data 
      });
    }

  } catch (error) {
    res.status(500).json({ error: "Server Error", msg: error.message });
  }
});

// Render apne aap port 10000 use karega, hum 3000 likh sakte hain
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
