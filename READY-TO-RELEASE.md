> 30 October R2 dry-run handoff: see [RELEASE-STEPS.md](RELEASE-STEPS.md). Matching template/local packet prepared; protected-source adoption still blocks activation. The historical identities and CI policy below are not current release authorization.

# Article link poster: release handoff, 28 October 2026

Prepared only. No deployment, promotion, alias, environment change, publication, account or data write is authorized by this file.

## Candidates and ownership

- cgw-app branch `lane/article-link-page-free-1028`, based on the current Free web source `a3ccd68a1d409e85eaf66ce188f30e2ad8bec6aa`. The candidate is the commit containing this file; record its full SHA with `git rev-parse HEAD` and verify the pushed branch equals it.
- cgw-landing branch `lane/article-link-page-1028`, based on the latest landing source `9762edafff37163cc4ccb79329e60cd7cb299e3d`. Its independent checkout is `.cgw-article-link-landing/` inside this worktree. Record its full SHA separately. It is deliberately excluded from the app Git tree.
- Public `coolgirlwears.app` belongs to `cgw-landing` (`prj_yoIR8n7hVye6u96Im2gsfKTPMDcd`), current live source `0471deeff074f1491e66de44e89a65d34bc36cf8`, deployment `dpl_BcQRVJWjSiBMEBuUQCqQ8hh3bXBv`.
- Legacy `free.coolgirlwears.app` belongs to `cgw-free-app` (`prj_GhR9VKWuimtoyIP7Au1CsOcGL6DD`), current live source is the Free parent above, deployment `dpl_PRH74hmDfvkwdr5EVGoHsrTWXQpL`.

Full source identities, browser comparisons, timing/idle data, demonstrated-red controls, exact check results and limitations are in `~/CLAUDE/cgw-codex-jobs/article-link-page-1028/RESULTS.md` and `evidence/`.

## COMPOSITION

Published content APIs remain the only availability/title/summary/cover/format authority. The public landing uses a bounded, credential-free, no-store projection; Free uses its existing metadata reader and action/count endpoints. Missing, partial and failed reads stay distinct. Neither implementation reads drafts or stores article/account data. Both use the same signed CSS and four unchanged artboards. The real published copy and photography can differ from a historical artboard example.

Public universal links are delivered by iOS before HTTP; the unchanged landing scheme handoff remains available when HTTP is reached. Free's explicit Open action still returns its existing exact article/section scheme. This is not a repair to installed native entitlements or native URL delivery. The newer native helper files on the original c3464d35 app line are not copied into this separate Free web line.

AASA, Apple private `/content/...` entry, ReviewGate, native intent, Vercel routing and public section/email routing retain their current Free source. Home and Shop collection fallback rendering retains its own existing path. No Paid or Dashboard release is implied.

The latest landing line also contains the prepared Website editor builder. Its frozen template hash changes when the protected article page changes. Do not bypass that check or publish an old Dashboard Website packet over the poster. Before using that builder, carry the reviewed `website/template/open/article*` files and normalized section Store URLs into the Dashboard's matching frozen website source, then prepare a fresh immutable job with its matching template hash. This lane does not deploy or activate that editor.

## Checks before any release

1. Obtain the coordinator's named release approval. Re-read both live identities and the latest serving branches. If either moved, compose only this change onto that source and repeat affected proof.
2. Verify clean app and landing trees and full remote SHA readbacks. App focused check: `npm run test:smart-article-links`; lint: `npm run lint`, Node 24. Landing focused check: `node --test scripts/*.cjs`, Node 24.
3. Require the single exact-head full CI run recorded in RESULTS. A red/pending/skipped check is not a pass; diagnose all affected failures. The standing shared-Mac rule uses GitHub CI as the full preflight; no local full preflight or slot manipulation was run.
4. Run the Free release runbook and scoped release rules from this exact source. Review the request with `node scripts/vercel-scoped-release.mjs free FULL_APP_SHA lane/article-link-page-free-1028 production`; only after authorization append `--apply`. This creates one Git-connected staged artifact without domain assignment. Never use a local source upload.
5. For landing, request a Git-connected build of its exact full SHA for the named landing project, without assigning production aliases. Resolve the frozen Website builder/template dependency above first. Keep this branch's automatic-deployment guard until a deliberate build is authorized. Do not use `vercel deploy` or change project credentials/settings incidentally.
6. On both immutable hosted candidates, verify exact source identity/READY state, actual CSP, decoded covers/fonts, all four artboards, Safari and Instagram-like UA, all three formats, absent/withdrawn and unavailable articles, all Open/Store destinations, section/email links and unchanged AASA. Repeat matched open/refresh measurements and at least three minutes of idle.
7. Re-prove Apple's actual private gate and recorded `/content/...` entry on the Free candidate, without exposing review credentials. The static source-preservation test is not a hosted sign-in journey.
8. On a real iPhone record installed app/build/update and iOS/Instagram versions. Test installed/not-installed, cold/warm Safari/Mail/Instagram taps, exact article and Weekly section, signed-out return and Store route. Existing entitlement/Welcome delivery gaps are not fixed by this page. Require human acceptance before claiming in-app opening.
9. Only when the applicable release gates pass, assign each project's existing aliases to its already-verified immutable artifact. Verify production identities, both aliases, HTTP 200 routes and runtime logs. No build or promotion was performed in this lane.

## Rollback

Record both previous deployment IDs immediately before a release. If a gate fails, keep existing aliases. If post-release readback fails, restore only that project's aliases to the recorded previous READY deployment, verify identities/AASA/private entry and route 200, then stop. There is no data, schema, native, account or provider-setting rollback in this change.

## Evidence ceiling

Verified: source-level routing/private-entry preservation, focused tests and local headless rendering of the actual handlers. Claimed: Ben's sign-off, supplied in the four signed artboards/canvas notes. Unknown until the release checks above: candidate hosted behavior, a real phone's installed/noninstalled handoff and reader rendering, native speed/refresh/idle, and live product acceptance. Local timing is not a hosted-candidate speed claim.
