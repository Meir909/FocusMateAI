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

    const { email, subject, message } = req.body;
    console.log(`[EMAIL SIMULATOR] To: ${email} | Subject: ${subject} | Msg: ${message}`);
    
    // Here you would normally use nodemailer to send a real email
    res.json({ status: 'sent', message: 'Email logic simulated on server' });
};
