import { defineCollection, z } from 'astro:content';

const clinicians = defineCollection({
  type: 'content',
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
  type: 'content',
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = { clinicians, pages };
