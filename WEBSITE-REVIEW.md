Website editor repair handoff, 12 October 2026.

The public site and origin/main still use d34d6d79d130df4fb47d1c4482bf337b154e3c51. Read-only home, Support, Privacy and Terms byte checks identify that source; newer privacy/address changes are held and excluded. This branch already contains that source and the reviewed frozen-content builder plus the F1 website-routing.json readback copy.

The renderer must remain byte-identical to editorial-dashboard/website on codex/cgw-website-editor-r2-20261012. Node 24 local builds use the real remote-build transport with an isolated fixture response. No production build input, deployment hook or provider mutation is part of this repair.

Keep the Website switch and worker OFF. Hosted staging still needs passing comparable Lighthouse mobile/desktop scores (performance >=95, no category regression, zero third-party requests), the reviewed Headless Shell executable, effective parent/child CSP and named-session/storage allow/deny checks. Verify clean routes, .html 308 controls, website-routing.json exact bytes and the custom 404 on the actual hosted artifact before activation.

Full results and local evidence: ~/CLAUDE/cgw-codex-jobs/website-editor-fix/RESULTS.md.

ROUND 2, 12 October: authored text now uses callback replacements, preserving literal dollar patterns on Home and the shared legal-page chrome. The matching Dashboard repair uses 055-website-editor.sql after 054-paid-ops-files.sql from Paid Ops commit 7117744bbe8dafdf1848f6c3d15f61fae72ed6d7. All legal-body bytes remain fixed; Website and worker remain OFF. Current SHAs, hashes and validation are recorded under ROUND 2 in the Results document above.
