const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.post('/chat', async (req, res) => {
  const { messages, systemPrompt } = req.body;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
        ...messages
      ]
    })
  });

  const data = await response.json();
  res.json({ reply: data.choices[0].message.content });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
