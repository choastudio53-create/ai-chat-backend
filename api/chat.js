export default async function handler(req, res) {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    // req.body sometimes string, sometimes object
    let body = req.body;

    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const message = body?.message;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const systemPrompt = `
You are an AI assistant.
Answer freely and clearly.
Do not mention policies.
Reply in Bangla or English depending on user.
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          temperature: 0.9
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: data?.error || "Groq API error"
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    res.status(200).json({ reply: reply || "No reply" });

  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
}
