# Cool Girl Wears — landing site

Public site for the Cool Girl Wears iOS app at coolgirlwears.app. Plain static HTML, CSS and one small script. No framework, no build step, no analytics, no cookies.

## Pages

| Path | File |
|---|---|
| `/` | `index.html` |
| `/privacy` | `privacy.html` |
| `/terms` | `terms.html` |
| `/support` | `support.html` |
| `/account-deletion` | redirect to `/support#deleting-your-account` (see `vercel.json`) |
| anything else | `404.html` |

Clean URLs come from `vercel.json` (`cleanUrls: true`). Deploy the repo root as a static site on Vercel.

## Source of truth

- Design: the signed-off Claude Design handoff pack (September 2026). `styles.css` is the design system; the tokens on `:root` are the app's colours.
- Legal copy: the signed-off Privacy Policy, Terms of Use and Support and Account Deletion documents. Verbatim. Do not reword.
- App Store link: `https://apps.apple.com/app/id6812481375` in every badge.

## Assets

`assets/app-store-badge.svg` is Apple's official black "Download on the App Store" badge. Photography is WebP. `assets/og-image.png` is the 1200×630 share image. Favicons at the root are cut from `assets/cgw-icon-1024.png`.
