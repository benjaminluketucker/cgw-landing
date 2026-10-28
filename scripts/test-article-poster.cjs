const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const id = '1df1adc5-a8ee-43e8-bf74-ebd924db3e8b';
const load = () => require('../api/article-preview.js');
const content = {contentId:id,title:'Jeans and a tee, but make it cool',summary:'Published summary',contentType:'style_guide',contentSource:'shop_the_feed',editorialDate:'2026-10-25',image:{src:'/assets/editorial/'+'a'.repeat(64)+'-1440.webp',alt:'Jeans'},contentBlocks:[{private:'omit'}]};
async function request(query, fetcher, method='GET') {
 const headers={};let status,body;
 await load().createHandler({fetcher})({method,query},{setHeader:(k,v)=>headers[k]=v,status:n=>{status=n;return {end:b=>body=b}},end:b=>body=b});
 return {status,headers,body:body&&JSON.parse(body)};
}
test('signed poster has its own Store button and no image overlay',()=>{
 const html=fs.readFileSync('open/article.html','utf8');
 assert.match(html,/Open in the app/);assert.match(html,/https:\/\/apps.apple.com\/app\/id6812481375/);
 assert.doesNotMatch(html,/app-store-badge|cgw:\/\/"/);assert.match(html,/App not opening\?/);assert.match(html,/Free on iPhone\./);
 const css=fs.readFileSync('open/article-poster.css','utf8');assert.match(css,/#633923/);assert.match(css,/480px minmax\(0, 1fr\)/);
});
test('published exact ID projects only poster fields with no cache or credentials',async()=>{
 const r=await request({kind:'content',id},async(url,opts)=>{assert.equal(url,'https://free.coolgirlwears.app/api/content/'+id);assert.equal(opts.redirect,'error');assert.equal(opts.headers,undefined);return {status:200,ok:true,json:async()=>({ok:true,content})}});
 assert.equal(r.status,200);assert.equal(r.headers['Cache-Control'],'no-store');assert.equal(r.body.article.title,content.title);assert.equal(r.body.article.label,'Style Guide');assert.equal(r.body.article.section,'Shop the Feed');assert.equal(r.body.article.contentBlocks,undefined);
});
for (const status of [404,410,503,429]) test('upstream '+status+' stays distinct',async()=>{
 const r=await request({kind:'content',id},async()=>({status,ok:false}));assert.equal(r.status,status===410?404:status===404?404:503);
});
test('mismatching ID and malformed source fail unavailable',async()=>{
 const r=await request({kind:'article',id},async()=>({status:200,ok:true,json:async()=>({ok:true,content:{...content,contentId:'00000000-0000-4000-8000-000000000000'}})}));assert.equal(r.status,503);
});
test('missing article and unsafe inputs never fetch or claim another article',async()=>{
 for(const query of [{kind:'content',id:'../draft'},{kind:'content',id:[id,id]},{kind:'unknown',id},{kind:'content',id,url:'https://evil.test'}]){
  const r=await request(query,()=>{throw Error('must not fetch')});assert.equal(r.status,400);
 }
});
test('HEAD and non GET do not read publication data',async()=>{
 assert.equal((await request({kind:'content',id},()=>{throw Error('must not fetch')},'HEAD')).status,200);
 assert.equal((await request({kind:'content',id},()=>{throw Error('must not fetch')},'POST')).status,405);
});
test('Interview and Weekly labels derive from data rather than tracking query',()=>{
 assert.equal(load().projectArticle({...content,contentType:'interview'}).label,'Interview');
 assert.equal(load().projectArticle({...content,contentSource:'weekly_edit',contentType:'cool_girl_news'}).label,'The Weekly Edit');
});
test('legacy Weekly section selects exact slug and pinned edition',async()=>{
 let calls=0;const r=await request({kind:'section',id:'cool-girl-news',edition:'2026-10-21'},async url=>{calls++;assert.match(url,/source=weekly_edit/);return {ok:true,status:200,json:async()=>({ok:true,items:[{...content,slug:'cool-girl-news',contentSource:'weekly_edit',provenance:{weekly:{editionId:'2026-10-14'}}},{...content,slug:'cool-girl-news',title:'Pinned',contentSource:'weekly_edit',provenance:{weekly:{editionId:'2026-10-21'}}}],nextCursor:null})}});
 assert.equal(r.status,200);assert.equal(r.body.article.title,'Pinned');assert.equal(calls,1);
});
test('templates and deployment assets remain in step',()=>{
 for(const file of ['article.html','article-poster.css','article-poster.js','article-links.js'])assert.equal(fs.readFileSync('open/'+file,'utf8'),fs.readFileSync('website/template/open/'+file,'utf8'));
 const c=JSON.parse(fs.readFileSync('vercel.json'));assert.equal(c.git.deploymentEnabled['lane/article-link-page-1028'],false);
});
test('partial and failed public-revision headers never publish a plausible poster',async()=>{
 for(const headers of [{'x-cgw-public-completeness':'partial'},{'x-cgw-editorial-revision':'failed'}]){
  const r=await request({kind:'content',id},async()=>({ok:true,status:200,headers:new Headers(headers),json:async()=>({ok:true,content})}));assert.equal(r.status,503);
 }
});
test('preview path refuses traversal and cross-origin identities',()=>{
 const {previewPath}=require('../open/article-poster.js');
 for(const value of ['https://coolgirlwears.app/content/../article/'+id,'https://user@coolgirlwears.app/content/'+id,'https://evil.test/content/'+id])assert.equal(previewPath(value),undefined);
});
