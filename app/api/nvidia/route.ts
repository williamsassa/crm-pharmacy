import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt requis' }, { status: 400 });
    }

    const response = await fetch(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta/llama3-70b-instruct', // exemple
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const data = await response.json();

    return NextResponse.json({
      result: data.choices?.[0]?.message?.content,
    });
  } catch (error) {
    console.error('NVIDIA API error:', error);
    return NextResponse.json({ error: 'Erreur NVIDIA API' }, { status: 500 });
  }
}
