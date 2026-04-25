import { NextRequest, NextResponse } from 'next/server';

const TRACKS = {
  '1': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  '2': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3',
  '3': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  '4': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  '5': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  '6': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
  '7': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-18.mp3',
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = TRACKS[id as keyof typeof TRACKS];

  if (!url) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Lounge/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch track: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
      },
    });
  } catch (error) {
    console.error('Audio proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to load audio' },
      { status: 500 }
    );
  }
}
