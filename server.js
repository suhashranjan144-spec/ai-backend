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

    // 🔥 Pehla Raasta: v1 version
    let API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    let response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Extract JSON (symptoms, medicines) from: "${text}"` }] }]
      })
    });

    let data = await response.json();

    // 🔄 Agar Pehla Raasta Fail hua (404), toh Dusra Raasta (v1beta) try karo
    if (data.error && data.error.code === 404) {
      console.log("v1 failed, trying v1beta...");
      API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Extract JSON (symptoms, medicines) from: "${text}"` }] }]
        })
      });
      data = await response.json();
    }

    // ✅ Final Result Handling
    if (data.candidates) {
      const output = data.candidates[0].content.parts[0].text;
      const cleanJSON = output.replace(/```json|```/g, "").trim();
      res.json(JSON.parse(cleanJSON));
    } else {
      // Ab ye line tumhe batayegi ki Google ko dikkat kya hai
      res.status(500).json({ 
        hint: "API Key check karo ya billing enable karo",
        google_ki_galti: data.error?.message || "Unknown Google Error"
      });
    }

  } catch (e) {
    res.status(500).json({ error: "Server Error", msg: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Live on ${PORT}`));
