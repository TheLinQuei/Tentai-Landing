# tentai-landing

Source for **[tentaitech.com](https://tentaitech.com)** — the Tentai Technology landing page.

## How it deploys

- Cloudflare Pages project `tentai-ecosystem` watches this repo's `main` branch.
- Build output directory: `/docs` (everything Cloudflare publishes lives under `docs/`).
- `docs/CNAME` keeps the custom domain mapped to `tentaitech.com`.
- Pushes to `main` auto-deploy within ~1 minute.

## Layout

```
docs/
├── CNAME                # tentaitech.com
├── index.html           # the landing page
└── landing/             # CSS + JS + analytics for index.html
    ├── landing.css
    ├── landing.js
    ├── analytics.js
    └── analytics.config.js
```

## Why this exists separately from `Vi` / `Vigil` / `sol-calendar`

The landing page links *out* to those projects — it isn't where any of them live. They have their own repos and their own deploy cadence. Keeping the marketing surface in its own repo means landing-page tweaks don't churn the product repos' git history.

## Related repos

- [TheLinQuei/Vi](https://github.com/TheLinQuei/Vi) — the AI brain. Lives at `chat.tentaitech.com` (via Open WebUI in front).
- [TheLinQuei/Vigil](https://github.com/TheLinQuei/Vigil) — the Discord port for Vi. Private.
- [TheLinQuei/sol-calendar](https://github.com/TheLinQuei/sol-calendar) — Ethiopian + Gregorian dual calendar product. Embedded on this landing page as a live widget (planned).

## Editing

For text / structure changes, edit `docs/index.html`. For visual styling, `docs/landing/landing.css`. For interactive behavior, `docs/landing/landing.js`. No build step — Cloudflare publishes the static files directly.
