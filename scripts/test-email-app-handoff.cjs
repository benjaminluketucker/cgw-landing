const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const origin = 'https://coolgirlwears.app';
const id = 'b6e7d341-628b-4e1f-9600-266bb559d904';
const edition = '2026-11-09-edit-c2bd0cacf77f';
function browser(path, options = {}) {
 const calls = [], listeners = [], button = {hidden: true, getAttribute(k) { return this[k]; }, setAttribute(k,v) { this[k]=v; }};
 let state = options.state ?? {reader: 'retained'};
 const banner = {setAttribute(k,v) { this[k]=v; }};
 const win = {document: {visibilityState: options.hidden ? 'hidden':'visible', prerendering: options.prerendering, getElementById: () => button, querySelector: () => banner}, navigator: {userAgent: options.ua ?? 'iPhone Gmail/6.0', platform: options.platform ?? 'iPhone', maxTouchPoints: options.touch ?? 0}, location: {href: origin+path, pathname: path.split('?')[0], search: new URL(origin+path).search, assign(value) { calls.push(value); if(options.blocked)throw Error('gesture required'); }}, history: {get state() {return state;}, replaceState(value) {if(options.historyBlocked)throw Error('blocked'); state=value;}}, addEventListener(...args) {listeners.push(args);}};
 const context = vm.createContext({window:win, document:win.document, navigator:win.navigator, URL, URLSearchParams, Set});
 const run = () => { for(const file of ['article-links.js','app-links.js'])vm.runInContext(fs.readFileSync(require.resolve('../open/'+file),'utf8'),context); };
 run(); return {calls,button,banner,run,get state() {return state;},listeners};
}
for (const [path,target] of [
 ['/article/'+id+'?articleSource=weekly_edit&utm_source=email','cgw://article/'+id+'?articleSource=weekly_edit'],
 ['/open/weekly-edit?edition='+edition+'&utm_source=email','cgw://week/'+edition],
 ['/open/shop-the-feed?utm_source=email','cgw://shop-the-feed'],
 ['/open/shop-the-feed?post='+id,'cgw://content/'+id+'?articleSource=shop_the_feed'],
 ['/content/'+id+'?y=123#look-2','cgw://content/'+id+'?y=123#look-2'],
 ['/open/discover','cgw://discover'],
 ['/open/weekly-edit','cgw://']
])test('one exact iOS handoff, manual fallback and no refresh retry: '+path,()=>{
 const b=browser(path); assert.deepEqual(b.calls,[target]); assert.equal(b.button.href,target); assert.equal(b.button.hidden,false); assert.equal(b.state.reader,'retained'); b.run(); assert.deepEqual(b.calls,[target]); assert.match(b.banner.content,new RegExp('app-argument='+target.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 const reload=browser(path,{state:b.state});assert.deepEqual(reload.calls,[]);assert.equal(reload.button.href,target);
});
for(const ua of ['Android Chrome/141','Macintosh Safari/605','Windows Chrome/141'])test('no auto-open on '+ua,()=>assert.deepEqual(browser('/article/'+id,{ua,platform:'Linux'}).calls,[]));
test('desktop-mode iPad opens the same pinned edition',()=>assert.deepEqual(browser('/open/weekly-edit?edition='+edition,{ua:'Macintosh Safari/605',platform:'MacIntel',touch:5}).calls,['cgw://week/'+edition]));
for(const opts of [{hidden:true},{prerendering:true},{historyBlocked:true}])test('manual fallback without automatic attempt: '+JSON.stringify(opts),()=>{const b=browser('/article/'+id,opts);assert.deepEqual(b.calls,[]);assert.equal(b.button.href,'cgw://article/'+id);});
test('blocked scheme remains one attempt with working manual link',()=>{const b=browser('/article/'+id,{blocked:true});b.run();assert.deepEqual(b.calls,['cgw://article/'+id]);assert.equal(b.button.href,b.calls[0]);});
for(const path of ['/open/weekly-edit?edition=../secret','/open/weekly-edit?edition=x&edition=y','/open/weekly-edit?edition=','/open/shop-the-feed?post=bad','/open/shop-the-feed?post='+id+'&post='+id,'/article/%2fadmin','/open/unknown'])test('invalid identity never opens home: '+path,()=>assert.deepEqual(browser(path).calls,[]));
test('all fallback documents show the approved simple choices and load the common handoff',()=>{
 for(const page of ['article','weekly-edit','shop-the-feed','discover']){const html=fs.readFileSync(require.resolve('../open/'+page+'.html'),'utf8');assert.match(html,/Open in the Cool Girl Wears app/);assert.match(html,/Don't have it\? Get it on the App Store/);assert.match(html,/https:\/\/apps.apple.com/);assert.match(html,/src="\/open\/app-links.js"/);assert.doesNotMatch(html,/free\.coolgirlwears|href="cgw:\/\/"/);}
});
