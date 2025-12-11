// src/app/api/auth/dev-login/route.ts
import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin-helpers';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
  }
  
  const devEmails = (process.env.NEXT_PUBLIC_DEV_EMAILS || '').split(',');
  const adminAuth = getAdminAuth();

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    if (!decodedToken.email || !devEmails.includes(decodedToken.email)) {
      return NextResponse.json({ error: 'Unauthorized user for dev login.' }, { status: 403 });
    }
    
    const expiresIn = 60 * 60 * 24 * 1 * 1000; // 1 day

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ success: true });
    
    // CORREÇÃO: O cookie agora é nomeado '__session' para ser consistente com as Server Actions.
    response.cookies.set('__session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn / 1000,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Dev Session Login Error:', error);
    return NextResponse.json({ error: 'Failed to create dev session.' }, { status: 401 });
  }
}
