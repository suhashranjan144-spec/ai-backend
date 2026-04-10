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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        // 🔥 YAHI CHANGE KIYA HAI (BODY)
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are a medical assistant.

Extract symptoms and medicines from the text below.

Text: ${text}

Return response strictly in JSON format like:
{
  "symptoms": ["..."],
  "medicines": ["..."]
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
      }
    );

    const data = await response.json();

    // 🔥 SAFE OUTPUT HANDLING
    let output = "No response from AI";

    if (data.candidates && data.candidates.length > 0) {
      output = data.candidates[0].content.parts[0].text;
    }

    res.json({ result: output });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
