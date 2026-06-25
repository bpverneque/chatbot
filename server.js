const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static('.'));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Rate limiting: máximo de requisições por IP por janela de tempo
const rateLimitMap = new Map();
const WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 10;      // máximo 10 mensagens por minuto por IP

function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, start: now };

  if (now - record.start > WINDOW_MS) {
    record.count = 1;
    record.start = now;
  } else {
    record.count++;
  }

  rateLimitMap.set(ip, record);

  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({ reply: 'Muitas mensagens em pouco tempo. Aguarde um momento.' });
  }

  next();
}

app.post('/chat', rateLimit, async (req, res) => {
  const { messages, systemPrompt } = req.body;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',         // mais barato para chatbot
      max_tokens: 1024,
      system: systemPrompt || 'You are a helpful assistant.',
      messages: messages
    });

    res.json({ reply: response.content[0].text });
  } catch (error) {
    console.error('Anthropic error:', error.message);
    res.status(500).json({ reply: 'Erro ao conectar com a IA. Tente novamente.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
