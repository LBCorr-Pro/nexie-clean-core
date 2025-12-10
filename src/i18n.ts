
import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
import {locales} from './i18n/i18n-config';

// RADICAL SIMPLIFICATION FOR DIAGNOSTICS
// This version only loads ONE file to test if the module loader is the issue.
const loadMessages = async (locale: string) => {
    try {
        // We are only loading 'common.json' to see if the server survives.
        // All other translations will be missing, which is expected for this test.
        const commonMessages = (await import(`../locales/${locale}/common.json`)).default;
        // Also loading login page, as it is critical for the test
        const loginPageMessages = (await import(`../locales/${locale}/loginPage.json`)).default;

        return {
            ...commonMessages,
            ...loginPageMessages
        };
    } catch (error) {
        console.error(`[DIAGNOSTIC i18n] Failed to load critical translation files for locale ${locale}. This could be a missing or corrupt JSON file.`, error);
        // We throw here to make sure the failure is loud
        throw error;
    }
};

export default getRequestConfig(async ({locale}) => {
  if (!locales.includes(locale as any)) {
    notFound();
  }
 
  try {
    return {
      messages: await loadMessages(locale),
    };
  } catch (error) {
    console.error(`[i18n] CRITICAL: The server was unable to load translation files, which is fatal. See error above.`);
    // Returning an empty messages object to prevent a total crash, 
    // although the UI will be broken (showing translation keys).
    // This is preferable to the silent server crash.
    return {
        messages: {}
    };
  }
});
