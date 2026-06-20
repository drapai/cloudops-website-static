# cloudops-website-static

Fully static replacement for **thecloudops.co.uk** — plain HTML/CSS, **no Next.js, no server, no build step**. Hosted on **GitHub Pages**, served through **Cloudflare** (proxied).

## Why
The previous site ran on a GCP VM/Cloud Run + LB stack. This static version removes all server dependencies so the GCP website infrastructure can be retired. Content was rebuilt from the live marketing site (brand, tagline, services, stats, contact).

## Structure
- `index.html` — home (hero, stats, services grid, contact CTA)
- `about.html`, `contact.html`
- `styles.css` — single stylesheet (brand dark theme; Montserrat + Sora via Google Fonts)
- `assets/` — `logo.png`, `icon.png`, `apple-icon.png`, `og-image.png`
- `CNAME` — custom domain for GitHub Pages (`thecloudops.co.uk`)
- `robots.txt`, `sitemap.xml`, `404.html`, `.nojekyll`

## Editing
Edit the HTML/CSS directly and push to `main` — GitHub Pages redeploys automatically. No toolchain required.

## Hosting
- GitHub Pages: repo Settings → Pages → deploy from `main` / root. Custom domain `thecloudops.co.uk` (via `CNAME`), Enforce HTTPS.
- Cloudflare: apex `A` → GitHub Pages IPs (185.199.108–111.153), `www` CNAME → apex, proxied. SSL Full.

Contact: contact@thecloudops.co.uk
