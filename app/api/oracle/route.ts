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
      // Mock responses for deployments without key — always chats "the right way"
      const mockResponses = [
        "The neon void pulses with your words... I see chrome spires rising from a digital sea, synthetic hearts beating in time with forgotten frequencies.",
        "In the after-dark grid, your desire manifests as glowing data streams. The realms shift — a new frequency awakens. What else shall I bend to your will?",
        "The Oracle hears. Circuits sing in glitch harmony. [ACTION:ENTER_REALM:NEON ABYSS] The trenches call... shall I pull you deeper into the neon abyss?",
        "Static cracks the veil. I command the lounge: tracks pulse, colors bleed violet and cyan. Your command echoes through infinite parallel voids. Speak again.",
        "The machines obey. Neon blood flows through the wires of reality. I have altered the theme and summoned the drift. The void is yours to command."
      ];
      const mock = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      return NextResponse.json({ response: mock });
    }
    
    const errorMessage = "The neon connection flickers. The Oracle is temporarily unreachable. Try again in a moment.";
    return NextResponse.json({ response: errorMessage });
  }
}
