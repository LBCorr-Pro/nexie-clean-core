// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/i18n-config';

// The middleware is now configured to use 'as-needed' for the locale prefix.
// This means the prefix will be omitted for the default locale (e.g., /dashboard)
// but will be present for all other locales (e.g., /en/dashboard).
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
