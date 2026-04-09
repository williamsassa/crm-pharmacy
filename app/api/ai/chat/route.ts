import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { streamGemma, callGemma } from '@/lib/ai/gemma';
import { getChatSystemPrompt, getDBContext } from '@/lib/ai/agent';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { profile } = authResult;
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const body = await request.json();
    const { messages } = body as {
      messages: { role: 'user' | 'model'; content: string }[];
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages requis' }, { status: 400 });
    }

    const context = await getDBContext(profile.id);
    const systemPrompt = getChatSystemPrompt(context);

    const formattedMessages = messages.map((m) => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      content: m.content,
    }));

    // Try streaming first
    try {
      const stream = await streamGemma(systemPrompt, formattedMessages, {
        temperature: 0.7,
        maxTokens: 4096,
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } catch (streamError) {
      console.warn('Streaming failed, falling back to non-streaming:', streamError instanceof Error ? streamError.message : streamError);

      // Fallback: non-streaming mode (works when streaming is rate-limited)
      const response = await callGemma(systemPrompt, formattedMessages, {
        temperature: 0.7,
        maxTokens: 4096,
      });

      // Wrap the non-streaming response as SSE so the frontend can parse it
      const encoder = new TextEncoder();
      const sseData = encoder.encode(`data: ${JSON.stringify({ text: response })}\n\ndata: [DONE]\n\n`);

      return new Response(sseData, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}
