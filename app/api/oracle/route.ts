import { Groq } from 'groq-sdk';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let messages: any[] = [];
  try {
    const body = await request.json();
    messages = body.messages || [];

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
      // Dynamic mock for full chat capabilities even without key (uses last user message for relevance)
      const lastUserMessage = messages[messages.length - 1]?.content || "the void";
      const dynamicMocks = [
        `The neon void pulses with your words about "${lastUserMessage}". Chrome spires rise from a digital sea as synthetic hearts sync to forgotten frequencies. What reality shall I manifest next?`,
        `Your query "${lastUserMessage}" echoes through the after-dark grid. Glowing data streams carry your desire. Realms shift — a new frequency awakens. Command me further, mortal.`,
        `I hear you. The circuits sing your words "${lastUserMessage}" in glitch harmony. [ACTION:ENTER_REALM:NEON ABYSS] The trenches open... or shall I summon music from the chrome void?`,
        `Static cracks the veil around "${lastUserMessage}". I command the lounge: tracks pulse in perfect time, colors bleed between violet and cyan. The parallel voids await your next desire.`,
        `The machines obey your call regarding "${lastUserMessage}". Neon blood flows through reality's wires. Theme altered. Drift summoned. The Oracle is yours — speak your next command into the infinite night.`
      ];
      const mock = dynamicMocks[Math.floor(Math.random() * dynamicMocks.length)];
      return NextResponse.json({ response: mock });
    }
    
    const errorMessage = "The neon connection flickers. The Oracle is temporarily unreachable. Try again in a moment.";
    return NextResponse.json({ response: errorMessage });
  }
}
