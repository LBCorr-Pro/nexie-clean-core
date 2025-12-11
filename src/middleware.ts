// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/i18n-config';

// The middleware is reverted to its simplest and most reliable form.
// It only handles default locale redirection and path prefixing.
// The complex logic of detecting user preference is now handled on the client-side.
export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export const config = {
  // The matcher remains the same, protecting all necessary routes.
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
