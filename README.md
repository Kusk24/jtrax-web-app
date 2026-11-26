# JTrax web portal

The JCA Chess Academy portal lets parents manage their children's school activities and students view classes, practise chess, and track progress. Families can also open public tournament registration and results links. The portal uses Next.js, React, Tailwind CSS, and English and Thai messages.

## Run locally

1. Start the [Go backend](https://github.com/Kusk24/jtrax-backend#run-locally) on port 8790.
2. From this repository root, use Node 22.12+ and the pnpm version pinned in [package.json](package.json).

```sh
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Leave `JTRAX_API_URL` unset for the local API. To use another backend, set its full base URL in `.env.local` and restart Next.js. The portal's API proxy attaches the session token on the server.

## Where to make changes

| Area | Start here |
| --- | --- |
| Parent and student screens | [Parent routes](app/parent), [student routes](app/student), [shared components](components) |
| Public tournament pages | [Registration](app/register), [results](app/t), [arrival](app/arrival) |
| Session and data access | [Session helpers](lib/session.ts), [API proxy](app/api/%5B...path%5D/route.ts) |
| Translations | [English and Thai messages](messages) |
| Chess opponents | [Model files and setup](public/models/README.md), [Stockfish worker](public/stockfish/README.md) |

Run `pnpm test` for the test suite, `pnpm lint` for ESLint, and `pnpm build` for the production build. The two trained opponents use separately staged model files. Run `pnpm models:setup` after obtaining the exported weights, or set `NEXT_PUBLIC_MODEL_BASE_URL` to their host.
