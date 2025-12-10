// src/app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin-helpers'; // Usando o helper correto

export async function POST(request: Request) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json(
      { error: 'ID token is required.' },
      { status: 400 }
    );
  }

  // A duração do cookie. 5 dias em milissegundos.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    const adminAuth = getAdminAuth();
    // Cria o cookie de sessão com o idToken fornecido.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Define o cookie na resposta com as flags de segurança.
    const response = NextResponse.json({ success: true });
    response.cookies.set('session', sessionCookie, {
      httpOnly: true, // Impede o acesso via JavaScript no cliente.
      secure: process.env.NODE_ENV === 'production', // Garante que o cookie seja enviado apenas sobre HTTPS.
      path: '/', // O cookie estará disponível em todas as rotas.
      maxAge: expiresIn / 1000, // maxAge é em segundos
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Session Login Error:', error);
    return NextResponse.json(
      { error: 'Failed to create session.' },
      { status: 401 }
    );
  }
}
