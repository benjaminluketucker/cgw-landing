const test=require('node:test'),assert=require('node:assert/strict');
const config=require('../vercel.json');
test('copied Weekly links reach the same pinned landing page',()=>{
 const rule=config.redirects.find(r=>r.source==='/week/:id');
 assert.ok(rule,'old Weekly URLs currently have no page');
 assert.equal(rule.destination,'/open/weekly-edit?edition=:id');
 assert.equal(rule.permanent,false);
});
test('native-supported week route is retained in Apple association',()=>{
 const fs=require('node:fs');const aasa=JSON.parse(fs.readFileSync(require.resolve('../.well-known/apple-app-site-association'),'utf8'));
 assert.ok(aasa.applinks.details[0].components.some(c=>c['/']==='/week/*'));
});
