const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS - mamela requests avy frontend
app.use(cors());
app.use(express.json());

// Root endpoint - test raha miasa
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server running!',
    message: 'Mijoro Backend API',
    endpoints: {
      chat: 'POST /api/chat'
    }
  });
});

// Chat endpoint - miantso Hugging Face
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  // Validation
  if (!message) {
    return res.status(400).json({ 
      error: 'Message ilaina' 
    });
  }

  // Check API key
  if (!process.env.HUGGINGFACE_API_KEY) {
    return res.status(500).json({ 
      error: 'API key tsy misy' 
    });
  }

  try {
    console.log('Mandefa any Hugging Face:', message);

    // Miantso Hugging Face API
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: message,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            top_p: 0.95
          },
          options: {
            wait_for_model: true,
            use_cache: false
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF Error:', errorText);
      throw new Error(`Hugging Face error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Valiny avy HF:', data);

    // Extract reply
    let reply;
    if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text;
    } else if (data.error) {
      reply = 'Model mbola mi-load. Andramo indray afa-kelikely.';
    } else {
      reply = 'Tsy nahita valiny';
    }

    res.json({ 
      message: reply,
      success: true 
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Misy olana tamin\'ny server',
      details: error.message 
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Export for serverless
module.exports = app;
