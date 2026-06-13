import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kudajbergenrasul01.github.io',
  base: '/med-college',
  output: 'static',
  i18n: {
    defaultLocale: 'ru',
    locales: ['ru', 'kk', 'en'],
    routing: {
      prefixDefaultLocale: false
    }
  }
});
