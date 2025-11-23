// This code runs securely on the Vercel server, keeping your API key hidden.
const OpenAI = require('openai');

// Initialize the OpenAI client using the secret key stored in Vercel's environment variables
// Vercel will automatically find the OPENAI_API_KEY environment variable.
const openai = new OpenAI();

// The main function that handles requests from your Shopify widget
module.exports = async (req, res) => {
    
    // ***********************************************
    // FIX: ADD CORS HEADERS TO ALLOW SHOPIFY ACCESS
    // This resolves the "couldn't connect to server" error.
    // ***********************************************
    // This allows requests from ANY website (your Shopify domain)
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle CORS pre-flight request (a check browsers do before the real request)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    // ***********************************************

    // 1. Security Check: Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        // 2. Get the user's message from the request body
        const { message } = req.body;
        
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
        console.error('OpenAI API Error:', error);
        res.status(500).json({ reply: "Sorry, I ran into an issue finding that program. Please check the server logs." });
    }
};
