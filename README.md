# MelaChow Rider

Standalone Next.js dashboard for MelaChow delivery riders.

## Scope

- Rider authentication under `/auth/rider`
- Rider dashboard, jobs, wallet, earnings, settings, and notifications under `/rider`
- Private dashboard metadata, robots, and sitemap defaults for a subdomain deployment

## Development

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_RIDER_URL` for production metadata when deploying to a rider subdomain.
