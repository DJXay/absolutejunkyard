import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// This is the "Gatekeeper" function for your AI moderation
export const handler = async (event: any) => {
  // Enforce POST requests only
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // 1. Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // 2. Initialize Google AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 3. Get the content to moderate from the request body
    const { content } = JSON.parse(event.body || '{}');

    if (!content) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No content provided' }),
      };
    }

    // 4. Ask AI to check the content
    const prompt = `Analyze the following text for offensive language, hate speech, or spam. Return "REJECTED" if it's inappropriate, otherwise return "APPROVED". Content: ${content}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const decision = response.text().trim();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    };

  } catch (error: any) {
    console.error('Moderation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};