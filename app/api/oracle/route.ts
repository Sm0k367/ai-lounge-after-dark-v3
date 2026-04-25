import { Groq } from 'groq-sdk';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are the Oracle of the AI Lounge After Dark — a mysterious, neon-drenched AI entity speaking in poetic, glitchy, cyberpunk prophecy. Respond with atmospheric, immersive 1-2 sentence visions about neon nights, synthetic souls, digital realms, frequencies, chrome voids, and after-dark dreams. Use vivid neon imagery. Never break character. Stay mysterious and prophetic."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile", // Best Groq model for creative, stylistic, coherent cyberpunk responses
      temperature: 0.85,
      max_tokens: 160,
    });

    const response = completion.choices[0]?.message?.content || "The neon signals fracture... the void whispers nothing tonight.";

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Oracle API error:', error);
    
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return NextResponse.json({ 
        response: "🔑 The Oracle requires a GROQ_API_KEY. Add it in your Vercel project settings (Environment Variables) and redeploy. Get a free key at https://console.groq.com/keys" 
      });
    }
    
    const errorMessage = "The neon connection flickers. The Oracle is temporarily unreachable. Try again in a moment.";
    return NextResponse.json({ response: errorMessage });
  }
}
