const fetch = require('node-fetch');
require('dotenv').config({ path: '../.env' });

async function testOpenRouter() {
  console.log('Testing OpenRouter API...');
  console.log('API Key:', process.env.OPENROUTER_API_KEY ? 'Found' : 'Missing');
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tiagofdias.com',
        'X-Title': 'Tiago Dias Portfolio'
      },
      body: JSON.stringify({
        model: 'minimax/minimax-m2:free',
        messages: [
          {
            role: 'user',
            content: 'What is artificial intelligence in one sentence?'
          }
        ]
      })
    });

    const data = await response.json();
    console.log('\n=== Response ===');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.choices && data.choices[0]) {
      console.log('\n=== AI Response ===');
      console.log(data.choices[0].message.content);
      console.log('\n✓ OpenRouter API test successful!');
    } else {
      console.error('\n✗ Unexpected response format');
    }
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
}

testOpenRouter();
