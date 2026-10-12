'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const seed=require('./seed.json');
const slots=['hero','weekly','feed','saved'];
const files=['hero-sienna.webp','f-weekly-edit-2.webp','f-shop-the-feed-2.webp','f-saved-2.webp'];
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function keys(value,allowed){if(!value||Array.isArray(value)||typeof value!=='object'||Object.keys(value).sort().join(',')!==allowed.sort().join(','))throw Error('Unsupported website fields.');}
function text(value,max=600){if(typeof value!=='string'||!value.trim()||value.length>max||/[<>\u0000-\u001f\u2014]/.test(value))throw Error('Use plain text within the field limit.');}
function point(value){keys(value,['x','y']);for(const n of Object.values(value))if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>1)throw Error('Choose a point inside the photo.');}
function validate(c){
 keys(c,Object.keys(seed));if(c.version!==1)throw Error('Unsupported website version.');
 for(const area of ['hero','inside','download','closing','metadata','contact']){keys(c[area],Object.keys(seed[area]));for(const value of Object.values(c[area]))text(value,area==='metadata'?320:600);}
 if(!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(c.contact.email)||c.contact.email!==seed.contact.email)throw Error('The contact must match the locked legal pages. A new contact needs a legal review.');
 if(c.contact.instagramUrl!==seed.contact.instagramUrl)throw Error('Use the approved Instagram account.');
 if(!Array.isArray(c.features)||c.features.length!==3)throw Error('The website has three features.');
 for(const feature of c.features){keys(feature,Object.keys(seed.features[0]));for(const value of Object.values(feature))text(value);}
 keys(c.photos,slots.slice());for(const slot of slots){const p=c.photos[slot];keys(p,Object.keys(seed.photos[slot]));if(p.assetId!==null&&!/^[a-f0-9-]{36}$/.test(p.assetId))throw Error('Choose a website photo.');if(typeof p.alt!=='string'||p.alt.length>160||/[<>\u2014\u0000-\u001f]/.test(p.alt))throw Error('Use a short plain photo description.');point(p.mobile);point(p.desktop);keys(p.crop,['x','y','size']);if(Object.values(p.crop).some(n=>typeof n!=='number'||!Number.isFinite(n))||p.crop.x<0||p.crop.y<0||p.crop.size<=0||p.crop.size>1||p.crop.x>1||p.crop.y>1)throw Error('Keep the square inside the photo.');}
 return c;
}
const templateRoot=path.join(__dirname,'template');
const templateFiles=[];function walkTemplate(dir,prefix='template/'){for(const name of fs.readdirSync(dir).sort()){const file=path.join(dir,name);if(fs.statSync(file).isDirectory())walkTemplate(file,prefix+name+'/');else templateFiles.push(prefix+name);}}walkTemplate(templateRoot);
const templateHash=sha(['renderer.cjs','build.cjs','remote-build.cjs','seed.json',...templateFiles].sort().map(n=>n+'\0'+fs.readFileSync(path.join(__dirname,n))).join('\0'));
function render(c,page='index',{assets={},base='',photoCss=false}={}){
 validate(c);if(!['index','support','privacy','terms','404'].includes(page))throw Error('Unknown page.');
 let html=fs.readFileSync(path.join(templateRoot,page+'.html'),'utf8');
 if(page==='index'){
  const replacements=[
   ['<h1 class="hero-line">'+seed.hero.opening+' <span class="q">'+seed.hero.paragraph+'</span></h1>','<h1 class="hero-line">'+escape(c.hero.opening)+' <span class="q">'+escape(c.hero.paragraph)+'</span></h1>'],
   ['Inside the app',escape(c.inside.eyebrow)],['What you&rsquo;ll <em>find.</em>',escape(c.inside.heading)+' <em>'+escape(c.inside.accent)+'</em>'],
   [seed.inside.intro,escape(c.inside.intro)],['Cool Girl Wears</p>\n      <h2>',escape(c.closing.eyebrow)+'</p>\n      <h2>'],
  ];
  c.features.forEach((f,i)=>{const old=seed.features[i];replacements.push([old.heading+' <em>'+old.accent+'</em>',escape(f.heading)+' <em>'+escape(f.accent)+'</em>']);for(const key of ['first','second'])replacements.push([escape(old[key]).replaceAll('’','&rsquo;'),escape(f[key])]);});
  // Unique placeholders avoid cascading replacements when copy matches another field.
  replacements.forEach(([from],i)=>{if(!html.includes(from))throw Error('Website template has changed.');html=html.replace(from,'@@CGW'+i+'@@');});
  replacements.forEach(([from,to],i)=>html=html.replace('@@CGW'+i+'@@',()=>from.replaceAll('&rsquo;','’')===to?from:to));
  for(const [attribute,value]of [['name="description"',c.metadata.description],['property="og:description"',c.metadata.description],['name="twitter:description"',c.metadata.description],['property="og:title"',c.metadata.title],['name="twitter:title"',c.metadata.title]])html=html.replace(new RegExp('(<meta '+attribute+' content=")[^"]*(">)'),(_,a,b)=>a+escape(value)+b);
  html=html.replace(/<title>.*?<\/title>/,()=>'<title>'+escape(c.metadata.title)+'</title>');
  html=html.replace('>Instagram</a>',()=>'>'+escape(c.contact.instagramLabel)+'</a>');
  slots.forEach((slot,i)=>{const photo=c.photos[slot],asset=assets[photo.assetId];if(photo.assetId&&!asset)throw Error('Website photo is unavailable.');if(asset){html=html.replace('/assets/'+files[i],()=>asset.url);const marker=slot==='hero'?'class="hero-portrait"':'class="shot"';const expression=new RegExp('<img '+marker+'[^>]*>','g');let count=-1;html=html.replace(expression,tag=>{if(slot!=='hero'&&++count!==i-1)return tag;const sizes=slot==='hero'?'(min-width: 700px) 50vw, 100vw':'(min-width: 700px) calc((100vw - 160px) / 3), calc(100vw - 48px)';const variants=(asset.outputs||[]).map(o=>o.url+' '+o.width+'w').join(', ');return tag.replace(/width="\d+"/,'width="'+asset.width+'"').replace(/height="\d+"/,'height="'+asset.height+'"').replace('>',variants?' srcset="'+variants+'" sizes="'+sizes+'">':'>');});}const old='alt="'+seed.photos[slot].alt+'"';const match=html.indexOf(slot==='hero'?'class="hero-portrait"':'src="'+(asset?asset.url:'/assets/'+files[i])+'"');if(match>=0){const end=html.indexOf('>',match);html=html.slice(0,match)+html.slice(match,end).replace(old,()=>'alt="'+escape(photo.alt)+'"')+html.slice(end);}});
 }
 html=html.replaceAll('Free on <em>iPhone.</em>',()=>escape(c.download.heading)+' <em>'+escape(c.download.accent)+'</em>');
 if(photoCss&&page==='index')html=html.replace('</head>','<link rel="stylesheet" href="/website-photos.css">\n</head>');
 if(base){html=html.replace(/srcset="([^"]*)"/g,(_,value)=>'srcset="'+value.replace(/\/assets\//g,base+'/assets/')+'"');html=html.replace(/(href|src)="\/(?!\/)([^"]*)"/g,(_,attr,target)=>{if(/^assets\/|^(styles|fonts|menu|website-photos)\.|^favicon|^apple-touch/.test(target))return attr+'="'+base+'/'+target+'"';if(['','support','privacy','terms','404'].includes(target))return attr+'="'+base+'/'+target+'"';return attr+'="/'+target+'"';});}
 return html;
}
function photoStyles(c){validate(c);const f=(p)=>`${p.x*100}% ${p.y*100}%`;let css=`.hero-portrait{object-position:${f(c.photos.hero.desktop)}}\n`;slots.slice(1).forEach((s,i)=>{if(c.photos[s].assetId)css+=`.feature:nth-child(${i+1}) .shot{object-position:50% 50%}\n`;});return css+`@media(max-width:699px){.hero-portrait{object-position:${f(c.photos.hero.mobile)}}}\n`;}
function contentHash(content){validate(content);const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;return sha(JSON.stringify(canonical(content)));}
module.exports={contentHash,seed,validate,render,slots,templateHash,sha,photoStyles,templateRoot};
