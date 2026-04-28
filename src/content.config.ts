import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const clinicians = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/clinicians' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    qualifications: z.string(),
    photo: z.string().default(''),
    availability: z.boolean().default(false),
    specialties: z.array(z.string()).default([]),
    contact_email: z.string().default(''),
    contact_notes: z.string().optional(),
    display_order: z.number().default(99),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    heroImage: z.string().optional(),
  }),
});

export const collections = { clinicians, pages };
