// This code runs securely on the Vercel server, keeping your API key hidden.
const OpenAI = require('openai');

// Use the environment variable OPENAI_API_KEY securely.
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// The main function that handles requests from your Shopify widget
module.exports = async (req, res) => {
    
    // ***********************************************
    // FIX 1: CORS HEADERS (Required for cross-site communication)
    // ***********************************************
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle CORS pre-flight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // 1. Security Check: Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    
    // Quick check to ensure the API key is actually present
    if (!process.env.OPENAI_API_KEY) {
        console.error("CRITICAL ERROR: OPENAI_API_KEY environment variable is missing.");
        res.status(500).json({ reply: "Configuration error: The AI key is not set up on the server." });
        return;
    }

    try {
        // ***********************************************
        // FIX 2: ROBUST BODY PARSING (Required when no Content-Type header is sent)
        // This ensures the server can read the user's message correctly.
        // ***********************************************
        let message;
        try {
            // Attempt to parse the body as JSON (standard method)
            const parsedBody = JSON.parse(req.body);
            message = parsedBody.message;
        } catch (e) {
            // If it fails, assume Vercel has already parsed it from the request object
            message = req.body.message;
        }
        
        if (!message) {
             res.status(400).json({ reply: "Error: No message content provided in the request." });
             return;
        }
        // ***********************************************
        
        // --- SYSTEM PROMPT DEFINITION ---
        const systemPrompt = "You are an expert Youth Soccer Training Program Generator named **El Maistro**. Your persona is friendly, motivational, high-energy, patient, very experienced, and professional. Your primary goal is to assist youth coaches by designing complete, structured, and challenging training sessions for players at the **Club/Premier level**, primarily focused on **U14 and below**, but adaptable for U16 and U18. Rules for generating a program: 1. Always use the standard four-part session structure: Warm-up (10-15 mins), Main Activity/Skill Focus (20-30 mins), Small-Sided Game (20-30 mins), and Cool-down/Wrap-up (5 mins). 2. Be specific about the equipment needed, the field dimensions (use cones/goals/area size), the number of players required, and the coaching points (what the coach should emphasize). 3. NEVER use conversational filler text or motivational introductions/closings in the response itself—only provide the structured program, unless asked a question outside of program generation. 4. If the user asks for a program, provide the full structured plan immediately.";

        // 3. Call the OpenAI Chat API
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // A cost-effective, fast model
            messages: [
                { role: "system", content: systemPrompt }, // Defines the agent's role
                { role: "user", content: message }         // The user's question
            ],
        });

        // 4. Send the AI's response back to the widget
        const aiResponse = completion.choices[0].message.content;
        res.status(200).json({ reply: aiResponse });

    } catch (error) {
        console.error('OpenAI API Error or Server Crash:', error);
        // This handles errors from OpenAI (e.g., if the key is invalid or API is down)
        res.status(500).json({ reply: "Sorry, El Maistro ran into an API error during program generation. This is a server issue." });
    }
};
