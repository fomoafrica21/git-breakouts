// app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { generateDailyContent } from '@/scripts/generate';

export async function POST() {
  try {
    await generateDailyContent();
    return NextResponse.json({ success: true, message: "Content generated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}