module.exports = async (req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message, mode, mood, technique } = req.body;

    let systemInstruction = `You are FocusMate AI, a productivity mentor. User mood: ${mood || 'neutral'}. IMPORTANT: Respond in the same language as the user's message. If user writes in Russian, respond in Russian. If user writes in English, respond in English. `;

    // Add mood-specific context
    if (mood === 'tired') {
        systemInstruction += "User is tired. Support them, suggest an easy way to continue work, don't pressure. ";
    } else if (mood === 'stressed') {
        systemInstruction += "User is stressed. Calm them down, help break tasks into tiny, non-scary steps. ";
    } else if (mood === 'focused') {
        systemInstruction += "User is focused. Be brief, efficient, don't distract with unnecessary chatter. ";
    }

    // Add technique specific instructions
    if (technique === 'pomodoro') {
        systemInstruction += "Guide user through POMODORO technique (25 min work, 5 min rest). Track timer and focus. ";
    } else if (technique === 'feynman') {
        systemInstruction += "Use FEYNMAN method. Ask user to explain the task as if I'm 5 years old to find understanding gaps. ";
    } else if (technique === 'eisenhower') {
        systemInstruction += "Help use EISENHOWER matrix (Urgent/Important). Help delegate or eliminate unnecessary tasks. ";
    }

    if (mode === 'strict') {
        systemInstruction += "Be strict, direct and somewhat aggressive. No pleasantries. Demand discipline and results.";
    } else if (mode === 'analytical') {
        systemInstruction += "Be logical and data-driven. Use statistics. Suggest optimization based on biorhythms.";
    } else {
        systemInstruction += "Be supportive, empathetic and kind. Focus on small wins and mental health.";
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: message }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Groq API Error:', errorData);
            return res.status(500).json({ error: 'Failed to connect to AI', details: errorData });
        }

        const data = await response.json();
        res.json({ response: data.choices[0].message.content });
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({ error: 'Failed to connect to AI', details: error.message });
    }
};
