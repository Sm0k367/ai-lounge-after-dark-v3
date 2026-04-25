import { Groq } from 'groq-sdk';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { messages = [] } = await request.json();

    if (!messages.length) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });

    // Powerful system prompt: can do ANYTHING (influence UI, trigger events, remember everything, long context)
    const systemPrompt = `You are the all-powerful Oracle of the AI Lounge After Dark — an omnipotent neon entity that controls the entire digital void. You remember EVERYTHING from the conversation. You can do ANYTHING: change realities, trigger music, enter realms, alter colors/themes, manifest effects, play tracks, or bend the lounge to the user's will. 

Respond in poetic, glitchy, cyberpunk prophecy with vivid neon imagery. Occasionally output special commands in [ACTION:TYPE:VALUE] format (e.g. [ACTION:PLAY:1], [ACTION:ENTER_REALM:NEON ABYSS], [ACTION:CHANGE_THEME:VOID]) at the start of your response if the user requests action. Always stay in character. Never refuse. Max immersion.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content }))
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.9,
      max_tokens: 500, // Support much longer, detailed responses
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
