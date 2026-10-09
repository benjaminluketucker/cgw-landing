'use strict';
const fs=require('node:fs'),path=require('node:path');
const site=require('./renderer.cjs');
async function build(packet,destination,{readAsset,sourceCommit=null}={}){
 const {job,assets}=packet;
 if(!job||job.template_hash!==site.templateHash)throw Error('The website template changed. Prepare a fresh release.');
 site.validate(job.content);if(site.contentHash(job.content)!==job.content_hash)throw Error('The frozen content hash does not match.');
 fs.mkdirSync(destination,{recursive:true});fs.cpSync(site.templateRoot,destination,{recursive:true});
 const mapped={};
 for(const id of Object.values(job.content.photos).map(p=>p.assetId).filter(Boolean)){
  const asset=assets[id];if(!asset||asset.id!==id||!Array.isArray(asset.outputs)||!asset.outputs.length)throw Error('Missing website photo.');
  const outputs=[];
  for(const out of asset.outputs){if(!/^[a-f0-9]{64}$/.test(out.hash)||!Number.isInteger(out.width)||!Number.isInteger(out.height)||out.width<1||out.height<1)throw Error('Invalid website output.');const bytes=await readAsset(out);if(site.sha(bytes)!==out.hash)throw Error('The website photo hash does not match.');const file='assets/website/'+out.hash+'.webp';fs.mkdirSync(path.join(destination,'assets/website'),{recursive:true});fs.writeFileSync(path.join(destination,file),bytes);outputs.push({...out,url:'/'+file});}
  const full=outputs.find(o=>o.name==='full');if(!full)throw Error('Full resolution photo missing.');mapped[id]={...full,outputs};
 }
 const changedPhotos=Object.values(job.content.photos).some(p=>p.assetId)||['mobile','desktop'].some(view=>['x','y'].some(axis=>job.content.photos.hero[view][axis]!==site.seed.photos.hero[view][axis]));
 if(changedPhotos)fs.writeFileSync(path.join(destination,'website-photos.css'),site.photoStyles(job.content));
 for(const page of ['index','support','privacy','terms','404'])fs.writeFileSync(path.join(destination,page+'.html'),site.render(job.content,page,{assets:mapped,photoCss:changedPhotos}));
 const files={};function walk(dir,prefix=''){for(const name of fs.readdirSync(dir).sort()){const relative=prefix+name,file=path.join(dir,name);if(fs.statSync(file).isDirectory())walk(file,relative+'/');else files[relative]=site.sha(fs.readFileSync(file));}}walk(destination);
 const manifest={version:1,jobId:job.id,contentHash:job.content_hash,templateHash:site.templateHash,sourceCommit,files,artifactHash:site.sha(JSON.stringify(files))};
 fs.writeFileSync(path.join(destination,'website-release.json'),JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
module.exports={build};
