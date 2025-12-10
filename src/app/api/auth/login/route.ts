
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getUserStatus } from '@/lib/actions/get-user';

export async function POST(req: NextRequest) {
  try {
    const { idToken, tenantId, rememberMe } = await req.json();

    if (!adminAuth) {
      console.error('[API/Login] Error: Firebase Admin SDK not initialized.');
      return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
    }
    
    if (!idToken) {
        return NextResponse.json({ success: false, error: 'ID token is required.' }, { status: 400 });
    }

    // Decodifica o token para obter o UID
    const decodedClaims = await adminAuth.verifyIdToken(idToken);

    // Verifica o status do usuário (ativo, inativo, etc.)
    const userStatusData = await getUserStatus(decodedClaims.uid, tenantId);
    if (userStatusData.status !== 'active') {
      console.warn(`[API/Login] Denied access for UID ${decodedClaims.uid} on tenant ${tenantId}. Status: ${userStatusData.status}`);
      return NextResponse.json({ success: false, error: 'User is not authorized for this application.' }, { status: 403 });
    }

    // Define o tempo de expiração do cookie de sessão
    const expiresIn = rememberMe
      ? 60 * 60 * 24 * 14 * 1000 // 14 dias
      : 60 * 60 * 24 * 1 * 1000; // 1 dia

    // Cria o cookie de sessão
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Define o cookie na resposta
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn,
      path: '/',
      sameSite: 'lax',
    });

    return response;

  } catch (error: any) {
    console.error('[API/Login] Error creating session cookie:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create session.' }, { status: 500 });
  }
}
