// src/app/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { locales, defaultLocale } from '@/i18n/i18n-config';

// This is the root page, it just redirects to the correct locale.
// The middleware will now handle cookie detection, but this serves as a good fallback.
export default async function Home() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;

  // Redirect to the locale saved in the cookie, or the default locale.
  // The target is now the root of the locale, which will be our new public homepage.
  const locale = (cookieLocale && locales.includes(cookieLocale)) ? cookieLocale : defaultLocale;
  
  redirect(`/${locale}`);
}
