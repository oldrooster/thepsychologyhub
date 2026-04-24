import { load } from 'cheerio';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import path from 'path';

const BASE_URL = 'https://www.thepsychologyhub.co.nz';

const CLINICIAN_SLUGS = [
  'annalise-olsen',
  'juliezarifeh',
  'zoe-m-clinical-psychologist',
  'johan-piek-clinical-psychologist',
  'gabrielle-evatt',
  'anna-comins',
  'helene-zdrenka',
  'louise-bennett',
  'sarah-austin-clinical-psychologist',
  'felicity-daly-psychologist',
  'margo-neame-clinical-psychologist',
  'annabel-ramsay',
  'simon-panckhurst-clinical-psychologist',
  'louise-jenkins-clinical-psychologist',
  'steph-sparrow-social-worker-therapist',
  'amywang',
  'charis-whitaker',
  'aleksandra-gosteva-psychologist',
  'justine-psychologist-2',
  'jo-vallance',
  'aimee-hanson',
  'brigette-gorman',
];

const STATIC_PAGES = [
  { slug: 'structure', url: '/structure/' },
  { slug: 'assessment', url: '/assessment/' },
  { slug: 'therapy', url: '/therapy/' },
  { slug: 'dietitians', url: '/dietitians-2/' },
  { slug: 'fees', url: '/fees/' },
  { slug: 'booking', url: '/booking/' },
  { slug: 'room-rental', url: '/room-rental/' },
];

const KNOWN_CLINICIANS = {
  'jo-vallance': {
    name: 'Jo Vallance',
    role: 'Clinical Psychologist, Director',
    qualifications: 'PGDipClinPsych, MA (Distinction), BA (Hons), MNZCCP',
    specialties: ['Adults', 'EMDR', 'Mental Injury Assessor', 'Rainbow', 'Therapist'],
    availability: false,
    bio: `Jo is a Senior Clinical Psychologist. She provides assessment and therapy to clients aged 18 and above, treating issues such as anxiety, trauma, and eating problems. Jo has worked in private practice since 2019. Her main therapeutic approach is EMDR. She is an ACC approved provider for Sensitive Claims and regularly conducts supported assessments. She is also available for supervision.`,
    contact_email: 'jovallancepsychologist@gmail.com',
  },
  'annalise-olsen': {
    name: 'Annalise Olsen',
    role: 'Nurse Therapist',
    qualifications: 'BN Nursing, PG Cert Interpersonal Psychotherapy, PGcert specialty mental health, EMDR and DBT Clinician',
    specialties: ['Adolescents', 'Adults', 'Available', 'Children', 'EMDR', 'Rainbow', 'Therapist'],
    availability: true,
    bio: `Annalise is a trained nurse and therapist with over 20 years of experience. She provides therapy to clients aged 10 and above. She is funded through Victim Support and other agencies. Annalise is trained in EMDR, DBT, IPT, Role Theory, and small figures work. She is currently training in Psychodrama Psychotherapy.`,
    contact_email: 'annalise.alignedtherapy@gmail.com',
  },
};

const results = { clinicians: [], pages: [], errors: [] };

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SiteBuilder/1.0)',
        ...options.headers,
      },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).href;
        resolve(fetchUrl(redirectUrl, options));
        return;
      }
      if (options.binary) {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks), headers: res.headers }));
        res.on('error', reject);
      } else {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
        res.on('error', reject);
      }
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function extractText($, el) {
  return $(el).text().trim().replace(/\s+/g, ' ');
}

function htmlToMarkdown(html) {
  // Simple HTML to markdown converter
  return html
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, (_, t) => `\n\n## ${t.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, (_, t) => `\n\n${t.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<li[^>]*>(.*?)<\/li>/gi, (_, t) => `- ${t.replace(/<[^>]+>/g, '').trim()}\n`)
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function downloadImage(imageUrl, destPath) {
  try {
    if (!imageUrl) return null;
    const dir = path.dirname(destPath);
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    const res = await fetchUrl(imageUrl, { binary: true });
    if (res.status === 200) {
      await writeFile(destPath, res.body);
      return destPath;
    }
  } catch (e) {
    console.warn(`  Failed to download image ${imageUrl}: ${e.message}`);
  }
  return null;
}

async function scrapeClinicianPage(slug, order) {
  const url = `${BASE_URL}/portfolio_page/${slug}/`;
  console.log(`Scraping clinician: ${slug}`);

  try {
    const res = await fetchUrl(url);
    if (res.status !== 200) {
      throw new Error(`HTTP ${res.status}`);
    }

    const $ = load(res.body);
    const known = KNOWN_CLINICIANS[slug];

    // Extract name
    let name = known?.name ||
      $('h1.entry-title, h1.page-title, .portfolio-title h1, h2.entry-title').first().text().trim() ||
      $('h1').first().text().trim() ||
      slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Extract role
    let role = known?.role ||
      $('.portfolio-info .role, .clinician-role, [class*="role"]').first().text().trim() ||
      $('h2').first().text().trim() ||
      '';

    // Extract qualifications
    let qualifications = known?.qualifications ||
      $('.qualifications, [class*="qual"]').first().text().trim() ||
      '';

    // Extract bio
    let bioHtml = $('.entry-content, .portfolio-description, .bio-content, article .content').first().html() || '';
    // Remove tag sections from bio
    let bio = known?.bio || htmlToMarkdown(bioHtml);

    // Extract tags/specialties
    let specialties = known?.specialties || [];
    if (!known) {
      $('a[rel="tag"], .tags a, .portfolio-tags a, [class*="tag"] a').each((_, el) => {
        const tag = $(el).text().trim();
        if (tag) specialties.push(tag);
      });
    }

    // Determine availability
    const availability = known?.availability ?? specialties.includes('Available');

    // Extract email
    let contact_email = known?.contact_email || '';
    if (!contact_email) {
      $('a[href^="mailto:"]').each((_, el) => {
        if (!contact_email) contact_email = $(el).attr('href').replace('mailto:', '').trim();
      });
    }

    // Find photo
    let photoUrl = '';
    const imgSelectors = [
      '.portfolio-featured-image img',
      '.wp-post-image',
      'article img',
      '.entry-content img:first-child',
      'img[class*="attachment-full"]',
      'img[class*="wp-image"]',
    ];
    for (const sel of imgSelectors) {
      const src = $(sel).first().attr('src') || $(sel).first().attr('data-src');
      if (src && !src.includes('placeholder')) {
        photoUrl = src.startsWith('http') ? src : `${BASE_URL}${src}`;
        break;
      }
    }

    // Download photo
    let photoPath = '';
    if (photoUrl) {
      const ext = photoUrl.split('.').pop().split('?')[0] || 'jpg';
      const filename = `${slug}.${ext}`;
      const destPath = `/home/user/thepsychologyhub/public/images/clinicians/${filename}`;
      const downloaded = await downloadImage(photoUrl, destPath);
      if (downloaded) photoPath = `/images/clinicians/${filename}`;
    }

    // Build frontmatter
    const frontmatter = {
      name,
      role: role || 'Clinician',
      qualifications: qualifications || '',
      photo: photoPath || '',
      availability,
      specialties,
      contact_email,
      contact_notes: '',
      display_order: order,
    };

    const mdContent = `---
name: "${frontmatter.name.replace(/"/g, '\\"')}"
role: "${frontmatter.role.replace(/"/g, '\\"')}"
qualifications: "${frontmatter.qualifications.replace(/"/g, '\\"')}"
photo: "${frontmatter.photo}"
availability: ${frontmatter.availability}
specialties: [${frontmatter.specialties.map(s => `"${s}"`).join(', ')}]
contact_email: "${frontmatter.contact_email}"
contact_notes: ""
display_order: ${frontmatter.display_order}
---

${bio}
`;

    const filePath = `/home/user/thepsychologyhub/src/content/clinicians/${slug}.md`;
    await writeFile(filePath, mdContent);

    results.clinicians.push({ slug, name, photo: !!photoPath });
    console.log(`  ✓ ${name} (photo: ${!!photoPath})`);

  } catch (e) {
    console.error(`  ✗ ${slug}: ${e.message}`);
    results.errors.push({ type: 'clinician', slug, error: e.message });

    // Write known data fallback
    const known = KNOWN_CLINICIANS[slug];
    if (known) {
      const mdContent = `---
name: "${known.name}"
role: "${known.role}"
qualifications: "${known.qualifications}"
photo: ""
availability: ${known.availability}
specialties: [${known.specialties.map(s => `"${s}"`).join(', ')}]
contact_email: "${known.contact_email}"
contact_notes: ""
display_order: ${order}
---

${known.bio}
`;
      const filePath = `/home/user/thepsychologyhub/src/content/clinicians/${slug}.md`;
      await writeFile(filePath, mdContent);
      results.clinicians.push({ slug, name: known.name, photo: false, fallback: true });
    }
  }
}

async function scrapeStaticPage(slug, url) {
  const fullUrl = `${BASE_URL}${url}`;
  console.log(`Scraping static page: ${slug} (${url})`);

  try {
    const res = await fetchUrl(fullUrl);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);

    const $ = load(res.body);
    const title = $('h1.entry-title, h1.page-title, h1').first().text().trim() || slug;
    const contentEl = $('.entry-content, .page-content, article .content, main .content').first();

    // Download images
    const images = [];
    contentEl.find('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) images.push(src.startsWith('http') ? src : `${BASE_URL}${src}`);
    });

    for (const imgUrl of images) {
      try {
        const ext = imgUrl.split('.').pop().split('?')[0] || 'jpg';
        const filename = `${slug}-${path.basename(imgUrl).split('?')[0]}`;
        const destPath = `/home/user/thepsychologyhub/public/images/pages/${filename}`;
        await downloadImage(imgUrl, destPath);
      } catch (e) { /* ignore */ }
    }

    const bodyMarkdown = htmlToMarkdown(contentEl.html() || '');

    const mdContent = `---
title: "${title.replace(/"/g, '\\"')}"
slug: "${slug}"
---

${bodyMarkdown}
`;

    await writeFile(`/home/user/thepsychologyhub/src/content/pages/${slug}.md`, mdContent);
    results.pages.push({ slug, title });
    console.log(`  ✓ ${title}`);

  } catch (e) {
    console.error(`  ✗ ${slug}: ${e.message}`);
    results.errors.push({ type: 'page', slug, error: e.message });

    // Write placeholder
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const mdContent = `---
title: "${title}"
slug: "${slug}"
---

Content coming soon.
`;
    await writeFile(`/home/user/thepsychologyhub/src/content/pages/${slug}.md`, mdContent);
    results.pages.push({ slug, title, fallback: true });
  }
}

// Ensure directories exist
await mkdir('/home/user/thepsychologyhub/src/content/clinicians', { recursive: true });
await mkdir('/home/user/thepsychologyhub/src/content/pages', { recursive: true });
await mkdir('/home/user/thepsychologyhub/public/images/clinicians', { recursive: true });
await mkdir('/home/user/thepsychologyhub/public/images/pages', { recursive: true });

// Scrape clinicians
console.log('\n=== Scraping Clinicians ===\n');
for (let i = 0; i < CLINICIAN_SLUGS.length; i++) {
  await scrapeClinicianPage(CLINICIAN_SLUGS[i], i + 1);
}

// Scrape static pages
console.log('\n=== Scraping Static Pages ===\n');
for (const page of STATIC_PAGES) {
  await scrapeStaticPage(page.slug, page.url);
}

// Download logo
console.log('\n=== Downloading Logo ===\n');
const logoUrl = 'https://www.thepsychologyhub.co.nz/wp-content/uploads/2021/10/Asset-4.png';
await downloadImage(logoUrl, '/home/user/thepsychologyhub/public/images/logo.png');
console.log('  ✓ Logo downloaded');

// Summary
console.log('\n=== Summary ===');
console.log(`Clinicians: ${results.clinicians.length} scraped (${results.clinicians.filter(c => c.photo).length} with photos)`);
console.log(`Pages: ${results.pages.length} scraped`);
console.log(`Errors: ${results.errors.length}`);
if (results.errors.length) {
  console.log('\nErrors:');
  results.errors.forEach(e => console.log(`  - [${e.type}] ${e.slug}: ${e.error}`));
}
