'use strict';
// Only the existing public publication reader decides whether a poster exists.
// No credentials, draft reads, persistence or last-good article cache.
const ORIGIN = 'https://free.coolgirlwears.app';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN = /^[a-zA-Z0-9][a-zA-Z0-9._~-]{0,179}$/;
const labels = {style_guide:'Style Guide', interview:'Interview', brand_find:'Brand Finds', outfit_idea:'Outfit Ideas'};
function projectArticle(content) {
  if (!content || !UUID.test(content.contentId) || typeof content.title !== 'string' || !content.title.trim()
    || !['shop_the_feed','guide','weekly_edit'].includes(content.contentSource)) throw Error('invalid_public_article');
  const weekly = content.contentSource === 'weekly_edit';
  const image = content.image;
  // Owned public media already has a same-origin, read-only rewrite. Never turn
  // a published string into an arbitrary media proxy or inject it into markup.
  let src = null;
  if(typeof image?.src==='string') {
    try {
      const url=new URL(image.src,'https://coolgirlwears.app');
      if(['https://coolgirlwears.app','https://free.coolgirlwears.app','https://app.coolgirlwears.app'].includes(url.origin)
        && !url.username && !url.password && !url.search && !url.hash
        && /^\/(?:assets\/(?:editorial|shop-the-feed)|weekly-edit)\/[a-zA-Z0-9/._-]+\.(?:webp|png|jpe?g)$/.test(url.pathname)
        && !image.src.split('/').includes('..'))src=url.pathname.startsWith('/weekly-edit/')?'/article-media'+url.pathname:url.pathname;
    }catch{ /* An unsupported image cannot change the article or its actions. */ }
  }
  return {
    contentId:content.contentId, title:content.title.slice(0,500), summary:typeof content.summary === 'string' ? content.summary.slice(0,1000) : '',
    label:weekly ? 'The Weekly Edit' : labels[content.contentType] || '',
    section:weekly ? 'The Weekly Edit' : content.contentSource === 'guide' ? 'Discover' : 'Shop the Feed',
    date:content.editorialDate || content.contentPublishedAt || '',
    image:src ? {src,alt:typeof image.alt === 'string' ? image.alt.slice(0,500) : ''} : null,
    accentWordIndexes:Array.isArray(content.titleAccentWordIndexes) ? content.titleAccentWordIndexes.filter(Number.isInteger) : Number.isInteger(content.titleAccentWordIndex) ? [content.titleAccentWordIndex] : [],
  };
}
async function jsonRead(response) {
  if(response.headers?.get('x-cgw-public-completeness')==='partial'||response.headers?.get('x-cgw-editorial-revision')==='failed')throw Error('public_read_incomplete');
  if (!response.body?.getReader) return response.json();
  const reader = response.body.getReader();const chunks=[];let bytes=0;
  try { for (;;) {const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>2*1024*1024)throw Error('public_response_too_large');chunks.push(Buffer.from(part.value));} }
  finally {await reader.cancel().catch(()=>{});}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function createHandler({fetcher=fetch}={}) {
  return async (req,res) => {
    res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options','nosniff');
    const send=(status,body)=>res.status(status).end(req.method==='HEAD'?undefined:JSON.stringify(body));
    if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return send(405,{ok:false});}
    const q=req.query||{};
    if(Object.keys(q).some(k=>!['kind','id','edition'].includes(k)) || !['content','article','section'].includes(q.kind)
      || typeof q.id!=='string' || !TOKEN.test(q.id) || ['.','..'].includes(q.id)
      || (q.kind==='content'&&!UUID.test(q.id)) || (q.edition!==undefined&&(typeof q.edition!=='string'||!TOKEN.test(q.edition))))return send(400,{ok:false});
    if(req.method==='HEAD')return send(200);
    const signal=AbortSignal.timeout(8000);
    async function read(path){
      const response=await fetcher(ORIGIN+path,{redirect:'error',signal});
      if(response.status===404||response.status===410)return null;
      if(!response.ok)throw Error('public_read_unavailable');
      const data=await jsonRead(response);if(!data||data.ok!==true||data.completeness==='partial')throw Error('public_read_unavailable');return data;
    }
    try {
      let content;
      if(UUID.test(q.id)) {
        const data=await read('/api/content/'+q.id.toLowerCase());
        if(!data)return send(404,{ok:false,error:'missing'});
        content=data.content;
        if(typeof content?.contentId!=='string'||content.contentId.toLowerCase()!==q.id.toLowerCase())throw Error('wrong_article');
      } else {
        // Same bounded public identity scan used by the app's legacy
        // resolver. Never choose today's article for a pinned old edition.
        let cursor;const seen=new Set();
        for(let page=0;page<8;page++) {
          const params=new URLSearchParams({...(q.kind==='section'?{source:'weekly_edit'}:{}),limit:'50',...(cursor?{cursor}: {})});
          const data=await read('/api/content?'+params);
          if(!data||!Array.isArray(data.items))throw Error('invalid_public_list');
          content=data.items.find(c=>(q.kind!=='section'||c.contentSource==='weekly_edit')&&c.slug===q.id&&(!q.edition||c.provenance?.weekly?.editionId===q.edition));
          if(content)break;
          if(!data.nextCursor)return send(404,{ok:false,error:'missing'});
          if(typeof data.nextCursor!=='string'||seen.has(data.nextCursor))throw Error('invalid_public_cursor');
          seen.add(data.nextCursor);cursor=data.nextCursor;
        }
        if(!content)throw Error('scan_incomplete');
      }
      return send(200,{ok:true,article:projectArticle(content)});
    }catch{return send(503,{ok:false,error:'unavailable'});}
  };
}
module.exports=createHandler();module.exports.createHandler=createHandler;module.exports.projectArticle=projectArticle;
