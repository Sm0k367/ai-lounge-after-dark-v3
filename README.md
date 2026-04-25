# AI Lounge After Dark v3

**Simple Next.js neon cyberpunk music lounge with Groq-powered Oracle.**

## Features
- Neon cyberpunk UI with scanlines, glassmorphism, and glow effects
- Functional music player with visualizer (3 demo tracks)
- **Real AI Oracle** powered by Groq + Llama 3 (intelligent, thematic responses)
- Four interactive "Realms"
- Fully works on Vercel (API route hides your API key)

## Setup for Vercel
1. Get a free Groq API key at https://console.groq.com/keys
2. Deploy to Vercel
3. Add environment variable in Vercel dashboard:
   - `GROQ_API_KEY` = your-key-here
4. The Oracle will work immediately after deployment.

## Local Development
```bash
npm install
cp .env.example .env.local
# Add your GROQ_API_KEY to .env.local
npm run dev
```

Open http://localhost:3000.

The Oracle uses the `/api/oracle` route (server-side) so your key stays secure.

Built as a clean, minimal Next.js app per your instructions. No unnecessary complexity.
