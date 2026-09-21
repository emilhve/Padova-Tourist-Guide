import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const places = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/places' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['landmark', 'museum', 'church', 'food', 'park']),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    address: z.string(),
    featured: z.boolean().default(false),
    order: z.number().int().nonnegative().default(0),
  }),
});

export const collections = { places };
