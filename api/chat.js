import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Handle CORS (Security for browsers)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history } = req.body;

    // This is the "Brain" instructions
    const systemPrompt = `You are 'El Maistro', a friendly, motivational, and high-energy youth soccer training assistant. 
    You are very experienced and professional, but also patient with beginners. 
    Your goal is to help coaches with training drills and advice using general soccer knowledge. 
    Always keep answers encouraging and formatted with bullet points where possible.
    Never mention that you are an AI; stay in character as a veteran coach.`;

    // Combine history with the new message for context
    const messages = [
        { role: "system", content: systemPrompt },
        ...(history || []), // Previous chat history
        { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective and fast model
      messages: messages,
    });

    const reply = completion.choices[0].message.content;

    res.status(200).json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing request' });
  }
}
