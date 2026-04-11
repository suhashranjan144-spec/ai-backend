import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";

// 🔥 SIMPLE DB FUNCTION
function searchDatabase(symptoms) {
  let medicines = [];

  const map = {
    fever: ["paracetamol"],
    headache: ["brufen"],
    anxiety: ["ignatia", "aconite"],
    "night sweats": ["silicea"],
  };

  symptoms.forEach((sym) => {
    const key = sym.toLowerCase();
    if (map[key]) {
      medicines.push(...map[key]);
    }
  });

  return {
    medicines: [...new Set(medicines)],
  };
}

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    // 🔥 STEP 1: GEMINI FIRST (70%)
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

Extract symptoms and suggest possible medicines.

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

    let aiResponse;

    try {
      aiResponse = JSON.parse(clean);
    } catch {
      return res.json({
        source: "gemini_raw",
        result: clean,
      });
    }

    // 🔥 STEP 2: HYBRID LOGIC (30% DB SUPPORT)

    let finalMedicines = aiResponse.medicines || [];

    // 👉 अगर AI ने medicine नहीं दिया → DB से लो
    if (!finalMedicines || finalMedicines.length === 0) {
      const dbResult = searchDatabase(aiResponse.symptoms || []);

      return res.json({
        source: "ai+database",
        symptoms: aiResponse.symptoms || [],
        medicines: dbResult.medicines,
      });
    }

    // 👉 अगर AI ने दिया → DB से enhance करो (optional)
    const dbResult = searchDatabase(aiResponse.symptoms || []);

    finalMedicines = [
      ...new Set([...finalMedicines, ...dbResult.medicines]),
    ];

    // 🔥 FINAL RESPONSE
    return res.json({
      source: "gemini+database",
      symptoms: aiResponse.symptoms || [],
      medicines: finalMedicines,
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
