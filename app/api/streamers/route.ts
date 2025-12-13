import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = getDatabase();
    const streamers = db.getStreamers();
    return NextResponse.json(streamers);
  } catch (error) {
    console.error('Error fetching streamers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streamers' },
      { status: 500 }
    );
  }
}




