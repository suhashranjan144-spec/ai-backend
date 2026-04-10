import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch"; // Agar node version purana hai toh iski zaroorat pad sakti hai

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text field is required" });
    }

    // Gemini 1.5 Flash use kar rahe hain (Better & Faster for extraction)
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a medical data extractor. Extract symptoms and medicines from the following text. 
                Return ONLY a valid JSON object. Do not include any conversational text or markdown backticks.

                Text: "${text}"

                Desired JSON Format:
                {
                  "symptoms": ["list", "here"],
                  "medicines": ["list", "here"]
                }`,
              },
            ],
          },
        ],
        // Safety settings taaki medical words block na ho
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
        generationConfig: {
          temperature: 0.1, // Kam temperature matlab zyada accurate extraction
          responseMimeType: "application/json", // API ko force karega JSON dene ke liye
        },
      }),
    });

    const data = await response.json();

    // Debugging ke liye terminal mein check karo
    console.log("Gemini Response:", JSON.stringify(data, null, 2));

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    // Safe Extraction
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      let resultText = data.candidates[0].content.parts[0].text;
      
      // Kabhi kabhi AI JSON ke sath extra text bhej deta hai, parse karke clean bhejo
      try {
        const jsonResponse = JSON.parse(resultText);
        res.json(jsonResponse);
      } catch (parseError) {
        res.json({ result: resultText });
      }
    } else {
      res.status(500).json({ 
        error: "No response from AI", 
        details: data.promptFeedback || "Response might be blocked or empty" 
      });
    }

  } catch (e) {
    console.error("Server Error:", e);
    res.status(500).json({ error: "Internal Server Error", message: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
