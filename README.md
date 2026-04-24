# The Psychology Hub — Website

Static site for [The Psychology Hub](https://www.thepsychologyhub.co.nz/), migrated from WordPress.

**Stack:** Astro · Decap CMS · Cloudflare Pages · GitHub

---

## Project Structure

```
/
├── src/
│   ├── content/
│   │   ├── clinicians/     # One .md file per clinician (managed via CMS)
│   │   └── pages/          # Static page content (managed via CMS)
│   ├── layouts/
│   │   ├── BaseLayout.astro   # Site shell (nav, footer)
│   │   └── PageLayout.astro   # Layout for static pages
│   ├── pages/
│   │   ├── index.astro        # Home page (clinician grid + filter)
│   │   ├── structure.astro
│   │   ├── assessment.astro
│   │   ├── therapy.astro
│   │   ├── dietitians.astro
│   │   ├── fees.astro
│   │   ├── booking.astro
│   │   └── room-rental.astro
│   └── styles/
│       └── global.css
├── public/
│   ├── admin/
│   │   ├── index.html      # Decap CMS entry point
│   │   └── config.yml      # Decap CMS configuration
│   └── images/
│       ├── clinicians/     # Clinician profile photos
│       ├── pages/          # Images used on static pages
│       └── logo.svg        # Site logo (replace with real logo)
├── astro.config.mjs
├── scrape.mjs              # Content scraper (for re-importing from WordPress)
└── package.json
```

---

## Things Still To Do

- [ ] **Replace the logo** — `public/images/logo.svg` is a placeholder. Upload the real logo file (PNG or SVG) and update the path in `src/layouts/BaseLayout.astro`
- [ ] **Fill in clinician details** — 20 of the 22 clinicians have placeholder bios and no photos/emails. Edit via the CMS at `/admin/` once deployed, or edit the `.md` files directly in `src/content/clinicians/`
- [ ] **Update `public/admin/config.yml`** — replace `TO_BE_CONFIGURED` with `oldrooster` (see Step 4)

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [Cloudflare](https://cloudflare.com) account (free)
- Your domain registrar login (to update DNS)

---

## Step 1 — Test Locally

```bash
npm install
npm run dev
```

Open http://localhost:4321 and verify:

- [ ] All clinician cards appear on the home page
- [ ] Photos are loading correctly
- [ ] Multi-select tag filters work (try combining "Available" + "CBT")
- [ ] "Clear all" resets the filters
- [ ] Clicking a clinician card opens the scrollable modal
- [ ] Modal closes via ✕ button, clicking outside, and Escape key
- [ ] All navigation pages load (Structure, Fees, etc.)
- [ ] Site looks correct on mobile (resize browser)

---

## Step 2 — Deploy to Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Select your GitHub repo
4. Set the build configuration:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Click **Save and Deploy**

Cloudflare will build and deploy the site. You'll get a URL like `your-repo.pages.dev` — this is your live staging URL.

---

## Step 3 — Set Up Decap CMS (so your wife can edit content)

Decap CMS uses GitHub as its backend. You need to create a GitHub OAuth app so she can log in at `/admin`.

### 3a — Create a GitHub OAuth App

1. Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. Fill in:
   - **Application name:** The Psychology Hub CMS
   - **Homepage URL:** `https://www.thepsychologyhub.co.nz`
   - **Authorization callback URL:** `https://api.netlify.com/auth/done`
3. Click **Register application**
4. Note the **Client ID** and generate a **Client Secret** — you'll need these

> **Why Netlify's callback URL?** Decap CMS uses Netlify's OAuth gateway even when hosted on Cloudflare Pages. It's free and requires no Netlify account.

### 3b — Update config.yml

Open `public/admin/config.yml` and fill in the placeholders:

```yaml
backend:
  name: github
  repo: oldrooster/thepsychologyhub
  branch: main
```

Commit and push this change:

```bash
git add public/admin/config.yml
git commit -m "Configure CMS backend"
git push
```

### 3c — Test CMS Login

Visit `https://your-repo.pages.dev/admin` and log in with GitHub.

You should see the Decap CMS editor with two collections:
- **Clinicians** — all 22 profiles, fully editable
- **Pages** — all static pages

---

## Step 4 — Point the Domain to Cloudflare Pages

### At Cloudflare Pages

1. Go to your Pages project → **Custom domains** → **Set up a custom domain**
2. Enter `thepsychologyhub.co.nz`
3. Also add `www.thepsychologyhub.co.nz`

### At Your Domain Registrar

Update the DNS records to point to Cloudflare Pages. Cloudflare will show you the exact values, but it will look something like:

| Type | Name | Value |
|------|------|-------|
| CNAME | `www` | `your-repo.pages.dev` |
| CNAME | `@` | `your-repo.pages.dev` |

> DNS propagation typically takes 5–30 minutes, occasionally up to 24 hours.

Once propagated, visit https://www.thepsychologyhub.co.nz and confirm the new site is live.

---

## Step 5 — Decommission WordPress

Once you've confirmed the new site is live and stable for a few days:

1. Cancel your WordPress hosting plan
2. Keep your domain registration active (renew as normal)
3. Optionally export a final WordPress backup for your records

---

## How Your Wife Uses the CMS

1. Go to **https://www.thepsychologyhub.co.nz/admin**
2. Click **Login with GitHub** (she'll need a free GitHub account)
3. To update a clinician profile:
   - Click **Clinicians** in the left sidebar
   - Find the clinician and click their name
   - Edit any field — bio, photo, availability, specialties
   - Click **Publish** when done
4. The site will automatically rebuild and go live within ~2 minutes

### Toggling Availability

The **Availability** field is a simple on/off toggle in the CMS. When turned on, the clinician's card gets the "Available" badge and they appear when the "Available" filter is active.

### Adding a New Clinician

1. In the CMS, go to **Clinicians** → **New Clinician**
2. Fill in all fields and upload a photo
3. Set their display order (controls position in the grid)
4. Click **Publish**

### Editing Static Pages

Go to **Pages** in the sidebar, select the page, and edit the body content using the rich text editor.

---

## Multi-Select Tag Filter — How It Works

The new site supports selecting **multiple tags simultaneously**, unlike the original WordPress site.

**Example:** A user wanting to find a child psychologist who is currently available and does EMDR can select all three tags — **Available** + **Children** + **EMDR** — and only clinicians matching all three will show.

- Tags use **AND logic** — clinician must have all selected tags to appear
- **Available** is visually distinct (green) as the most commonly used filter
- **Clear all** button resets to showing everyone
- No page reload — cards show/hide instantly

---

## Ongoing Costs

| Service | Cost |
|---------|------|
| Cloudflare Pages hosting | **Free** |
| GitHub repo | **Free** |
| Decap CMS | **Free** |
| Domain renewal | Same as before (paid at your registrar) |
| **Total new monthly cost** | **$0** |

---

## Troubleshooting

**CMS login not working**  
Check that the `repo` field in `config.yml` matches your GitHub repo exactly, and that the OAuth app callback URL is `https://api.netlify.com/auth/done`.

**Images not showing after deploy**  
Check that image paths in clinician markdown files use `/images/clinicians/filename.jpg` (relative to `/public`).

**Build failing on Cloudflare**  
Check the build log in the Cloudflare Pages dashboard. The most common cause is a Node.js version mismatch — add an environment variable `NODE_VERSION = 18` in the Pages settings.

**Clinician photos are missing**  
The WordPress site blocked scraping, so no photos were imported. Upload them manually via the CMS — go to the clinician's profile and use the photo upload field.

**DNS not propagating**  
Use https://dnschecker.org to check propagation status across global DNS servers.

---

## Contact / Credits

Site built with [Astro](https://astro.build), managed with [Decap CMS](https://decapcms.org), hosted on [Cloudflare Pages](https://pages.cloudflare.com).

Original WordPress site by [The Social Media Shop](https://socialmediashop.business.blog/).
