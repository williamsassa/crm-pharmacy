import { NextResponse } from 'next/server';

// Legacy callback route - redirect to login page
// Auth is now handled by Firebase client-side
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`);
}
