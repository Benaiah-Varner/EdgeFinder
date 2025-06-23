import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string };

    // Fetch user data from backend
    const response = await fetch(`http://localhost:3001/auth/user/${decoded.userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: response.status });
    }

    const userData = await response.json();

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}