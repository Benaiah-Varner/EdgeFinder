import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'No token found' }, { status: 401 });
        }

        return NextResponse.json({ token });
    } catch (error) {
        console.error('Get token error:', error);
        return NextResponse.json({ error: 'Failed to get token' }, { status: 500 });
    }
} 