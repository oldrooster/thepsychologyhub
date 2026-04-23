# The Psychology Hub — WordPress to Astro Migration

Build a complete static website for "The Psychology Hub", migrating content from 
https://www.thepsychologyhub.co.nz/. Use Astro as the framework, Decap CMS for 
content management, and target Cloudflare Pages for hosting (free tier).

---

## PHASE 1: Content Scraping

Before building anything, write and run a Node.js script (scrape.mjs) that:

1. Scrapes all clinician profile pages listed on the homepage:
   - Extracts: name, role/title, qualifications, bio (full text), specialties/tags,
     contact email, availability (if listed as "Available" in tags)
   - Downloads the clinician photo from WordPress to /public/images/clinicians/
   - Saves each clinician as a Markdown file in /src/content/clinicians/ with 
     correct frontmatter

2. Scrapes these static pages and saves as Markdown in /src/content/pages/:
   - /structure/
   - /assessment/
   - /therapy/
   - /dietitians-2/
   - /fees/
   - /booking/
   - /room-rental/

3. Downloads any images used on static pages to /public/images/pages/

4. Logs a summary of what was scraped and any failures

The clinician URLs are:
- /portfolio_page/annalise-olsen/
- /portfolio_page/juliezarifeh/
- /portfolio_page/zoe-m-clinical-psychologist/
- /portfolio_page/johan-piek-clinical-psychologist/
- /portfolio_page/gabrielle-evatt/
- /portfolio_page/anna-comins/
- /portfolio_page/helene-zdrenka/
- /portfolio_page/louise-bennett/
- /portfolio_page/sarah-austin-clinical-psychologist/
- /portfolio_page/felicity-daly-psychologist/
- /portfolio_page/margo-neame-clinical-psychologist/
- /portfolio_page/annabel-ramsay/
- /portfolio_page/simon-panckhurst-clinical-psychologist/
- /portfolio_page/louise-jenkins-clinical-psychologist/
- /portfolio_page/steph-sparrow-social-worker-therapist/
- /portfolio_page/amywang/
- /portfolio_page/charis-whitaker/
- /portfolio_page/aleksandra-gosteva-psychologist/
- /portfolio_page/justine-psychologist-2/
- /portfolio_page/jo-vallance/
- /portfolio_page/aimee-hanson/
- /portfolio_page/brigette-gorman/

---

## PHASE 2: Site Build

### Tech Stack
- Astro (static output)
- Decap CMS (content management via GitHub backend)
- Vanilla JS only (no React/Vue needed)
- Cloudflare Pages deployment

### Content Collections
Define an Astro content collection for clinicians with this schema:
  - name: string
  - role: string (e.g. "Clinical Psychologist", "Nurse Therapist")
  - qualifications: string
  - photo: image
  - availability: boolean
  - specialties: array of strings (from predefined tag list)
  - bio: markdown (rich text)
  - contact_email: string
  - contact_notes: string (optional, e.g. referral instructions)
  - display_order: number

---

## PHASE 3: Pages

### Home Page (Clinician Portfolio)

**Tag Filter Bar — MULTI-SELECT**
This is the key UX improvement over the current site. The current site only allows 
one tag to be active at a time. The new site must support multiple simultaneous 
tag selections:

- Render all unique tags as toggle buttons across the top
- User can activate ANY combination of tags simultaneously
- Filter logic: show clinicians who match ALL currently active tags (AND logic)
  e.g. selecting "Available" + "CBT" + "Children" shows only clinicians who have 
  ALL THREE tags
- "Available" should be visually distinct (e.g. green tint) as it's the most 
  important filter
- Active tags should be visually highlighted
- A "Clear all" button resets filters
- Card grid updates instantly with no page reload — use CSS show/hide on data 
  attributes, no frameworks needed
- Show a "No clinicians match these filters" message when result is empty

**Clinician Cards**
Each card shows:
- Photo
- Name
- Role/title  
- Specialty tags (small pill badges)
- "Available" badge prominently if accepting referrals
- Clicking anywhere on card opens the modal

**Clinician Modal**
Scrollable overlay with:
- Close button (X), click-outside, and Escape key to dismiss
- Large photo at top
- Name, role, qualifications
- Specialty tag pills
- Full bio (markdown rendered)
- Contact section at bottom with email and any referral notes
- On mobile: full-height bottom sheet with drag-to-dismiss
- Smooth open/close animation

### Static Pages
Build all 7 static pages using the scraped markdown content:
Structure, Assessments, Therapy, Dietitians, Fees, Booking, Room Rental

Each page should have:
- Hero image (use scraped image if available, placeholder otherwise)
- Page title
- Body content (rendered markdown)
- Consistent nav and footer

---

## PHASE 4: Design

Match the calm, professional aesthetic of thepsychologyhub.co.nz:
- Warm neutral palette (creams, soft greens, muted tones)
- Clean sans-serif typography (Inter or similar via Google Fonts)
- Logo: use the existing logo image scraped from the site
  (https://www.thepsychologyhub.co.nz/wp-content/uploads/2021/10/Asset-4.png)
- Fully responsive, mobile-first
- Sticky navigation header
- Footer with: address (Suite 3, 21 Leslie Hills Drive, Riccarton, Christchurch),
  useful links (Book appointment, Room rental)
- Tagline in footer: "Whiria te tāngata — weave the people together"

---

## PHASE 5: CMS Setup (Decap CMS)

Configure /public/admin/config.yml for Decap CMS with GitHub backend:
- Clinicians collection: all fields from schema above, with the specialties field 
  as a multi-select from the predefined tag list
- Pages collection: all 7 static pages as markdown with body field
- Media folder: public/images
- Leave backend repo/branch as placeholders (TO BE CONFIGURED)
- Include /public/admin/index.html

The predefined tag list for specialties:
ACC therapy, ACT, Adolescents, Adult ADHD, Adult ASD, Adults, Anxiety, Available,
CBT, Children, Couples, Dietitian, Eating, EMDR, Grief, Health/Adjustment,
Mental Injury Assessor, Rainbow, Therapist

---

## PHASE 6: Deployment Config

- astro.config.mjs configured for static output
- _redirects file for Cloudflare Pages
- Include a thorough README.md covering:
  1. Local dev setup
  2. Creating the GitHub repo and connecting Cloudflare Pages
  3. Configuring Decap CMS (filling in the repo/branch placeholders)
  4. Setting up GitHub OAuth for the CMS login
  5. Pointing the domain DNS to Cloudflare Pages
  6. How your wife logs into the CMS to update clinician profiles

---

## Known Real Content (use this, don't use placeholders)

### Jo Vallance
- Role: Clinical Psychologist, Director
- Qualifications: PGDipClinPsych, MA (Distinction), BA (Hons), MNZCCP
- Tags: Adults, EMDR, Mental Injury Assessor, Rainbow, Therapist
- Availability: false
- Bio: Jo is a Senior Clinical Psychologist. She provides assessment and therapy 
  to clients aged 18 and above, treating issues such as anxiety, trauma, and eating 
  problems. Jo has worked in private practice since 2019. Her main therapeutic 
  approach is EMDR. She is an ACC approved provider for Sensitive Claims and 
  regularly conducts supported assessments. She is also available for supervision.
- Contact: jovallancepsychologist@gmail.com

### Annalise Olsen
- Role: Nurse Therapist
- Qualifications: BN Nursing, PG Cert Interpersonal Psychotherapy, PGcert specialty 
  mental health, EMDR and DBT Clinician
- Tags: Adolescents, Adults, Available, Children, EMDR, Rainbow, Therapist
- Availability: true
- Bio: (full bio scraped — over 20 years experience, trained nurse, therapist to 
  ages 10+, victim support funded sessions, trained in EMDR, DBT, IPT, Role Theory, 
  small figures work, currently training in Psychodrama Psychotherapy)
- Contact: annalise.alignedtherapy@gmail.com

(Remaining 20 clinicians to be populated by the scraper in Phase 1)
