import { getAdminAuth } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const idToken = body.idToken;

        if (!idToken) {
            return NextResponse.json({ error: 'idToken não fornecido.' }, { status: 400 });
        }

        // Define o tempo de expiração do cookie. 5 dias em milissegundos.
        const expiresIn = 60 * 60 * 24 * 5 * 1000;

        // Cria o cookie de sessão com o idToken fornecido.
        const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });

        // Define as opções do cookie.
        const options = {
            name: '__session', // O nome do cookie que a Ação de Servidor está procurando
            value: sessionCookie,
            maxAge: expiresIn / 1000, // maxAge em segundos
            httpOnly: true, // Impede o acesso via JavaScript no cliente
            secure: process.env.NODE_ENV === 'production', // Usar `secure` em produção
            path: '/', // O cookie estará disponível em todo o site
        };

        // Cria a resposta e define o cookie no cabeçalho.
        const response = NextResponse.json({ success: true, message: 'Sessão de desenvolvimento criada com sucesso.' });
        response.cookies.set(options);

        return response;

    } catch (error: any) {
        console.error('Erro ao criar sessão de DEV:', error);
        return NextResponse.json({ error: `Falha ao criar o cookie de sessão: ${error.message}` }, { status: 500 });
    }
}
