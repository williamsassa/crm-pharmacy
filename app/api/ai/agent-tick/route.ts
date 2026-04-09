import { NextResponse } from 'next/server';
import { runAgentTick } from '@/lib/ai/agent';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    // Verify cron secret for Vercel (optional security)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await runAgentTick();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Agent tick error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}
