import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // Lista de todos os idiomas suportados
  locales: ['en', 'pt-BR', 'es'],
 
  // Idioma padrão para rotas sem prefixo
  defaultLocale: 'pt-BR',

  // Usa o prefixo apenas quando necessário (não para o pt-BR)
  localePrefix: 'as-needed'
});
 
export const config = {
  // Executa o middleware em TODAS as rotas, EXCETO:
  // - /api (rotas de API)
  // - /_next/static (arquivos estáticos)
  // - /_next/image (otimização de imagem)
  // - /assets (seus arquivos estáticos)
  // - favicon.ico (ícone)
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico).*)'
  ]
};