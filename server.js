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
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are a medical assistant.

Extract symptoms and medicines from the following text.

Text: ${text}

Strictly return JSON like this:
{
  "symptoms": ["..."],
  "medicines": ["..."]
}

Do not return anything else.
`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const output =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI";

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
