import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const key = `rate_limit:${ip}`;
    
    // Get current count if it exists
    const count = await redis.get(key);
    const remaining = count ? 100 - parseInt(count as string) : 100;

    return NextResponse.json({
      success: true,
      remaining: Math.max(0, remaining), // Ensure we don't return negative values
    });
  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Could not check rate limit',
      remaining: null,
    });
  }
} 