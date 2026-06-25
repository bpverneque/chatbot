const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static('.'));

app.post('/chat', (req, res) => {
  const { messages, systemPrompt } = req.body;

  const body = JSON.stringify({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
      ...messages
    ]
  });

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      const parsed = JSON.parse(data);
      res.json({ reply: parsed.choices[0].message.content });
    });
  });

  request.on('error', (e) => {
    res.status(500).json({ error: e.message });
  });

  request.write(body);
  request.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
