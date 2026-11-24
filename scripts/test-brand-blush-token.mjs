// Guard (CGW-2401): the brand blush is defined ONCE, as --cgw-peach in styles.css.
// A typed old blush (#D9A98E / rgb(217,169,142)), a second typed copy of the new blush
// (#E1A786 / rgb(225,167,134)), or a drifted cream fails this test.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN = '#E1A786';
const OLD = /#d9a98e|rgba?\(\s*217\s*,\s*169\s*,\s*142/i;
const NEW = /#e1a786|rgba?\(\s*225\s*,\s*167\s*,\s*134/i;
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    if (n === '.git' || n === 'node_modules' || n === 'scripts') continue;
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(css|html|js|mjs|json|svg|xml|txt|md)$/i.test(n)) files.push(p);
  }
})(root);
const problems = [];
let tokenLines = 0;
for (const f of files) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    const where = `${relative(root, f)}:${i + 1}`;
    if (OLD.test(line)) problems.push(`${where} old blush typed: ${line.trim()}`);
    if (NEW.test(line)) {
      if (relative(root, f) === 'styles.css' && /^\s*--cgw-peach:\s*#E1A786\s*;/i.test(line)) tokenLines++;
      else problems.push(`${where} blush typed again (read var(--cgw-peach)): ${line.trim()}`);
    }
  });
}
const css = readFileSync(join(root, 'styles.css'), 'utf8');
const m = css.match(/--cgw-peach:\s*(#[0-9a-f]{6})/i);
if (!m || m[1].toUpperCase() !== TOKEN) problems.push(`--cgw-peach is ${m && m[1]}, expected ${TOKEN}`);
if (tokenLines !== 1) problems.push(`expected exactly 1 token definition line, found ${tokenLines}`);
const cream = /#F8EBDF/i.test(css);
if (!cream) problems.push('cream #F8EBDF no longer present in styles.css');
if (problems.length) { console.error('brand blush token: FAIL\n' + problems.join('\n')); process.exit(1); }
console.log(`brand blush token: ok (${files.length} product files scanned, token ${TOKEN})`);
