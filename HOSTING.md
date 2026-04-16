# Self-Hosting Guide (Static SPA)

This project was generated with TanStack Start (SSR-capable), but you can also
build it as a **pure client-side SPA** and host the output on any static web
server. No Node.js, no Cloudflare Workers, no server runtime required at runtime.

> ⚠️ Trade-off: a static build means **no server-side rendering**. Per-route
> `<head>` meta from `createFileRoute({ head })` will still be applied on the
> client, but search-engine crawlers and social-link previewers see only the
> initial HTML. If SEO/social previews matter, host with Node SSR or Cloudflare
> Workers instead.

---

## 1. Build the static bundle

```bash
npm install
npx vite build --config vite.config.static.ts
```

Output goes to `./dist/`. That folder is everything you need to deploy.

Preview locally:

```bash
npx vite preview --config vite.config.static.ts
```

## 2. SPA fallback (REQUIRED)

Because routing is client-side, your web server must serve `index.html` for any
URL it doesn't recognize as a real file. Otherwise refreshing `/about` returns 404.

### Nginx

```nginx
server {
  listen 80;
  root /var/www/your-app/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # Long-cache hashed assets
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

### Apache (`.htaccess` in `dist/`)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Caddy (`Caddyfile`)

```
your-domain.com {
  root * /var/www/your-app/dist
  try_files {path} /index.html
  file_server
  encode gzip
}
```

### Netlify

`public/_redirects` is already included — Netlify picks it up automatically.

### Vercel (static)

Add `vercel.json`:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

### GitHub Pages

`public/404.html` is included as a fallback so deep links work on GH Pages.
Push the contents of `dist/` to the `gh-pages` branch (or use `peaceiris/actions-gh-pages`).

### Docker (Nginx-based)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx vite build --config vite.config.static.ts

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

`nginx.conf`:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
}
```

Build & run:

```bash
docker build -t my-app .
docker run -p 8080:80 my-app
```

## 3. Environment variables

Only `VITE_*`-prefixed vars are inlined at build time. Set them before building:

```bash
VITE_API_URL=https://api.example.com npx vite build --config vite.config.static.ts
```

## 4. What you can/can't use in the static build

| Works              | Doesn't work (needs SSR/server)             |
| ------------------ | ------------------------------------------- |
| Routing, UI        | TanStack Start `createServerFn` server fns  |
| Client data fetch  | Route `loader`s that depend on server-only APIs |
| TanStack Query     | SSR'd `<head>` for crawlers                 |
| Tailwind, shadcn   | Cookie-based auth that needs server reads   |

If you rely on server functions, switch hosting to a Node server or Cloudflare Workers
(the default `npm run build` already produces a Workers-compatible output via `wrangler.jsonc`).

## 5. Going back to the Lovable / Workers build

The default `npm run build` is untouched and still produces the Cloudflare
Workers output. The static config is purely additive — files added:

- `vite.config.static.ts`
- `index.html`
- `src/entry-static.tsx`
- `public/_redirects`
- `public/404.html`
- `HOSTING.md` (this file)
