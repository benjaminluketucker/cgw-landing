/* Public poster presentation only. article-links.js remains the handoff owner. */
(function(root){
  'use strict';
  function previewPath(value){
    let url;try{url=new URL(value);}catch{return;}
    if(url.origin!=='https://coolgirlwears.app'||url.username||url.password||url.port)return;
    const rawPath=value.split(/[?#]/,1)[0].replace(/^https:\/\/[^/]+/,'');
    if(rawPath!==url.pathname||rawPath.includes('%'))return;
    const match=/^\/(content|article|section)\/([a-zA-Z0-9][a-zA-Z0-9._~-]{0,179})$/.exec(url.pathname);
    let kind=match?.[1],id=match?.[2];
    if(url.pathname==='/shop-the-feed'&&url.searchParams.getAll('post').length===1){kind='content';id=url.searchParams.get('post');}
    if(!kind||!id||id==='.'||id==='..')return;
    const query=new URLSearchParams({kind,id});
    const edition=url.searchParams.get('edition');
    if(kind==='section'&&edition)query.set('edition',edition);
    return '/api/article-preview?'+query;
  }
  function renderTitle(document,element,title,indexes=[]){
    const words=title.match(/\S+\s*/g)||[];
    const selected=new Set(indexes.length?indexes:[words.length-1]);
    element.replaceChildren();
    words.forEach((word,index)=>{if(selected.has(index)){const i=document.createElement('i');i.textContent=word;element.append(i);}else element.append(document.createTextNode(word));});
  }
  if(typeof module!=='undefined')module.exports={previewPath,renderTitle};
  if(!root.document)return;
  const d=root.document,get=id=>d.getElementById(id);
  const path=previewPath(root.location.href.replace(root.location.origin,'https://coolgirlwears.app'));
  if(!path)return;
  root.fetch(path,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(10000)})
    .then(async response=>{
      if(response.status===404){get('article-title').textContent='This article is no longer available.';get('article-cover').hidden=true;return;}
      if(!response.ok)throw Error('unavailable');
      const data=await response.json();if(!data.ok||!data.article||typeof data.article.title!=='string')throw Error('unavailable');
      const a=data.article;
      d.title=a.title+' · Cool Girl Wears';
      get('article-section').textContent=a.section;
      let date='';
      if(/^\d{4}-\d{2}-\d{2}/.test(a.date)){const parsed=new Date(a.date.slice(0,10)+'T12:00:00Z');if(Number.isFinite(parsed.getTime()))date=parsed.toLocaleDateString('en-AU',{day:'numeric',month:'short',timeZone:'UTC'});}
      get('article-kicker').textContent=a.label+(date?' · '+date:'');
      renderTitle(d,get('article-title'),a.title,a.accentWordIndexes);
      get('article-summary').textContent=a.summary;
      if(a.image){const image=get('article-image');image.onload=()=>{get('article-cover').hidden=false;};image.alt=a.image.alt;image.onerror=()=>{get('article-cover').hidden=true;};image.src=a.image.src;}else{get('article-cover').hidden=true;}
    }).catch(()=>{get('article-cover').hidden=true;get('article-title').textContent='This article cannot load just now.';get('article-summary').textContent='The cover and title could not be loaded. Please try this link again.';});
}(typeof window==='undefined'?globalThis:window));
