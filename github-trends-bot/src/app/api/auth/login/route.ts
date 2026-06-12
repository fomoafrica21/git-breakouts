// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'breakouts2025';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({
        success: true,
        message: 'Login successful'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Incorrect password'
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}