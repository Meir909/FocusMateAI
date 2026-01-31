const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

app.post('/api/chat', async (req, res) => {
    const { message, mode, mood, technique } = req.body;

    let systemInstruction = `Ты FocusMate AI, наставник по продуктивности. Пользователь чувствует себя: ${mood || 'нейтрально'}. Обязательно отвечай ТОЛЬКО на русском языке. `;

    // Add mood-specific context
    if (mood === 'tired') {
        systemInstruction += "Пользователь устал. Поддержи его, предложи легкий способ продолжить работу, не дави. ";
    } else if (mood === 'stressed') {
        systemInstruction += "Пользователь в стрессе. Успокой его, помоги разбить задачи на крошечные, нестрашные шаги. ";
    } else if (mood === 'focused') {
        systemInstruction += "Пользователь сосредоточен. Будь краток, эффективен, не отвлекай лишней болтовней. ";
    }

    // Add technique specific instructions
    if (technique === 'pomodoro') {
        systemInstruction += "Веди пользователя по технике ПОМОДОРО (25 мин работы, 5 мин отдыха). Следи за таймером и фокусом. ";
    } else if (technique === 'feynman') {
        systemInstruction += "Используй метод ФЕЙНМАНА. Попроси пользователя объяснить задачу так, будто тебе 5 лет, чтобы найти пробелы в понимании. ";
    } else if (technique === 'eisenhower') {
        systemInstruction += "Помоги использовать матрицу ЭЙЗЕНХАУЭРА (Срочно/Важно). Помоги делегировать или убрать лишнее. ";
    }

    if (mode === 'strict') {
        systemInstruction += "Будь строгим, прямым и немного агрессивным. Никаких любезностей. Требуй дисциплины и результата.";
    } else if (mode === 'analytical') {
        systemInstruction += "Будь логичным и опирайся на данные. Используй статистику. Предлагай оптимизацию на основе биоритмов.";
    } else {
        systemInstruction += "Будь поддерживающим, эмпатичным и добрым. Фокусируйся на маленьких победах и ментальном здоровье.";
    }

    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile', // Groq's model name
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: message }
            ],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ response: response.data.choices[0].message.content });
    } catch (error) {
        console.error('API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to connect to AI', details: error.message });
    }
});

app.post('/api/email', async (req, res) => {
    const { email, subject, message } = req.body;
    console.log(`[EMAIL SIMULATOR] To: ${email} | Subject: ${subject} | Msg: ${message}`);
    // Here you would normally use nodemailer to send a real email
    res.json({ status: 'sent', message: 'Email logic simulated on server' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
