import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const enableEnglish = cookieStore.get('enableEnglish')?.value !== 'false'; // 默认 true
  const rawLocale = cookieStore.get('locale')?.value ?? 'zh';
  const locale = enableEnglish ? rawLocale : 'zh';
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
