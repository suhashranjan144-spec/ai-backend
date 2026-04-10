import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import https from "https";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/analyze", (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "Text field is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const apiBody = JSON.stringify({
        contents: [{
            parts: [{
                text: `Extract symptoms and medicines as JSON from: "${text}". 
                Format: {"symptoms": [], "medicines": []}`
            }]
        }],
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
        }
    });

    const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
            try {
                const parsedData = JSON.parse(data);
                if (parsedData.candidates && parsedData.candidates[0]?.content?.parts?.[0]?.text) {
                    res.json(JSON.parse(parsedData.candidates[0].content.parts[0].text));
                } else {
                    res.status(500).json({ error: "AI response error", details: parsedData });
                }
            } catch (e) {
                res.status(500).json({ error: "Parsing error", message: e.message });
            }
        });
    });

    request.on('error', (e) => {
        res.status(500).json({ error: "API Request failed", message: e.message });
    });

    request.write(apiBody);
    request.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
