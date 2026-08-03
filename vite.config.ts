import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

dotenv.config();

// Adds the canonical and og:url tags from SITE_URL. Both need an absolute
// address, so they can only be written once the site has a real home. When
// SITE_URL is unset the tags are left out entirely — a missing canonical is
// harmless, a wrong one actively misleads search engines.
function siteUrlTags(): Plugin {
  return {
    name: 'mount-zion-site-url-tags',
    transformIndexHtml(html) {
      const siteUrl = process.env.SITE_URL?.trim().replace(/\/$/, '');
      if (!siteUrl) return html;
      return html.replace(
        '</head>',
        `  <link rel="canonical" href="${siteUrl}/" />\n` +
          `    <meta property="og:url" content="${siteUrl}/" />\n` +
          '  </head>',
      );
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), siteUrlTags()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
