import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    // 🔥 STEP 1: FAKE DB LOGIC (replace later with real DB)
    const dbSymptoms = [];
    const dbMedicines = [];

    if (text.includes("bukhar")) {
      dbSymptoms.push("fever");
      dbMedicines.push("paracetamol");
    }

    // 👉 DB confidence
    if (dbSymptoms.length > 0) {
      return res.json({
        source: "database",
        symptoms: dbSymptoms,
        medicines: dbMedicines,
      });
    }

    // 🔥 STEP 2: GEMINI FALLBACK
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

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
                text: `
You are a medical assistant.

Extract symptoms and medicines from the following text.

Text: ${text}

Return strictly JSON:
{
  "symptoms": [],
  "medicines": []
}
                `,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200,
        },
      }),
    });

    const data = await response.json();

    const aiText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const clean = aiText.replace(/```json|```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(clean);
    } catch {
      return res.json({
        source: "gemini_raw",
        result: clean,
      });
    }

    res.json({
      source: "gemini",
      ...parsed,
    });

  } catch (error) {
    res.status(500).json({
      error: "Server Error",
      msg: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
