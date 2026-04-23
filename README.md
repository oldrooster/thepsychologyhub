# The Psychology Hub — Website Migration

Migration from WordPress to a static Astro site with Decap CMS, hosted on Cloudflare Pages.

**Live site:** https://www.thepsychologyhub.co.nz  
**Stack:** Astro · Decap CMS · Cloudflare Pages · GitHub

---

## What This Repo Contains

```
/
├── claude_prompt.md        # The Claude Code prompt used to build the site
├── README.md               # This file
├── src/
│   ├── content/
│   │   ├── clinicians/     # One .md file per clinician (managed via CMS)
│   │   └── pages/          # Static page content (managed via CMS)
│   ├── layouts/            # Astro layout components
│   └── pages/              # Astro page routes
├── public/
│   ├── admin/
│   │   ├── index.html      # Decap CMS entry point
│   │   └── config.yml      # Decap CMS configuration
│   └── images/
│       ├── clinicians/     # Clinician profile photos
│       └── pages/          # Images used on static pages
├── astro.config.mjs
├── _redirects              # Cloudflare Pages routing rules
└── package.json
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [GitHub](https://github.com) account
- A [Cloudflare](https://cloudflare.com) account (free)
- Your domain registrar login (to update DNS at the end)

---

## Step 1 — Run Claude Code

Claude Code builds the entire site and scrapes the existing WordPress content in one session.

### Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

### Run it

```bash
# Navigate to this repo folder
cd psychology-hub

# Start Claude Code
claude

# Then paste the contents of claude_prompt.md when prompted
```

Claude Code will:
1. Scrape all 22 clinician profiles (bio, photo, email, tags) from the live site
2. Scrape all static pages (Structure, Fees, Assessments, etc.)
3. Download all images
4. Build the complete Astro site
5. Configure Decap CMS
6. Set up Cloudflare Pages deployment config

> **Estimated time:** 15–30 minutes for the full build and scrape.

---

## Step 2 — Test Locally

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

## Step 3 — Push to GitHub

If you haven't already initialised git:

```bash
git init
git add .
git commit -m "Initial build — migrated from WordPress"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## Step 4 — Deploy to Cloudflare Pages

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

## Step 5 — Set Up Decap CMS (so your wife can edit content)

Decap CMS uses GitHub as its backend. You need to create a GitHub OAuth app so she can log in at `/admin`.

### 5a — Create a GitHub OAuth App

1. Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. Fill in:
   - **Application name:** The Psychology Hub CMS
   - **Homepage URL:** `https://www.thepsychologyhub.co.nz`
   - **Authorization callback URL:** `https://api.netlify.com/auth/done`
3. Click **Register application**
4. Note the **Client ID** and generate a **Client Secret** — you'll need these

> **Why Netlify's callback URL?** Decap CMS uses Netlify's OAuth gateway even when hosted on Cloudflare Pages. It's free and requires no Netlify account.

### 5b — Update config.yml

Open `public/admin/config.yml` and fill in the placeholders:

```yaml
backend:
  name: github
  repo: YOUR_USERNAME/YOUR_REPO_NAME   # e.g. jsmith/psychology-hub
  branch: main
```

Commit and push this change:

```bash
git add public/admin/config.yml
git commit -m "Configure CMS backend"
git push
```

### 5c — Test CMS Login

Visit `https://your-repo.pages.dev/admin` and log in with GitHub.

You should see the Decap CMS editor with two collections:
- **Clinicians** — all 22 profiles, fully editable
- **Pages** — all static pages

---

## Step 6 — Point the Domain to Cloudflare Pages

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

## Step 7 — Decommission WordPress

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

**A clinician's photo didn't scrape correctly**  
Upload manually via the CMS — go to the clinician's profile and use the photo upload field.

**DNS not propagating**  
Use https://dnschecker.org to check propagation status across global DNS servers.

---

## Contact / Credits

Site built with [Astro](https://astro.build), managed with [Decap CMS](https://decapcms.org), hosted on [Cloudflare Pages](https://pages.cloudflare.com).

Original WordPress site by [The Social Media Shop](https://socialmediashop.business.blog/).
