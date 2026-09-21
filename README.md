# Padova Tourist Guide

A fast, content-first tourist guide built with Astro, TypeScript, Markdown content
collections, and MapLibre GL JS.

## Requirements

- Node.js 24 LTS (Astro requires Node.js 22.12 or newer)
- npm 10 or newer

## Getting started

```sh
npm install
npm run dev
```

Open `http://localhost:4321`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the production site |
| `npm run preview` | Preview the production build |
| `npm run check` | Run Astro and TypeScript checks |
| `npm test` | Run unit tests once |
| `npm run test:e2e` | Build and run Playwright tests |

Before running browser tests for the first time, install Chromium with
`npm run test:e2e:install`.

## Project structure

```text
public/                  Static files copied as-is
src/
  components/            Reusable Astro UI components
  data/places/           One Markdown file per place
  layouts/               Shared page layouts
  pages/                 File-based routes
  styles/                Global CSS and design tokens
  utils/                 Framework-independent TypeScript helpers
  content.config.ts      Place schema and content collection
scripts/                 Local test-support scripts
tests/                   Playwright end-to-end tests
```

Add a place by copying `src/data/places/prato-della-valle.md`, updating its
frontmatter, and writing the guide text below it. Astro validates every entry
against `src/content.config.ts` during checks and builds.

The guide uses OpenFreeMap's Liberty street-map style by default. It provides
OpenStreetMap-based roads, buildings, parks, waterways, and labels without an
API key. To use another compatible map style, copy `.env.example` to `.env` and
change `PUBLIC_MAP_STYLE_URL`.
