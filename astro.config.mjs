import vercel from '@astrojs/vercel';
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  env: {
    schema: {
      OPENROUTESERVICE_API_KEY: envField.string({ context: 'server', access: 'secret' }),
    },
  },
  build: {
    format: 'directory',
  },
});
