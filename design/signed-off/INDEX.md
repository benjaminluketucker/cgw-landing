# Signed article link page

Ben's 25 October 2026 brown poster is the design authority. The supplied artboards and canvas notes are retained unchanged.

| Artboard | Viewport | Implementation | Contract |
| --- | --- | --- | --- |
| [Style guide](article-link-page-20261025/LinkFinal.dc.html) | 390 x 1280 | open/article.html, open/article-poster.css/js | scripts/test-article-poster.cjs |
| [Interview](article-link-page-20261025/LinkFinalIV.dc.html) | 390 x 1280 | Same poster, published interview data | Same contract |
| [Weekly Edit](article-link-page-20261025/LinkFinalWE.dc.html) | 390 x 1280 | Same poster, published Weekly data | Same contract |
| [Desktop](article-link-page-20261025/LinkFinalDesk.dc.html) | 1440 x 920 | Same poster, desktop media rules | Same contract |

`api/article-preview.js` reads only the public published data authority. The frozen `website/template/open/article*` copies retain the same implementation. Original canvas `_blob` image bytes were not supplied; local layout comparisons use published covers on both sides, and separate browser journeys use actual public data. This record adopts the signed design; it does not revise its copy, colors, geometry or imagery decisions.
