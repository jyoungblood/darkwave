// DW - Astro config

import { defineConfig } from "astro/config";
import path from "path";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import favicons from "astro-favicons";

import react from "@astrojs/react";

export default defineConfig({
  prefetch: true,
  output: "server",
  integrations: [favicons(), react()],
  //   favicons({
  //     masterPicture: "./src/assets/favicon.svg",
  //     emitAssets: true,
  //     appDescription: import.meta.env.SITE_TITLE,
  //     faviconsDarkMode: false,
  //     start_url: "/",
  //   }),
  site: `https://${import.meta.env.SITE_DOMAIN}`,

  adapter: node({
    mode: "standalone",
  }),

  server: {
    host: true, // Allow connections from all IPs
    headers: import.meta.env.PROD
      ? {
          "Content-Security-Policy": `
        default-src 'self' *.${import.meta.env.SITE_DOMAIN};
        script-src 'self' 'unsafe-inline' 'unsafe-eval' *.${
          import.meta.env.SITE_DOMAIN
        } https://accounts.google.com;
        style-src 'self' 'unsafe-inline' *.${import.meta.env.SITE_DOMAIN};
        img-src 'self' data: https: blob: *.${
          import.meta.env.SITE_DOMAIN
        } *.google.com *.googleapis.com ${
            import.meta.env.BUNNY_STORAGE_REGION &&
            import.meta.env.BUNNY_STORAGE_NAME
              ? `*.bunnycdn.com ${
                  import.meta.env.BUNNY_STORAGE_REGION
                }.storage.bunnycdn.com ${
                  import.meta.env.BUNNY_STORAGE_NAME
                }.b-cdn.net`
              : ""
          } ${import.meta.env.S3_DOMAIN ? import.meta.env.S3_DOMAIN : ""};
        font-src 'self' https://fonts.googleapis.com data: *.${
          import.meta.env.SITE_DOMAIN
        };
        connect-src 'self' *.${
          import.meta.env.SITE_DOMAIN
        } https://accounts.google.com;
        form-action 'self' *.${
          import.meta.env.SITE_DOMAIN
        } https://accounts.google.com;
        frame-src 'self' https://accounts.google.com;
        frame-ancestors 'none';
      `
            .trim()
            .replace(/\s+/g, " "),
        }
      : {},
  },

  vite: {
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },

    envPrefix: ["PUBLIC_", "MYSQL_", "GOOGLE_", "BETTER_AUTH_"],

    plugins: [tailwindcss()],
  },

  security: {
    checkOrigin: false,
  },
});